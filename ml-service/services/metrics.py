import numpy as np
from typing import Dict
import logging

logger = logging.getLogger(__name__)

def calculate_metrics(actual: np.ndarray, predicted: np.ndarray) -> Dict[str, float]:
    """
    Calculate comprehensive forecasting accuracy metrics
    
    Args:
        actual: Actual values
        predicted: Predicted values
        
    Returns:
        Dictionary with MAE, RMSE, MAPE, sMAPE, R², and accuracy
    """
    # Ensure arrays are same length
    min_len = min(len(actual), len(predicted))
    actual = actual[:min_len]
    predicted = predicted[:min_len]
    
    # Mean Absolute Error
    mae = np.mean(np.abs(actual - predicted))
    
    # Root Mean Squared Error
    rmse = np.sqrt(np.mean((actual - predicted) ** 2))
    
    # Mean Absolute Percentage Error (traditional)
    # Avoid division by zero
    mask = actual != 0
    if mask.sum() > 0:
        mape = np.mean(np.abs((actual[mask] - predicted[mask]) / actual[mask])) * 100
    else:
        mape = 0.0
    
    # Symmetric MAPE (handles zeros better)
    # sMAPE = 100 * mean(|actual - predicted| / ((|actual| + |predicted|) / 2))
    denominator = (np.abs(actual) + np.abs(predicted)) / 2
    # Avoid division by zero
    smape_mask = denominator != 0
    if smape_mask.sum() > 0:
        smape = np.mean(np.abs(actual[smape_mask] - predicted[smape_mask]) / denominator[smape_mask]) * 100
    else:
        smape = 0.0
    
    # R² Score (coefficient of determination)
    # R² = 1 - (SS_res / SS_tot)
    ss_res = np.sum((actual - predicted) ** 2)
    ss_tot = np.sum((actual - np.mean(actual)) ** 2)
    if ss_tot > 0:
        r2 = 1 - (ss_res / ss_tot)
    else:
        r2 = 0.0
    
    # RMSSE (Root Mean Squared Scaled Error) - normalized by naive forecast
    # Useful for comparing across different datasets
    if len(actual) > 1:
        naive_forecast = actual[:-1]  # Shift by 1
        naive_actual = actual[1:]
        naive_mse = np.mean((naive_actual - naive_forecast) ** 2)
        if naive_mse > 0:
            rmsse = np.sqrt(np.mean((actual - predicted) ** 2) / naive_mse)
        else:
            rmsse = 0.0
    else:
        rmsse = 0.0
    
    # Accuracy (using WAPE - Weighted Absolute Percentage Error as it's the industry standard for sales)
    # This is more robust to zeros than sMAPE/MAPE
    mean_actual = np.mean(actual)
    if mean_actual > 0:
        wape = mae / mean_actual
        accuracy = max(0, (1 - wape) * 100)
    else:
        accuracy = 0.0
    
    metrics = {
        'mae': round(float(mae), 2),
        'rmse': round(float(rmse), 2),
        'mape': round(float(mape), 2),
        'smape': round(float(smape), 2),
        'r2': round(float(r2), 4),
        'rmsse': round(float(rmsse), 4),
        'accuracy': round(float(accuracy), 2)
    }
    
    logger.info(f"Metrics: MAE={metrics['mae']}, RMSE={metrics['rmse']}, sMAPE={metrics['smape']}%, R²={metrics['r2']}, Accuracy={metrics['accuracy']}%")
    
    return metrics
