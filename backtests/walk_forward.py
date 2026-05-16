import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.metrics import accuracy_score

def calculate_metrics(returns, signals):
    """
    Calculates key performance metrics for a strategy.
    """
    strategy_returns = returns * signals
    
    if len(strategy_returns) == 0 or strategy_returns.std() == 0:
        return {
            "sharpe": 0, "max_dd": 0, "win_rate": 0, "profit_factor": 0, "trades": 0
        }
        
    # Annualized Sharpe (assuming daily data)
    sharpe = np.sqrt(252) * strategy_returns.mean() / strategy_returns.std()
    
    # Max Drawdown
    cum_returns = (1 + strategy_returns).cumprod()
    peak = cum_returns.cummax()
    drawdown = (cum_returns - peak) / peak
    max_dd = drawdown.min()
    
    # Win Rate (on non-zero signals)
    trades = signals[signals != 0]
    wins = strategy_returns[signals != 0] > 0
    win_rate = wins.mean() if len(trades) > 0 else 0
    
    # Profit Factor
    pos_returns = strategy_returns[strategy_returns > 0].sum()
    neg_returns = abs(strategy_returns[strategy_returns < 0].sum())
    profit_factor = pos_returns / neg_returns if neg_returns != 0 else np.inf
    
    return {
        "sharpe": round(sharpe, 2),
        "max_dd": round(max_dd, 3),
        "win_rate": round(win_rate, 3),
        "profit_factor": round(profit_factor, 2),
        "trades": len(trades)
    }

def run_walk_forward(data_path: str, raw_data_path: str):
    df = pd.read_parquet(data_path)
    raw_df = pd.read_parquet(raw_data_path)
    
    # Ensure index is datetime
    df.index = pd.to_datetime(df.index).tz_localize(None)
    raw_df.index = pd.to_datetime(raw_df.index).tz_localize(None)
    
    raw_returns = raw_df['close'].pct_change()

    splits = [
        ("2015-01-01", "2019-01-01", "2019-01-01", "2019-07-01"),
        ("2015-01-01", "2019-07-01", "2019-07-01", "2020-01-01"),
        ("2015-01-01", "2020-01-01", "2020-01-01", "2020-07-01"),
        ("2015-01-01", "2020-07-01", "2020-07-01", "2021-01-01"),
        ("2015-01-01", "2021-01-01", "2021-01-01", "2021-07-01"),
        ("2015-01-01", "2021-07-01", "2021-07-01", "2022-01-01"),
    ]
    
    results = []
    
    print(f"{'Window':<25} | {'Sharpe':<6} | {'MaxDD':<7} | {'Win%':<6} | {'PF':<4} | {'Trades':<6}")
    print("-" * 75)
    
    for train_start, train_end, test_start, test_end in splits:
        train_df = df[(df.index >= train_start) & (df.index < train_end)]
        test_df = df[(df.index >= test_start) & (df.index < test_end)]
        
        if len(train_df) < 100 or len(test_df) < 20:
            # Skip if not enough data
            continue
            
        X_train = train_df.drop('label', axis=1)
        y_train = train_df['label'] + 1 # Map to 0, 1, 2
        
        X_test = test_df.drop('label', axis=1)
        
        # Train Model
        model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=3,
            learning_rate=0.05,
            objective='multi:softprob',
            random_state=42
        )
        model.fit(X_train, y_train)
        
        # Predict
        preds = model.predict(X_test) - 1 # Map back to -1, 0, 1
        
        # Calculate performance for this window
        window_returns = raw_returns.loc[test_df.index]
        metrics = calculate_metrics(window_returns, preds)
        
        window_name = f"{test_start} -> {test_end}"
        print(f"{window_name:<25} | {metrics['sharpe']:<6} | {metrics['max_dd']:<7} | {metrics['win_rate']:<6} | {metrics['profit_factor']:<4} | {metrics['trades']:<6}")
        
        results.append(metrics)
        
    if not results:
        print("No windows were processed.")
        return
        
    # Summary Statistics
    results_df = pd.DataFrame(results)
    print("\n" + "="*30)
    print("WALK-FORWARD SUMMARY")
    print("="*30)
    print(f"Average Sharpe:  {results_df['sharpe'].mean():.2f}")
    print(f"Sharpe Std Dev:  {results_df['sharpe'].std():.2f}")
    print(f"Average Win Rate: {results_df['win_rate'].mean():.2%}")
    print(f"Average Max DD:  {results_df['max_dd'].mean():.2%}")
    print(f"Total Trades:    {results_df['trades'].sum()}")
    
if __name__ == "__main__":
    run_walk_forward(
        "data/processed/EURUSD_features.parquet",
        "data/raw/EURUSD_1d.parquet"
    )
