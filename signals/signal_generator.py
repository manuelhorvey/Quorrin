import pandas as pd
import numpy as np
from models.regime.regime_classifier import RegimeClassifier
from models.mean_reversion.mr_model import MeanReversionModel
from models.volatility.vol_model import BreakoutModel

class HeuristicTrendModel:
    """
    Simple trend-following heuristic for verification.
    """
    def predict(self, features: pd.DataFrame) -> pd.Series:
        # Use EMA spread and MACD diff
        # Higher spread/diff -> High probability of continuation
        spread_prob = (features['ema_spread'] * 100.0).clip(-0.5, 0.5) + 0.5
        macd_std = features['macd_diff'].rolling(100).std().fillna(0.001)
        macd_prob = (features['macd_diff'] / (macd_std * 0.5)).clip(-1.0, 1.0) / 2.0 + 0.5
        return (spread_prob * 0.5 + macd_prob * 0.5)

class RegimeAwareSignalGenerator:
    """
    Institutional Gearbox Signal Engine.
    Routes to specialized models and applies dynamic thresholds/scaling.
    """
    def __init__(self, trend_model=None):
        self.regime_classifier = RegimeClassifier(confidence_threshold=0.45)
        self.mr_model = MeanReversionModel()
        self.vol_model = BreakoutModel()
        self.trend_model = trend_model if trend_model is not None else HeuristicTrendModel()

    def generate_signals(self, 
                         base_features: pd.DataFrame, 
                         regime_features: pd.DataFrame) -> pd.DataFrame:
        """
        Main routing logic.
        """
        # 1. Classify Regime
        regime_data = self.regime_classifier.classify(regime_features)
        
        # 2. Layer 1: Model Selection & Base Probabilities
        results = regime_data.copy()
        results['raw_prob'] = 0.5 # Default neutral probability
        
        # Route to MR Model for RANGE
        range_mask = (results['regime'] == 'range')
        if range_mask.any():
            results.loc[range_mask, 'raw_prob'] = self.mr_model.predict(base_features.loc[range_mask])
            
        # Route to Vol Model for VOLATILE
        vol_mask = (results['regime'] == 'volatile')
        if vol_mask.any():
            results.loc[vol_mask, 'raw_prob'] = self.vol_model.predict(base_features.loc[vol_mask])
            
        # Route to Trend Model for TREND (and Neutral - with lower weight)
        trend_mask = (results['regime'] == 'trend') | (results['regime'] == 'neutral')
        if trend_mask.any():
            # Support both sklearn-style predict_proba and simple predict
            if hasattr(self.trend_model, 'predict_proba'):
                trend_probs = self.trend_model.predict_proba(base_features.loc[trend_mask])
                results.loc[trend_mask, 'raw_prob'] = trend_probs[:, 2] # Prob of label 1
            else:
                results.loc[trend_mask, 'raw_prob'] = self.trend_model.predict(base_features.loc[trend_mask])
            
        # 3. Layer 2: Dynamic Signal Thresholding
        results['signal'] = 0
        
        # Define thresholds per regime
        thresholds = {
            'trend': (0.58, 0.42),
            'range': (0.60, 0.40),
            'volatile': (0.62, 0.38),
            'neutral': (0.75, 0.25)
        }
        
        for regime, (upper, lower) in thresholds.items():
            mask = (results['regime'] == regime)
            results.loc[mask & (results['raw_prob'] > upper), 'signal'] = 1
            results.loc[mask & (results['raw_prob'] < lower), 'signal'] = -1
            
        # 4. Layer 3: Risk Scaling Multipliers
        multipliers = {
            'trend': 1.0,
            'range': 0.9,
            'volatile': 0.5,
            'neutral': 0.25
        }
        results['risk_multiplier'] = results['regime'].map(multipliers)
        
        return results

if __name__ == "__main__":
    # Test routing logic
    try:
        base = pd.read_parquet("data/processed/EURUSD_features.parquet")
        regime = pd.read_parquet("data/processed/EURUSD_regime_features.parquet")
        
        # Align indices
        common_idx = base.index.intersection(regime.index)
        base = base.loc[common_idx]
        regime = regime.loc[common_idx]
        
        generator = RegimeAwareSignalGenerator()
        signals = generator.generate_signals(base, regime)
        
        print("\nSignal Summary:")
        print(signals['signal'].value_counts())
        
        print("\nRegime vs Signal Cross-tab:")
        print(pd.crosstab(signals['regime'], signals['signal']))
        
        # Save signals
        signals.to_parquet("data/processed/EURUSD_signals.parquet")
        print("\nSaved signals to data/processed/EURUSD_signals.parquet")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Signal generation failed: {e}")
