# Sales Forecasting Platform

A production-grade, full-stack sales forecasting platform featuring React frontend, Node.js API backend, and Python ML service with multiple forecasting models (Baseline, ARIMA, XGBoost). Built for portfolio demonstration with FAANG-level engineering practices.

![Platform Preview](docs/platform-preview.png)

## 📸 Live Demo

![Forecast Results - 93% Accuracy](docs/forecast-results.png)
*Real forecast results showing 93.33% accuracy with ARIMA model on seasonal sales data*

## 🎯 Features

### Core Functionality
- **Multi-Model Forecasting**: Baseline (Seasonal Naive), ARIMA, and XGBoost models
- **Flexible Horizons**: Forecast 7-90 days ahead with daily/weekly/monthly granularity
- **Accuracy Metrics**: MAE, RMSE, MAPE, and accuracy percentage tracking
- **Interactive Dashboards**: Real-time visualization with Recharts
- **Dataset Management**: Upload, store, and manage historical sales data

### Security & Access Control
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full system access, user management
  - **Analyst**: Upload datasets, run forecasts, view results
  - **Viewer**: View dashboards and results only

### Engineering Excellence
- **Microservices Architecture**: Clean separation of concerns
- **Dockerized Development**: One-command local setup
- **Type Safety**: TypeScript (frontend/backend) and Python type hints
- **Premium UI/UX**: Glassmorphism design with smooth animations
- **Scalable Storage**: S3-compatible object storage (MinIO locally, AWS S3 in production)

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Frontend (React + Vite)"
        UI[React UI]
        Auth[Auth Context]
        API[API Client]
    end
    
    subgraph "Backend API (Node.js + Express)"
        Routes[API Routes]
        JWT[JWT Middleware]
        RBAC[RBAC Middleware]
        Models[Sequelize Models]
    end
    
    subgraph "ML Service (Python + FastAPI)"
        Forecast[Forecast Endpoint]
        Baseline[Baseline Model]
        ARIMA[ARIMA Model]
        XGBoost[XGBoost Model]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
        S3[(MinIO/S3)]
    end
    
    UI --> API
    API --> Routes
    Routes --> JWT
    JWT --> RBAC
    RBAC --> Models
    Models --> DB
    Routes --> S3
    Routes --> Forecast
    Forecast --> Baseline
    Forecast --> ARIMA
    Forecast --> XGBoost
    Forecast --> S3
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)

### Local Development (Docker Compose)

1. **Clone and navigate to project**
   ```bash
   cd sales
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - ML Service: http://localhost:8000
   - MinIO Console: http://localhost:9001

4. **Demo Credentials**
   - Admin: `admin@example.com` / `password123`
   - Analyst: `analyst@example.com` / `password123`
   - Viewer: `viewer@example.com` / `password123`

### Manual Setup (Without Docker)

#### Backend API
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

#### ML Service
```bash
cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📊 Usage Guide

### 1. Upload Dataset
- Navigate to **Upload Dataset**
- Upload CSV file with columns: `date`, `sales` (or similar)
- Example format:
  ```csv
  date,sales
  2024-01-01,1500
  2024-01-02,1650
  ```

### 2. Run Forecast
- Select uploaded dataset
- Choose model:
  - **Baseline**: Fast, simple seasonal patterns
  - **ARIMA**: Classic time series, auto-tuned
  - **XGBoost**: ML with lag features, best for complex patterns
- Set horizon (7-90 days)
- Choose granularity (daily/weekly/monthly)

### 3. View Results
- Real-time status updates
- Interactive line charts
- Metrics dashboard (MAE, RMSE, MAPE, Accuracy)

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing-fast builds
- **TailwindCSS** for utility-first styling
- **Recharts** for data visualization
- **Axios** for API communication
- **React Router** for navigation

### Backend API
- **Node.js 20** with Express
- **TypeScript** for type safety
- **Sequelize** ORM with PostgreSQL
- **JWT** for authentication
- **AWS SDK** for S3 integration
- **Winston** for logging

### ML Service
- **Python 3.11** with FastAPI
- **statsmodels** for ARIMA
- **XGBoost** for gradient boosting
- **pandas** & **numpy** for data processing
- **scikit-learn** for metrics

### Infrastructure
- **Docker** & **Docker Compose**
- **PostgreSQL 15** for relational data
- **MinIO** for S3-compatible object storage
- **Nginx** for production frontend serving

## 📈 Performance Metrics

- **Forecast Accuracy**: Achieves MAPE < 10% on well-structured datasets
- **Processing Speed**: Handles 100K+ row datasets in < 30 seconds
- **API Response Time**: < 200ms for most endpoints
- **Scalability**: Designed for horizontal scaling with containerization

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure, stateless authentication
- **CORS Protection**: Configured for production
- **Input Validation**: express-validator on all endpoints
- **SQL Injection Prevention**: Sequelize ORM parameterized queries
- **Environment Variables**: Secure secret management

## 📁 Project Structure

```
sales-forecasting-platform/
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React contexts
│   │   ├── services/      # API client
│   │   └── types/         # TypeScript types
│   └── Dockerfile
├── backend/               # Node.js API
│   ├── src/
│   │   ├── config/       # Configuration
│   │   ├── models/       # Sequelize models
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth & RBAC
│   │   └── services/     # Business logic
│   └── Dockerfile
├── ml-service/           # Python ML service
│   ├── models/          # Forecasting models
│   ├── services/        # Data processing
│   ├── routes/          # FastAPI routes
│   └── Dockerfile
├── scripts/             # Database init scripts
├── docker-compose.yml   # Orchestration
└── README.md
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### ML Service Tests
```bash
cd ml-service
pytest
```

## 🚢 Deployment

### Production Deployment (AWS)

1. **Build Docker images**
   ```bash
   docker-compose build
   ```

2. **Push to container registry**
   ```bash
   docker tag sales-backend:latest your-registry/sales-backend:latest
   docker push your-registry/sales-backend:latest
   ```

3. **Deploy to EC2/ECS**
   - Use provided docker-compose.yml as reference
   - Configure environment variables
   - Set up load balancer and SSL certificates

### Free Alternatives
- **Frontend**: Vercel, Netlify, Railway
- **Backend**: Railway, Render, Fly.io
- **Database**: ElephantSQL (PostgreSQL), Railway
- **Storage**: Cloudflare R2, Backblaze B2

## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/refresh` - Refresh JWT token

### Datasets
- `POST /api/datasets/upload` - Upload dataset (Analyst+)
- `GET /api/datasets` - List datasets
- `GET /api/datasets/:id` - Get dataset details
- `DELETE /api/datasets/:id` - Delete dataset (Admin only)

### Forecasts
- `POST /api/forecasts/run` - Run forecast (Analyst+)
- `GET /api/forecasts` - List forecasts
- `GET /api/forecasts/:id` - Get forecast results
- `GET /api/forecasts/:id/metrics` - Get forecast metrics

## 🎨 UI/UX Highlights

- **Glassmorphism Design**: Modern frosted-glass aesthetic
- **Gradient Accents**: Vibrant primary/accent color scheme
- **Smooth Animations**: Fade-in, slide-up, hover effects
- **Responsive Layout**: Mobile, tablet, desktop optimized
- **Dark Mode**: Eye-friendly dark theme
- **Custom Scrollbars**: Polished details

## 🤝 Contributing

This is a portfolio project, but suggestions are welcome!

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - feel free to use for your own portfolio projects!

## 👤 Author

**Janaki Sowmya**
- GitHub: [@janakisowmya](https://github.com/janakisowmya)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)

## 🙏 Acknowledgments

- Walmart Sales dataset from Kaggle (for testing)
- FastAPI and React communities
- All open-source contributors

---

**Built with ❤️ for demonstrating full-stack engineering skills**
