import pandas as pd
import numpy as np
from typing import Tuple
import requests
import logging
from io import StringIO
from services.cache import dataset_cache

logger = logging.getLogger(__name__)

def load_data_from_url(url: str) -> pd.DataFrame:
    """
    Load CSV data from URL (S3 presigned URL or HTTP) with caching
    
    Args:
        url: URL to CSV file
        
    Returns:
        DataFrame with loaded data
    """
    try:
        # Check cache first
        cached_df = dataset_cache.get(url, granularity='raw')
        if cached_df is not None:
            logger.info(f"Using cached data: {len(cached_df)} rows")
            return cached_df
        
        logger.info(f"Loading data from URL...")
        
        # Download file
        response = requests.get(url, timeout=60)
        response.raise_for_status()
        
        # Parse CSV
        df = pd.read_csv(StringIO(response.text))
        
        # Clean column names (remove BOMs and unexpected whitespace)
        df.columns = df.columns.str.strip().str.replace('\ufeff', '')
        
        # Cache the result
        dataset_cache.set(url, df, granularity='raw')
        
        logger.info(f"Data loaded: {len(df)} rows, {len(df.columns)} columns")
        return df
        
    except Exception as e:
        logger.error(f"Error loading data: {str(e)}")
        raise

def preprocess_data(
    df: pd.DataFrame,
    date_col: str = 'date',
    value_col: str = 'sales',
    granularity: str = 'daily'
) -> Tuple[pd.Series, pd.Series]:
    """
    Preprocess data for forecasting
    
    Args:
        df: Input DataFrame
        date_col: Name of date column
        value_col: Name of value column (sales)
        granularity: Time granularity (daily, weekly, monthly)
        
    Returns:
        Tuple of (train_series, test_series) for validation
    """
    try:
        # Detect date column if not specified
        if date_col not in df.columns:
            date_cols = [col for col in df.columns if 'date' in col.lower() or 'time' in col.lower() or 'day' in col.lower() or 'month' in col.lower() or 'year' in col.lower()]
            if date_cols:
                date_col = date_cols[0]
                logger.info(f"Auto-detected date column: {date_col}")
            else:
                raise ValueError(f"Time-series forecasting requires a date/time column. Found columns: {', '.join(df.columns.tolist())}")
        
        # Detect value column if not specified
        if value_col not in df.columns:
            # Prioritize columns that are likely to be sales but NOT names (like "Sales Person")
            potential_cols = [col for col in df.columns if any(x in col.lower() for x in ['sales', 'revenue', 'amount', 'value', 'price', 'quantity'])]
            
            # Find the best numeric candidate among matches
            numeric_match = None
            for col in potential_cols:
                # If it's already numeric, perfect
                if pd.api.types.is_numeric_dtype(df[col]):
                    numeric_match = col
                    break
                # If it's a string, see if it looks like currency
                if df[col].dtype == object and df[col].astype(str).str.contains('[\$0-9]', regex=True).any():
                    numeric_match = col
                    break
            
            value_col = numeric_match if numeric_match else (potential_cols[0] if potential_cols else 'sales')
            logger.info(f"Auto-detected value column: {value_col}")
        
        # 0. CURRENCY HANDLING: Clean numeric data (strip $ and ,)
        if value_col in df.columns and df[value_col].dtype == object:
            # Handle possible string formatting in currency columns
            logger.info(f"Cleaning currency formatting in column: {value_col}")
            df[value_col] = df[value_col].astype(str).str.replace('$', '', regex=False).str.replace(',', '', regex=False).str.strip()
            df[value_col] = pd.to_numeric(df[value_col], errors='coerce').fillna(0)
        
        # Convert date column to datetime with robust parsing
        # Try a few common formats first to avoid day/month ambiguity
        try:
            # Try to infer format from first few rows
            df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
        except:
            df[date_col] = pd.to_datetime(df[date_col], format='mixed', errors='coerce')

        # Drop rows with invalid dates
        cleaned_df = df.dropna(subset=[date_col])
        if len(cleaned_df) < len(df):
            logger.warning(f"Dropped {len(df) - len(cleaned_df)} rows with invalid dates")
        df = cleaned_df
        
        # 1. AGGREGATE: Group by date and sum values to handle multiple entries per date
        logger.info(f"Aggregating data by {date_col}...")
        df = df.groupby(date_col)[value_col].sum().reset_index()
        
        # 2. SORT: Ensure chronological order
        df = df.sort_values(date_col)
        
        # 3. RESAMPLE: Ensure strict frequency and handle gaps
        df = df.set_index(date_col)
        
        if granularity == 'daily':
            df = df.resample('D').sum()
        elif granularity == 'weekly':
            df = df.resample('W').sum()
        elif granularity == 'monthly':
            df = df.resample('MS').sum() # Month Start to be consistent
        
        # Create final time series
        series = df[value_col]
        
        # Handle gaps (missing values)
        # We fill genuine NaNs (missing dates) with 0 or interpolation if needed.
        # But we stop replacing actual 0 sales with previous values, as it smudges variance.
        series = series.fillna(0)
        
        # Split into train/test (80/20)
        split_idx = int(len(series) * 0.8)
        train_series = series[:split_idx]
        test_series = series[split_idx:]
        
        logger.info(f"Data preprocessed: {len(train_series)} train, {len(test_series)} test samples")
        
        return train_series, test_series
        
    except Exception as e:
        logger.error(f"Error preprocessing data: {str(e)}")
        raise

def validate_data(df: pd.DataFrame) -> bool:
    """
    Validate that data is suitable for forecasting
    """
    if df.empty:
        raise ValueError("Dataset is empty")
    
    if len(df) < 10:
        raise ValueError("Dataset too small (minimum 10 rows required)")
    
    return True
