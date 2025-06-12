# Smart Finance Assistant 🤖💰

An AI-driven budgeting web application that empowers users to manage their finances intelligently through automated transaction categorization, spending predictions, and personalized budget recommendations.

## 🚀 Features

- **AI-Powered Transaction Categorization**: Automatically categorize expenses using machine learning
- **Predictive Analytics**: Forecast spending trends and budget requirements
- **Interactive Dashboard**: Visualize financial data with dynamic charts and graphs
- **Personalized Budgets**: Get custom budget recommendations based on spending patterns
- **Smart Notifications**: Receive alerts for budget limits and unusual spending
- **Export Reports**: Generate and export financial reports in multiple formats
- **Secure & Private**: Bank-level security for your financial data

## 🛠️ Technology Stack

- **Backend**: Python (Flask), PostgreSQL
- **Machine Learning**: Pandas, scikit-learn, TensorFlow
- **Frontend**: HTML5, CSS3, JavaScript, D3.js
- **Deployment**: Docker, CI/CD Pipeline
- **Version Control**: Git

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- Python 3.9+
- Node.js 14+
- PostgreSQL 12+
- Docker (optional, for containerized deployment)

## 🏗️ Project Structure

```
AI_Finance_Tracker/
├── backend/                 # Backend application
│   ├── app/                # Flask application
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── ml_models/          # Machine learning components
│   │   ├── training/       # Model training scripts
│   │   ├── inference/      # Prediction services
│   │   └── data/           # Training data
│   └── tests/              # Backend tests
├── frontend/               # Frontend application
│   ├── static/            # Static assets
│   ├── templates/         # HTML templates
│   └── src/               # JavaScript source
├── database/              # Database scripts
│   ├── migrations/        # Database migrations
│   └── seeds/             # Sample data
├── docker/                # Docker configurations
├── docs/                  # Documentation
└── tests/                 # Integration tests
```

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/AI_Finance_Tracker.git
cd AI_Finance_Tracker
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb finance_tracker

# Run migrations
python manage.py db upgrade
```

### 4. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 5. Start the Application
```bash
# Start backend
python app.py

# Start frontend (in another terminal)
cd frontend
npm install
npm start
```

## 🔧 Configuration

Create a `.env` file in the project root with the following variables:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost/finance_tracker

# Secret Keys
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key

# ML Models
MODEL_PATH=backend/ml_models/trained_models/

# Email Configuration (optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

## 📊 Machine Learning Models

The application uses several ML models:

1. **Transaction Categorization**: Random Forest classifier for automatic expense categorization
2. **Spending Prediction**: Time series forecasting using LSTM networks
3. **Budget Recommendations**: Clustering and recommendation algorithms

### Model Training
```bash
cd backend/ml_models/training
python train_categorization_model.py
python train_prediction_model.py
```

## 🧪 Testing

Run the test suite:

```bash
# Backend tests
cd backend
pytest tests/

# Frontend tests
cd frontend
npm test

# Integration tests
python -m pytest tests/integration/
```

## 🐳 Docker Deployment

Deploy using Docker Compose:

```bash
docker-compose up -d
```

This will start:
- Backend application (Flask)
- PostgreSQL database
- Redis cache
- Nginx reverse proxy

## 📈 API Documentation

The API documentation is available at `/api/docs` when running the application.

### Key Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/transactions` - Get transactions
- `POST /api/transactions` - Add transaction
- `POST /api/ml/categorize` - Categorize transaction
- `GET /api/analytics/trends` - Get spending trends

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛠️ Development Status

### Phase 1: Foundation & Core Backend ✅ COMPLETED
- [x] Project setup and planning
- [x] Comprehensive project documentation (PRD, Plan of Action)
- [x] Database models and schema design
- [x] Authentication system with JWT and session management
- [x] API route structure and core endpoints
- [x] User management and security features
- [x] Docker containerization setup
- [x] Development environment configuration

### Phase 2: ML Integration & Intelligence ✅ COMPLETED
- [x] Data preprocessing pipeline with feature engineering
- [x] Transaction categorization ML model (Random Forest, Logistic Regression, Naive Bayes)
- [x] Spending prediction algorithms with time series forecasting
- [x] Budget recommendation engine with user clustering
- [x] ML model training and validation framework
- [x] Comprehensive model evaluation and monitoring
- [x] API endpoints for ML services

### Phase 3: Frontend & User Interface 📋 PLANNED
- [ ] Frontend framework setup
- [ ] Interactive dashboard with D3.js charts
- [ ] Mobile-responsive design
- [ ] Real-time data visualization
- [ ] Export and reporting features

### Phase 4: Testing, Optimization & Deployment 📋 PLANNED
- [ ] Comprehensive test suite
- [ ] Performance optimization
- [ ] Security audit and fixes
- [ ] Production deployment
- [ ] Monitoring and alerting

## 📞 Support

If you have any questions or issues, please:

1. Check the [documentation](docs/)
2. Search existing [issues](https://github.com/yourusername/AI_Finance_Tracker/issues)
3. Create a new issue if needed

## 🙏 Acknowledgments

- Built with ❤️ using Python and Flask
- Machine learning powered by scikit-learn and TensorFlow
- Visualizations created with D3.js
- Inspired by modern personal finance management needs

---

**Made with 💻 by [Your Name]**