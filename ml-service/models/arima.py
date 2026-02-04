import pandas as pd
import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.stattools import adfuller, acf
from statsmodels.tsa.seasonal import seasonal_decompose
import logging
import warnings

warnings.filterwarnings('ignore')
logger = logging.getLogger(__name__)

class ARIMAForecaster:
    """
    ARIMA (AutoRegressive Integrated Moving Average) forecasting
    """
    
    def __init__(self, order=(1, 1, 1), seasonal_order=(0, 0, 0, 0)):
        """
        Args:
            order: (p, d, q) for ARIMA
            seasonal_order: (P, D, Q, s) for seasonal ARIMA
        """
        self.order = order
        self.seasonal_order = seasonal_order
        self.model = None
        
    def detect_seasonality(self, data: pd.Series) -> tuple:
        """
        Automatically detect seasonal period and strength using ACF analysis
        
        Returns:
            (seasonal_period, has_seasonality) tuple
        """
        try:
            # Need at least 2 full seasonal cycles for reliable detection
            if len(data) < 20:
                return (0, False)
            
            # Calculate autocorrelation
            nlags = min(len(data) // 2, 50)
            acf_values = acf(data.dropna(), nlags=nlags, fft=True)
            
            # Find peaks in ACF (potential seasonal periods)
            # Look for significant autocorrelation (> 0.3) at regular intervals
            potential_periods = []
            
            # Check common seasonal periods based on data frequency
            if isinstance(data.index, pd.DatetimeIndex):
                freq = data.index.freqstr or pd.infer_freq(data.index)
                
                if freq and 'D' in freq:
                    # Daily data: check for weekly (7), bi-weekly (14), monthly (30)
                    candidates = [7, 14, 30]
                elif freq and 'W' in freq:
                    # Weekly data: check for monthly (4), quarterly (13), yearly (52)
                    candidates = [4, 13, 52]
                elif freq and ('M' in freq or 'MS' in freq):
                    # Monthly data: check for quarterly (3), semi-annual (6), yearly (12)
                    candidates = [3, 6, 12]
                else:
                    candidates = [7, 12, 30]  # Default candidates
            else:
                candidates = [7, 12, 30]
            
            # Filter candidates that are within our data range
            candidates = [c for c in candidates if c < len(acf_values)]
            
            # Find the candidate with strongest autocorrelation
            best_period = 0
            best_acf = 0.3  # Minimum threshold for seasonality
            
            for period in candidates:
                if acf_values[period] > best_acf:
                    best_acf = acf_values[period]
                    best_period = period
            
            has_seasonality = best_period > 0
            
            # Additional validation: try seasonal decomposition if we found a period
            if has_seasonality and len(data) >= 2 * best_period:
                try:
                    decomposition = seasonal_decompose(
                        data.dropna(), 
                        model='additive', 
                        period=best_period,
                        extrapolate_trend='freq'
                    )
                    # Check if seasonal component has meaningful variance
                    seasonal_strength = decomposition.seasonal.std() / data.std()
                    if seasonal_strength < 0.1:  # Seasonal component too weak
                        has_seasonality = False
                        best_period = 0
                except:
                    # Decomposition failed, fall back to ACF result
                    pass
            
            logger.info(f"Seasonality detection: period={best_period}, strength={best_acf:.3f}, has_seasonality={has_seasonality}")
            return (best_period, has_seasonality)
            
        except Exception as e:
            logger.warning(f"Seasonality detection failed: {e}, assuming no seasonality")
            return (0, False)
    
    def auto_select_order(self, data: pd.Series) -> tuple:
        """
        Calculates ARIMA (p,d,q) and seasonal order (P,D,Q,s) using statistical tests
        """
        # Check stationarity
        adf_result = adfuller(data.dropna())
        is_stationary = adf_result[1] < 0.05
        
        # Standard orders
        d = 0 if is_stationary else 1
        p, q = 1, 1
        
        # Detect seasonality automatically
        seasonal_period, has_seasonality = self.detect_seasonality(data)
        
        if has_seasonality and seasonal_period > 0:
            # Only use SARIMA if we have enough data (at least 2 seasonal cycles)
            if len(data) >= 2 * seasonal_period:
                self.seasonal_order = (1, 1, 1, seasonal_period)
                logger.info(f"Using SARIMA with seasonal period {seasonal_period}")
            else:
                self.seasonal_order = (0, 0, 0, 0)
                logger.info(f"Insufficient data for SARIMA (need {2*seasonal_period}, have {len(data)}), using ARIMA")
        else:
            self.seasonal_order = (0, 0, 0, 0)
            logger.info("No significant seasonality detected, using ARIMA")
        
        logger.info(f"Auto-selected orders - ARIMA: ({p}, {d}, {q}), Seasonal: {self.seasonal_order}")
        return (p, d, q)
        
    def fit_predict(
        self,
        data: pd.Series,
        horizon: int,
        auto_order: bool = True
    ) -> np.ndarray:
        """
        Fit SARIMAX model and generate predictions
        """
        try:
            # Auto-select order if requested
            if auto_order:
                self.order = self.auto_select_order(data)
            
            # Use seasonal_order if detected or provided
            self.model = SARIMAX(
                data,
                order=self.order,
                seasonal_order=self.seasonal_order,
                enforce_stationarity=False,
                enforce_invertibility=False
            )
            
            # Adaptive maxiter based on data size and model complexity
            is_seasonal = self.seasonal_order[3] > 0
            data_size = len(data)
            
            # More iterations for seasonal models and larger datasets
            if is_seasonal and data_size > 100:
                maxiter = 100
            elif is_seasonal:
                maxiter = 75
            elif data_size > 200:
                maxiter = 75
            else:
                maxiter = 50
            
            try:
                fitted_model = self.model.fit(disp=False, maxiter=maxiter)
            except:
                # Fallback to non-seasonal if SARIMA fails (common on very short series)
                logger.warning("SARIMA fit failed, falling back to basic ARIMA")
                self.model = SARIMAX(data, order=self.order)
                fitted_model = self.model.fit(disp=False, maxiter=50)
            
            # Generate forecast
            forecast = fitted_model.forecast(steps=horizon)
            predictions = forecast.values
            
            # --- SAFETY RAILS ---
            # 1. Non-negative
            predictions = np.maximum(predictions, 0)
            
            # 2. Divergence Check: If predictions are astronomical (e.g. > 100x max historical)
            # this indicates an unstable model (unit root explosion).
            if not data.empty:
                historical_max = data.max()
                # Use a larger threshold if max is 0
                threshold = max(historical_max * 100, 1e9)
                
                if np.any(predictions > threshold):
                    logger.warning(f"Divergence detected in ARIMA! Prediction reached {np.max(predictions)}. Falling back to naive.")
                    last_value = data.iloc[-1]
                    return np.full(horizon, last_value)
                
                # 3. Soft Cap: Even if not exploding, cap at a reasonable multiple for safety
                predictions = np.minimum(predictions, historical_max * 10)

            logger.info(f"ARIMA forecast completed: {len(predictions)} predictions")
            return predictions
            
        except Exception as e:
            logger.error(f"ARIMA forecasting error: {str(e)}")
            # Fallback to naive forecast
            logger.warning("Falling back to naive forecast")
            last_value = data.iloc[-1] if not data.empty else 0
            return np.full(horizon, last_value)
