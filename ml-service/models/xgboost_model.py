import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.preprocessing import StandardScaler
import logging

logger = logging.getLogger(__name__)

class XGBoostForecaster:
    """
    XGBoost forecasting with feature engineering
    """
    
    def __init__(self, n_lags: int = 7, n_estimators: int = 100):
        """
        Args:
            n_lags: Number of lag features to create
            n_estimators: Number of boosting rounds
        """
        self.n_lags = n_lags
        self.n_estimators = n_estimators
        self.model = None
        self.scaler = StandardScaler()
        
    def create_features(self, data: pd.DataFrame, target_col: str = 'sales', granularity: str = 'daily') -> pd.DataFrame:
        """
        Create lag features and rolling statistics with adaptive selection based on granularity
        """
        df = data.copy()
        
        # Adaptive lag selection based on granularity
        if granularity == 'daily':
            lag_periods = [1, 7, 14, 30]  # 1 day, 1 week, 2 weeks, 1 month
            rolling_windows = [3, 7, 14, 30]
        elif granularity == 'weekly':
            lag_periods = [1, 4, 12, 52]  # 1 week, 1 month, 1 quarter, 1 year
            rolling_windows = [4, 12, 26]
        elif granularity == 'monthly':
            lag_periods = [1, 3, 6, 12]  # 1, 3, 6, 12 months
            rolling_windows = [3, 6, 12]
        else:
            lag_periods = list(range(1, min(self.n_lags + 1, 8)))
            rolling_windows = [3, 7, 14]
        
        # Lag features
        for lag in lag_periods:
            if lag <= len(df):
                df[f'lag_{lag}'] = df[target_col].shift(lag)
        
        # Rolling statistics (only if we have enough data)
        for window in rolling_windows:
            if len(df) >= window:
                df[f'rolling_mean_{window}'] = df[target_col].shift(1).rolling(window=window).mean()
                df[f'rolling_std_{window}'] = df[target_col].shift(1).rolling(window=window).std()
                df[f'rolling_min_{window}'] = df[target_col].shift(1).rolling(window=window).min()
                df[f'rolling_max_{window}'] = df[target_col].shift(1).rolling(window=window).max()
        
        # Exponential moving average (trend indicator)
        if len(df) >= 7:
            df['ema_7'] = df[target_col].shift(1).ewm(span=7, adjust=False).mean()
        if len(df) >= 30:
            df['ema_30'] = df[target_col].shift(1).ewm(span=30, adjust=False).mean()
        
        # Trend features
        if len(df) >= 7:
            # Rate of change
            df['roc_7'] = df[target_col].pct_change(periods=7)
        
        # Time-based features (if date index exists)
        if isinstance(df.index, pd.DatetimeIndex):
            df['day_of_week'] = df.index.dayofweek
            df['day_of_month'] = df.index.day
            df['month'] = df.index.month
            df['quarter'] = df.index.quarter
            df['year'] = df.index.year
            
            # Calendar indicators
            df['is_weekend'] = (df.index.dayofweek >= 5).astype(int)
            df['is_month_start'] = (df.index.day <= 7).astype(int)
            df['is_month_end'] = (df.index.day >= df.index.days_in_month - 7).astype(int)
            df['is_quarter_end'] = df.index.month.isin([3, 6, 9, 12]).astype(int)
            
            # Interaction features (lag × day_of_week for capturing weekly patterns)
            if 'lag_1' in df.columns:
                df['lag1_x_dow'] = df['lag_1'] * df['day_of_week']
        
        return df
    
    def fit_predict(
        self,
        data: pd.Series,
        horizon: int,
        granularity: str = 'daily'
    ) -> np.ndarray:
        """
        Fit XGBoost model and generate predictions
        
        Args:
            data: Historical time series data
            horizon: Number of periods to forecast
            
        Returns:
            Array of predictions
        """
        try:
            # Convert to DataFrame
            df = pd.DataFrame({'sales': data})
            
            # Create features
            df = self.create_features(df, granularity=granularity)
            
            # Drop rows with NaN (from lag features)
            df_clean = df.dropna()
            
            if len(df_clean) < 10:
                logger.warning("Insufficient data for XGBoost, falling back to naive")
                return np.full(horizon, data.iloc[-1])
            
            # Prepare training data
            feature_cols = [col for col in df_clean.columns if col != 'sales']
            X = df_clean[feature_cols]
            y = df_clean['sales']
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train model
            self.model = XGBRegressor(
                n_estimators=self.n_estimators,
                max_depth=5,
                learning_rate=0.1,
                random_state=42,
                verbosity=0
            )
            self.model.fit(X_scaled, y)
            
            # Recursive forecasting
            predictions = []
            current_series = data.copy()
            
            # Identify frequency for date increment
            freq = 'D'
            if isinstance(data.index, pd.DatetimeIndex) and data.index.freq:
                freq = data.index.freq
            
            for step in range(horizon):
                # Convert back to DataFrame to create features
                temp_df = pd.DataFrame({'sales': current_series})
                temp_df = self.create_features(temp_df, granularity=granularity)
                
                # Get last row features
                last_row = temp_df.iloc[[-1]][feature_cols]
                last_row_scaled = self.scaler.transform(last_row)
                
                # Predict
                pred = self.model.predict(last_row_scaled)[0]
                pred = max(0, pred)  # Ensure non-negative
                predictions.append(pred)
                
                # Update current_series for next iteration with correct index increment
                new_date = current_series.index[-1] + pd.tseries.frequencies.to_offset(freq)
                current_series[new_date] = pred
            
            predictions = np.array(predictions)
            logger.info(f"XGBoost forecast completed: {len(predictions)} predictions")
            return predictions
            
        except Exception as e:
            logger.error(f"XGBoost forecasting error: {str(e)}")
            # Fallback to naive forecast
            logger.warning("Falling back to naive forecast")
            return np.full(horizon, data.iloc[-1])
