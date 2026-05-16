import yfinance as yf
import pandas as pd
import os

def download_data(symbol: str, interval: str = "1d", period: str = "max") -> pd.DataFrame:
    """
    Downloads historical data from yfinance.
    
    Args:
        symbol: yfinance symbol (e.g., 'EURUSD=X')
        interval: '1d', '1h', etc.
        period: 'max', '5y', etc.
    
    Returns:
        pd.DataFrame: Cleaned OHLCV data
    """
    print(f"Downloading {symbol} ({interval}) for period: {period}...")
    ticker = yf.Ticker(symbol)
    df = ticker.history(period=period, interval=interval)
    
    if df.empty:
        raise ValueError(f"No data found for {symbol}")
        
    # Clean up column names
    df.columns = [col.lower() for col in df.columns]
    
    # Ensure directory exists
    os.makedirs("data/raw", exist_ok=True)
    
    # Save as parquet
    filename = f"data/raw/{symbol.replace('=X', '')}_{interval}.parquet"
    df.to_parquet(filename)
    print(f"Saved to {filename}")
    
    return df

if __name__ == "__main__":
    # Test download
    download_data("EURUSD=X", interval="1d", period="10y")
