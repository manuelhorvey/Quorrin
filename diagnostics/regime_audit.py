import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from models.regime.regime_classifier import RegimeClassifier

class RegimeAudit:
    """
    Diagnostic suite for validating Regime Classifier structural integrity.
    """
    def __init__(self, classifier: RegimeClassifier):
        self.classifier = classifier

    def calculate_entropy(self, df: pd.DataFrame) -> float:
        """Calculates Shannon entropy of regime distribution."""
        probs = df['regime'].value_counts(normalize=True)
        if probs.empty: return 0.0
        return -np.sum(probs * np.log2(probs))

    def calculate_persistence(self, df: pd.DataFrame) -> float:
        """Calculates median run length of consecutive identical regimes."""
        if df.empty: return 0.0
        regime_change = df['regime'] != df['regime'].shift()
        run_ids = regime_change.cumsum()
        run_lengths = df.groupby(run_ids)['regime'].count()
        return run_lengths.median()

    def run_audit(self, features: pd.DataFrame, asset_name: str = "Asset") -> dict:
        """Runs full suite of diagnostics on classified features."""
        df = self.classifier.classify(features)
        df['year'] = df.index.year
        
        # 1. Yearly Heatmap
        yearly_dist = df.groupby('year')['regime'].value_counts(normalize=True).unstack().fillna(0)
        
        # 2. Entropy & Persistence
        entropy = self.calculate_entropy(df)
        persistence = self.calculate_persistence(df)
        
        # 3. Gearbox Score (Entropy penalized by short run lengths)
        gearbox_score = entropy * min(1.0, persistence / 10.0)
        
        # 4. Confidence Gaps
        prob_cols = [c for c in df.columns if c.startswith('P_')]
        if len(prob_cols) >= 2:
            top_2 = np.partition(df[prob_cols].values, -2, axis=1)[:, -2:]
            conf_gap = (top_2[:, 1] - top_2[:, 0]).mean()
        else:
            conf_gap = 0.0
        
        report = {
            'asset': asset_name,
            'total_distribution': df['regime'].value_counts(normalize=True).to_dict(),
            'yearly_distribution': yearly_dist,
            'entropy': entropy,
            'median_run_length': persistence,
            'gearbox_score': gearbox_score,
            'avg_confidence_gap': conf_gap
        }
        
        return report

    def grid_search_thresholds(self, features: pd.DataFrame, 
                               conf_range: list, 
                               smoothing_range: list):
        """Systematic search for optimal parameters based on Gearbox Score."""
        results = []
        for c in conf_range:
            for s in smoothing_range:
                self.classifier.confidence_threshold = c
                self.classifier.smoothing_window = s
                
                report = self.run_audit(features, "Search")
                results.append({
                    'conf': c,
                    'smooth': s,
                    'entropy': report['entropy'],
                    'persistence': report['median_run_length'],
                    'gearbox_score': report['gearbox_score'],
                    'dist': report['total_distribution']
                })
        
        # Sort by Gearbox Score
        results.sort(key=lambda x: x['gearbox_score'], reverse=True)
        return results

def print_audit_report(report: dict):
    print(f"\n{'='*20} REGIME AUDIT: {report['asset']} {'='*20}")
    print(f"Gearbox Score:     {report['gearbox_score']:.4f}")
    print(f"Total Entropy:     {report['entropy']:.4f} (Ideal > 1.0)")
    print(f"Median Run Length: {report['median_run_length']:.1f} bars (Target >= 10)")
    print(f"Avg Confidence Gap: {report['avg_confidence_gap']:.4f}")
    
    print("\nTotal Distribution:")
    for r in sorted(report['total_distribution'].keys()):
        p = report['total_distribution'][r]
        print(f"  {r.upper():<10}: {p:.2%}")
        
    print("\nYearly Heatmap (%):")
    print((report['yearly_distribution'] * 100).round(1))

if __name__ == "__main__":
    import os
    try:
        feature_path = "data/processed/EURUSD_regime_features.parquet"
        if not os.path.exists(feature_path):
            print(f"Error: {feature_path} not found.")
        else:
            features = pd.read_parquet(feature_path)
            classifier = RegimeClassifier()
            audit = RegimeAudit(classifier)
            
            print("Running initial audit...")
            report = audit.run_audit(features, "EURUSD_Initial")
            print_audit_report(report)
            
            print("\nRunning Systematic Grid Search...")
            conf_range = [0.35, 0.40, 0.45, 0.50]
            smooth_range = [5, 10, 15]
            
            search_results = audit.grid_search_thresholds(features, conf_range, smooth_range)
            
            print(f"\n{'='*10} TOP 3 PARAMETER SETS {'='*10}")
            for i, res in enumerate(search_results[:3]):
                print(f"\nRank {i+1}: Conf={res['conf']}, Smooth={res['smooth']}")
                print(f"  Gearbox Score: {res['gearbox_score']:.4f}")
                print(f"  Entropy:       {res['entropy']:.4f}")
                print(f"  Persistence:   {res['persistence']:.1f}")
                print(f"  Distribution:  ", {k: f"{v:.1%}" for k, v in res['dist'].items()})
    except Exception as e:
        import traceback
        traceback.print_exc()
