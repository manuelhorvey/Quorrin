import pandas as pd
import numpy as np

class MeanReversionModel:
    """
    Specialized model for RANGE regimes.
    Focuses on RSI and Bollinger Band reversals.
    """
    def predict(self, features: pd.DataFrame) -> pd.Series:
        """
        Generates buy/sell/hold probabilities.
        """
        # CORRECT MEAN REVERSION LOGIC:
        # Oversold (Low RSI/Z) -> High Prob (Expect Up)
        # Overbought (High RSI/Z) -> Low Prob (Expect Down)
        
        # rsi 30 -> 1.0 (Oversold), rsi 70 -> 0.0 (Overbought)
        # Formula: (70 - RSI) / 40
        rsi_prob = ((70 - features['rsi']) / 40.0).clip(0, 1)
        
        # bb_zscore -2 -> 1.0 (Oversold), bb_zscore 2 -> 0.0 (Overbought)
        # Formula: (2 - Z) / 4
        z_prob = ((2.0 - features['bb_zscore']) / 4.0).clip(0, 1)
        
        # Combine
        prob = (rsi_prob + z_prob) / 2.0
        
        return prob

if __name__ == "__main__":
    # Test with dummy or base features
    try:
        data = pd.read_parquet("data/processed/EURUSD_features.parquet")
        model = MeanReversionModel()
        probs = model.predict(data)
        print("\nMean Reversion Probs (Sample):")
        print(probs.tail())
    except Exception as e:
        print(f"MR Model test failed: {e}")
