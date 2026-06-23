from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import datetime
import pandas as pd
# from prophet import Prophet # Commented out for mock purposes if environment lacks C++ build tools

app = FastAPI(title="Amdox AI Forecasting Service", version="1.0.0")

class StockMovement(BaseModel):
    date: str
    quantity: float

class ForecastRequest(BaseModel):
    tenantId: str
    itemId: str
    history: List[StockMovement]
    daysToPredict: int = 30

class ForecastResult(BaseModel):
    date: str
    predictedDemand: float
    confidenceLow: float
    confidenceHigh: float

@app.post("/train/{tenantId}/{itemId}")
async def train_model(tenantId: str, itemId: str, request: ForecastRequest):
    if len(request.history) < 10:
        raise HTTPException(status_code=400, detail="Insufficient historical data to train model. Minimum 10 data points required.")
    
    # In a real environment, we would do:
    # df = pd.DataFrame([{"ds": h.date, "y": h.quantity} for h in request.history])
    # m = Prophet()
    # m.fit(df)
    # ... save model to S3 / MLFlow ...
    
    return {"status": "success", "message": f"Model trained for item {itemId} in tenant {tenantId}"}

@app.get("/predict/{tenantId}/{itemId}", response_model=List[ForecastResult])
async def predict_demand(tenantId: str, itemId: str, days: int = 30):
    # Mocking prediction for enterprise demo
    base_date = datetime.date.today()
    predictions = []
    
    # Simple linear decay/growth mock
    current_demand = 15.0
    
    for i in range(days):
        target_date = base_date + datetime.timedelta(days=i)
        
        # Adding slight randomness
        demand = max(0, current_demand + (i * 0.1) + (i % 3))
        
        predictions.append(ForecastResult(
            date=target_date.strftime("%Y-%m-%d"),
            predictedDemand=round(demand, 2),
            confidenceLow=round(demand * 0.8, 2),
            confidenceHigh=round(demand * 1.2, 2)
        ))
        
    return predictions

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
