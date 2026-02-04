from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, HttpUrl
from typing import List, Literal, Dict
import logging

from services.forecast_service import forecast_service

logger = logging.getLogger(__name__)

router = APIRouter()

class ForecastRequest(BaseModel):
    """Request model for forecast endpoint"""
    datasetUrl: str = Field(..., description="URL to dataset (S3 presigned URL)")
    modelType: Literal['baseline', 'arima', 'xgboost', 'auto'] = Field(..., description="Model type to use")
    horizon: int = Field(..., ge=1, le=365, description="Number of periods to forecast")
    granularity: Literal['daily', 'weekly', 'monthly'] = Field(default='daily', description="Time granularity")

class PredictionItem(BaseModel):
    """Single prediction item"""
    date: str
    value: float

class MetricsResponse(BaseModel):
    """Metrics response model"""
    mae: float
    rmse: float
    mape: float
    accuracy: float

class ForecastResponse(BaseModel):
    """Response model for forecast endpoint"""
    predictions: List[PredictionItem]
    metrics: MetricsResponse

@router.post("/forecast", response_model=ForecastResponse)
async def create_forecast(request: ForecastRequest):
    """
    Generate sales forecast using specified model
    
    - **datasetUrl**: URL to CSV dataset (must have date and sales columns)
    - **modelType**: baseline, arima, or xgboost
    - **horizon**: Number of periods to forecast (1-365)
    - **granularity**: daily, weekly, or monthly
    
    Returns predictions and accuracy metrics (MAE, RMSE, MAPE, Accuracy %)
    """
    try:
        logger.info(f"Received forecast request: {request.modelType}, horizon={request.horizon}")
        
        result = forecast_service.run_forecast(
            dataset_url=request.datasetUrl,
            model_type=request.modelType,
            horizon=request.horizon,
            granularity=request.granularity
        )
        
        return result
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Forecast error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Forecast failed: {str(e)}")
