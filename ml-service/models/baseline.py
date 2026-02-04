import pandas as pd
import numpy as np
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)

class BaselineForecaster:
    """
    Baseline forecasting methods:
    - Naive: Last value repeated
    - Seasonal Naive: Last season's value repeated
    - Moving Average: Simple moving average
    """
    
    def __init__(self, method: str = 'naive'):
        """
        Args:
            method: 'naive', 'seasonal_naive', or 'moving_average'
        """
        self.method = method
        
    def fit_predict(
        self,
        data: pd.Series,
        horizon: int,
        seasonal_period: int = 7
    ) -> np.ndarray:
        """
        Fit and predict using baseline method
        
        Args:
            data: Historical time series data
            horizon: Number of periods to forecast
            seasonal_period: Period for seasonal naive (default 7 for weekly)
            
        Returns:
            Array of predictions
        """
        if self.method == 'naive':
            # Repeat last value
            last_value = data.iloc[-1]
            predictions = np.full(horizon, last_value)
            
        elif self.method == 'seasonal_naive':
            # Repeat last season's pattern
            predictions = []
            for i in range(horizon):
                idx = -(seasonal_period - (i % seasonal_period))
                if abs(idx) <= len(data):
                    predictions.append(data.iloc[idx])
                else:
                    predictions.append(data.iloc[-1])
            predictions = np.array(predictions)
            
        elif self.method == 'moving_average':
            # Simple moving average
            window = min(7, len(data))
            ma_value = data.iloc[-window:].mean()
            predictions = np.full(horizon, ma_value)
            
        else:
            raise ValueError(f"Unknown method: {self.method}")
            
        logger.info(f"Baseline {self.method} forecast: {len(predictions)} predictions")
        return predictions
