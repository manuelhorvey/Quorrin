import pandas as pd
import numpy as np
from data.loaders.downloader import download_data
from features.regime_features import generate_regime_features
from diagnostics.regime_audit import RegimeAudit, print_audit_report
from models.regime.regime_classifier import RegimeClassifier

def validate_asset(symbol: str, name: str):
    print(f"\nProcessing {name} ({symbol})...")
    # 1. Download (already done in previous step, but safe to call)
    df = download_data(symbol, interval="1d", period="10y")
    
    # 2. Features
    features = generate_regime_features(df)
    
    # 3. Audit
    classifier = RegimeClassifier()
    audit = RegimeAudit(classifier)
    report = audit.run_audit(features, name)
    print_audit_report(report)
    return report

if __name__ == "__main__":
    eurusd = validate_asset("EURUSD=X", "EURUSD")
    gbpusd = validate_asset("GBPUSD=X", "GBPUSD")
    gold = validate_asset("GC=F", "Gold")
    
    # Check Volatile Difference
    v_gold = gold['total_distribution'].get('volatile', 0)
    v_eur = eurusd['total_distribution'].get('volatile', 0)
    
    print(f"\n{'='*20} CROSS-ASSET COMPARISON {'='*20}")
    print(f"EURUSD Volatile %: {v_eur:.2%}")
    print(f"Gold   Volatile %: {v_gold:.2%}")
    print(f"Difference:       {v_gold - v_eur:.2%}")
    
    if (v_gold - v_eur) >= 0.05:
        print("\nSUCCESS: Gold volatile proportion is at least 5% higher than EURUSD.")
    else:
        print("\nWARNING: Volatile separation target not met.")
