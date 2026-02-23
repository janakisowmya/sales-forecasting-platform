# Getting Started with Sales Forecasting Platform

## Step-by-Step Tutorial

### 1. Start the Application

```bash
# From the sales directory
docker-compose up -d

# Wait for all services to start (about 30 seconds)
docker-compose ps
```

### 2. Access the Platform

Open your browser and navigate to: http://localhost:5173

### 3. Login

Use one of the demo accounts:
- **Analyst Account**: `analyst@example.com` / `password123`
- **Admin Account**: `admin@example.com` / `password123`

### 4. Upload Sample Dataset

1. Click **"Upload Dataset"** from the dashboard
2. Upload the provided `sample-data.csv` file
3. Name it "Q1 2024 Sales"
4. Click **"Upload Dataset"**

### 5. Run Your First Forecast

1. Click **"Run Forecast"** from the dashboard
2. Select "Q1 2024 Sales" dataset
3. Choose **ARIMA** model (recommended for first try)
4. Set horizon to **30 days**
5. Keep granularity as **daily**
6. Click **"Run Forecast"**

### 6. View Results

- The forecast will process in 10-30 seconds
- You'll see real-time status updates
- Once complete, view:
  - **Metrics**: MAE, RMSE, MAPE, Accuracy
  - **Chart**: Interactive line chart of predictions
  - **Download**: Export results as CSV

## Model Comparison

Try running forecasts with different models on the same dataset:

### Baseline Model
- **Best for**: Quick estimates, simple patterns
- **Speed**: Fastest (< 5 seconds)
- **Accuracy**: Moderate (70-80%)

### ARIMA Model
- **Best for**: Stationary time series, trend detection
- **Speed**: Medium (10-20 seconds)
- **Accuracy**: Good (80-90%)

### XGBoost Model
- **Best for**: Complex patterns, multiple features
- **Speed**: Slower (20-40 seconds)
- **Accuracy**: Best (85-95%)

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Restart services
docker-compose down
docker-compose up -d
```

### Can't login
- Make sure backend is running: http://localhost:3000/health
- Check browser console for errors
- Clear browser cache and try again

### Forecast fails
- Ensure dataset has at least 30 rows
- Check that CSV has 'date' and 'sales' columns
- View ML service logs: `docker-compose logs ml-service`

## Next Steps

1. **Upload your own data**: Use real sales data in CSV format
2. **Compare models**: Run all three models and compare accuracy
3. **Adjust horizons**: Try different forecast periods (7, 30, 90 days)
4. **Explore granularity**: Test weekly and monthly aggregations

## API Testing (Optional)

Test the API directly with curl:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"analyst@example.com","password":"password123"}'

# List datasets (use token from login response)
curl http://localhost:3000/api/datasets \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Development Mode

To run services individually for development:

```bash
# Backend
cd backend
npm install
npm run dev

# ML Service
cd ml-service

# Note for MacOS users: XGBoost requires OpenMP. Install it via Homebrew first:
# brew install libomp

pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Support

For issues or questions:
1. Check the main README.md
2. Review Docker logs
3. Inspect browser console
4. Check API responses in Network tab
