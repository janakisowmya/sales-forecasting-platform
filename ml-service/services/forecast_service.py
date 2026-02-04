import pandas as pd
import numpy as np
from typing import Dict, List, Literal
import logging

from models.baseline import BaselineForecaster
from models.arima import ARIMAForecaster
from models.xgboost_model import XGBoostForecaster
from services.data_loader import load_data_from_url, preprocess_data, validate_data
from services.metrics import calculate_metrics

logger = logging.getLogger(__name__)

ModelType = Literal['baseline', 'arima', 'xgboost', 'auto']
Granularity = Literal['daily', 'weekly', 'monthly']

class ForecastService:
    """
    Main forecasting service that orchestrates model selection and execution
    """
    
    def auto_select_model(
        self,
        train_series: pd.Series,
        test_series: pd.Series,
        granularity: Granularity = 'daily'
    ) -> tuple[ModelType, Dict]:
        """
        Automatically select the best model based on validation performance
        
        Args:
            train_series: Training data
            test_series: Test/validation data
            granularity: Time granularity
            
        Returns:
            Tuple of (best_model_type, model_scores)
        """
        logger.info("Auto-selecting best model...")
        
        # Use smaller horizon for validation (last 20% of test set or max 30 periods)
        val_horizon = min(len(test_series), 30)
        
        model_scores = {}
        
        # Test each model
        for model_type in ['baseline', 'arima', 'xgboost']:
            try:
                logger.info(f"Testing {model_type} model...")
                
                if model_type == 'baseline':
                    forecaster = BaselineForecaster(method='seasonal_naive')
                    predictions = forecaster.fit_predict(train_series, val_horizon)
                    
                elif model_type == 'arima':
                    forecaster = ARIMAForecaster()
                    predictions = forecaster.fit_predict(train_series, val_horizon, auto_order=True)
                    
                elif model_type == 'xgboost':
                    forecaster = XGBoostForecaster(n_lags=7)
                    predictions = forecaster.fit_predict(train_series, val_horizon, granularity=granularity)
                
                # Calculate metrics on test set
                actual_vals = test_series.values[:val_horizon]
                pred_vals = predictions[:len(actual_vals)]
                
                metrics = calculate_metrics(actual_vals, pred_vals)
                model_scores[model_type] = {
                    'accuracy': metrics['accuracy'],
                    'mae': metrics['mae'],
                    'rmse': metrics['rmse'],
                    'r2': metrics['r2']
                }
                
                logger.info(f"{model_type}: accuracy={metrics['accuracy']}%, R²={metrics['r2']}")
                
            except Exception as e:
                logger.warning(f"{model_type} failed during auto-selection: {e}")
                model_scores[model_type] = {'accuracy': 0, 'mae': float('inf'), 'rmse': float('inf'), 'r2': -1}
        
        # Select best model based on accuracy (or R² if accuracy is similar)
        best_model = max(model_scores.items(), key=lambda x: (x[1]['accuracy'], x[1]['r2']))[0]
        
        logger.info(f"Auto-selected model: {best_model} (accuracy={model_scores[best_model]['accuracy']}%)")
        
        return best_model, model_scores
    
    def run_forecast(
        self,
        dataset_url: str,
        model_type: ModelType,
        horizon: int,
        granularity: Granularity = 'daily'
    ) -> Dict:
        """
        Run forecast using specified model
        
        Args:
            dataset_url: URL to dataset (S3 presigned URL)
            model_type: Type of model to use
            horizon: Number of periods to forecast
            granularity: Time granularity
            
        Returns:
            Dictionary with predictions and metrics
        """
        try:
            logger.info(f"Starting forecast: model={model_type}, horizon={horizon}, granularity={granularity}")
            
            # Load and preprocess data
            df = load_data_from_url(dataset_url)
            validate_data(df)
            
            train_series, test_series = preprocess_data(df, granularity=granularity)
            
            # Auto-select model if requested
            if model_type == 'auto':
                model_type, model_scores = self.auto_select_model(train_series, test_series, granularity)
                logger.info(f"Auto-selected {model_type} model")
            
            # Select and run model
            if model_type == 'baseline':
                forecaster = BaselineForecaster(method='seasonal_naive')
                predictions = forecaster.fit_predict(train_series, horizon)
                
            elif model_type == 'arima':
                forecaster = ARIMAForecaster()
                predictions = forecaster.fit_predict(train_series, horizon, auto_order=True)
                
            elif model_type == 'xgboost':
                forecaster = XGBoostForecaster(n_lags=7)
                predictions = forecaster.fit_predict(train_series, horizon, granularity=granularity)
                
            else:
                raise ValueError(f"Unknown model type: {model_type}")
            
            # Calculate metrics using test set
            if len(test_series) > 0:
                # Use test set for validation
                test_predictions = predictions[:len(test_series)]
                metrics = calculate_metrics(test_series.values, test_predictions)
            else:
                # If no test set, use last N values of train set
                n = min(horizon, len(train_series) // 5)
                if n > 0:
                    val_actual = train_series.iloc[-n:].values
                    val_pred = predictions[:n]
                    metrics = calculate_metrics(val_actual, val_pred)
                else:
                    # Default metrics if validation not possible
                    metrics = {'mae': 0, 'rmse': 0, 'mape': 0, 'accuracy': 0}
            
            # Generate future dates
            last_date = train_series.index[-1]
            if granularity == 'daily':
                future_dates = pd.date_range(last_date, periods=horizon + 1, freq='D')[1:]
            elif granularity == 'weekly':
                future_dates = pd.date_range(last_date, periods=horizon + 1, freq='W')[1:]
            elif granularity == 'monthly':
                future_dates = pd.date_range(last_date, periods=horizon + 1, freq='M')[1:]
            
            # Format predictions
            prediction_list = [
                {
                    'date': date.strftime('%Y-%m-%d'),
                    'value': float(value)
                }
                for date, value in zip(future_dates, predictions)
            ]
            
            result = {
                'predictions': prediction_list,
                'metrics': metrics
            }
            
            logger.info(f"Forecast completed successfully: {len(prediction_list)} predictions, accuracy={metrics['accuracy']}%")
            
            return result
            
        except Exception as e:
            logger.error(f"Forecast error: {str(e)}", exc_info=True)
            raise

# Create singleton instance
forecast_service = ForecastService()
