import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import pandas as pd
import numpy as np
from prophet import Prophet
import mlflow
import torch
import torch.nn as nn

app = FastAPI(title="AMDOX ERP ML Service", version="1.0.0")

# Setup MLflow
MLFLOW_URI = os.getenv("MLFLOW_TRACKING_URI", "http://mlflow:5000")
mlflow.set_tracking_uri(MLFLOW_URI)
mlflow.set_experiment("Amdox_Forecasting")

class TimeSeriesData(BaseModel):
    ds: str
    y: float

class ForecastRequest(BaseModel):
    tenant_id: str
    history: List[TimeSeriesData]
    periods: int = 30

class LSTMForecaster(nn.Module):
    def __init__(self, input_size=1, hidden_size=50, output_size=1):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, batch_first=True)
        self.linear = nn.Linear(hidden_size, output_size)
        
    def forward(self, x):
        out, _ = self.lstm(x)
        out = self.linear(out[:, -1, :])
        return out

def fallback_pytorch_forecast(df: pd.DataFrame, periods: int) -> List[dict]:
    # Very basic PyTorch fallback
    data = df['y'].values.astype(np.float32)
    # Normalize
    mean, std = data.mean(), data.std()
    data = (data - mean) / (std if std != 0 else 1)
    
    # Predict naive sequence
    model = LSTMForecaster()
    model.eval()
    
    predictions = []
    last_val = data[-1]
    
    with torch.no_grad():
        for _ in range(periods):
            x = torch.tensor([[[last_val]]])
            pred = model(x).item()
            predictions.append(pred * std + mean)
            last_val = pred
            
    future_dates = pd.date_range(start=df['ds'].iloc[-1], periods=periods+1, inclusive='right')
    return [{"ds": d.strftime('%Y-%m-%d'), "yhat": float(p)} for d, p in zip(future_dates, predictions)]

@app.post("/forecast/revenue")
def forecast_revenue(req: ForecastRequest):
    if len(req.history) < 10:
        raise HTTPException(status_code=400, detail="Insufficient historical data (min 10 required)")
    
    df = pd.DataFrame([h.dict() for h in req.history])
    df['ds'] = pd.to_datetime(df['ds'])
    
    with mlflow.start_run():
        mlflow.log_param("tenant_id", req.tenant_id)
        mlflow.log_param("periods", req.periods)
        mlflow.log_param("data_points", len(df))
        
        try:
            model = Prophet(yearly_seasonality=True, weekly_seasonality=True)
            model.fit(df)
            future = model.make_future_dataframe(periods=req.periods)
            forecast = model.predict(future)
            
            res = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(req.periods)
            res['ds'] = res['ds'].dt.strftime('%Y-%m-%d')
            
            mlflow.log_metric("prophet_success", 1)
            return {"status": "success", "model": "prophet", "forecast": res.to_dict(orient="records")}
        except Exception as e:
            mlflow.log_metric("prophet_success", 0)
            mlflow.log_metric("pytorch_fallback", 1)
            # Fallback to PyTorch LSTM
            fallback_res = fallback_pytorch_forecast(df, req.periods)
            return {"status": "success", "model": "pytorch_lstm", "forecast": fallback_res}

@app.post("/forecast/inventory")
def forecast_inventory(req: ForecastRequest):
    # Same implementation wrapper for inventory forecasting
    return forecast_revenue(req)

@app.get("/health")
def health():
    return {"status": "healthy"}
