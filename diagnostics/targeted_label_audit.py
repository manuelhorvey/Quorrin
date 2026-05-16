import pandas as pd
import numpy as np

def targeted_label_audit():
    try:
        # Load datasets
        signals = pd.read_parquet("data/processed/EURUSD_signals.parquet")
        labeled_data = pd.read_parquet("data/processed/EURUSD_labeled.parquet")
        raw_data = pd.read_parquet("data/raw/EURUSD_1d.parquet")
        
        # Align
        df = signals.join(labeled_data['label'], how='inner')
        
        # 1. Label Distribution in TREND
        trend_df = df[df['regime'] == 'trend']
        print("\n--- 1. Label Distribution in TREND Regime ---")
        print(trend_df['label'].value_counts(normalize=True))
        
        # 2. Manual Direction Verification (5 random samples)
        print("\n--- 2. Manual Direction Verification (TREND) ---")
        samples = trend_df.sample(5).index
        for idx in samples:
            entry = raw_data.loc[idx, 'close']
            # Look ahead 20 bars
            future = raw_data.loc[idx:].iloc[1:21]['close']
            max_gain = (future.max() - entry) / entry
            max_loss = (future.min() - entry) / entry
            label = trend_df.loc[idx, 'label']
            print(f"Date: {idx.date()} | Label={label:+d} | Max Gain: {max_gain:.2%} | Max Loss: {max_loss:.2%}")

        # 3. Check for specific class bias
        # Are signals generated more for one label?
        print("\n--- 3. Signal vs Label Matrix (TREND) ---")
        print(pd.crosstab(trend_df['label'], trend_df['signal']))

    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    targeted_label_audit()
