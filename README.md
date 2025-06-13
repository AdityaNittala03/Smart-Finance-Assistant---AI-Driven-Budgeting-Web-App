# 🤖 Smart Finance Assistant - AI-Driven Budgeting Web App

A comprehensive personal finance management application built with Flask (Python) backend and Vanilla JavaScript frontend, featuring AI-powered transaction categorization and beautiful data visualizations.

## ✨ Features

### 💰 **Financial Management**
- **Multi-currency Support**: Optimized for Indian Rupees (₹) with proper localization
- **Transaction Tracking**: Income and expense tracking with automatic categorization
- **Budget Management**: Set and monitor budgets across different categories
- **Goal Setting**: Financial goal tracking with progress visualization

### 📊 **Analytics & Visualizations**
- **Interactive Charts**: D3.js powered charts for spending trends and insights
- **Monthly Trends**: 12-month view of income, expenses, and savings
- **Category Breakdown**: Pie charts for expense categorization
- **Budget Performance**: Visual budget vs actual spending comparison

### 🔐 **Security & Authentication**
- **JWT Authentication**: Secure token-based authentication
- **Session Management**: User session tracking and management
- **Account Security**: Failed login attempt tracking and account lockout
- **Password Validation**: Strong password requirements

### 🎯 **AI-Powered Features**
- **Smart Categorization**: ML-based transaction categorization
- **Spending Insights**: AI-generated financial insights and recommendations
- **Predictive Analytics**: Trend analysis and future spending predictions

### 📱 **Progressive Web App**
- **PWA Support**: Installable web app with offline capabilities
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Service Worker**: Caching for improved performance

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/AdityaNittala03/Smart-Finance-Assistant---AI-Driven-Budgeting-Web-App.git
cd Smart-Finance-Assistant---AI-Driven-Budgeting-Web-App
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Set up PostgreSQL database
createdb smart_finance
createuser finance_user -P  # Set password: finance_password

# Initialize database
FLASK_ENV=development python -c "
from app import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
    print('Database initialized')
"

# Create demo user
FLASK_ENV=development python -c "
from app import create_app, db
from app.models.user import User
app = create_app()
with app.app_context():
    demo_user = User(
        email='demo@example.com',
        username='demo',
        password='demo123',
        first_name='Demo',
        last_name='User',
        is_verified=True,
        is_active=True,
        currency='INR'
    )
    db.session.add(demo_user)
    db.session.commit()
    print('Demo user created')
"

# Start backend server
FLASK_ENV=development PORT=5002 python app.py
```

### 3. Frontend Setup
```bash
# Open new terminal and navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start development server
npm run start
```

### 4. Access the Application
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5002
- **Demo Login**: 
  - Email: `demo@example.com`
  - Password: `demo123`

## 🏗️ Architecture

### Backend (Flask + PostgreSQL)
```
backend/
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── config.py            # Configuration settings
│   ├── models/              # SQLAlchemy models
│   │   ├── user.py          # User model
│   │   ├── transaction.py   # Transaction model
│   │   ├── category.py      # Category model
│   │   └── budget.py        # Budget model
│   ├── routes/              # API endpoints
│   │   ├── auth.py          # Authentication routes
│   │   ├── transactions.py  # Transaction CRUD
│   │   └── analytics.py     # Analytics endpoints
│   ├── services/            # Business logic
│   │   ├── auth_service.py  # Authentication logic
│   │   ├── ml_service.py    # ML categorization
│   │   └── analytics_service.py
│   └── utils/               # Helper functions
├── requirements.txt         # Python dependencies
└── app.py                  # Application entry point
```

### Frontend (Vanilla JavaScript + D3.js)
```
frontend/
├── src/
│   ├── app/                 # Application core
│   │   ├── App.js           # Main application
│   │   └── Router.js        # Client-side routing
│   ├── pages/               # Page components
│   │   ├── DashboardPage.js # Main dashboard
│   │   ├── LoginPage.js     # Authentication
│   │   ├── TransactionsPage.js
│   │   ├── BudgetsPage.js
│   │   └── AnalyticsPage.js
│   ├── services/            # API communication
│   │   ├── APIService.js    # HTTP client
│   │   ├── AuthService.js   # Authentication
│   │   └── NotificationService.js
│   ├── charts/              # D3.js visualizations
│   │   └── ChartService.js  # Chart components
│   ├── styles/              # CSS styles
│   │   └── main.css         # Tailwind CSS
│   └── index.js             # Application entry point
├── webpack.config.js        # Build configuration
├── tailwind.config.js       # Tailwind configuration
└── package.json            # Node.js dependencies
```

## 💳 Currency Support

The application is optimized for **Indian Rupees (₹)** with:
- Proper Indian number formatting (₹12,34,650)
- Realistic Indian salary and expense amounts
- Localized date and number formats
- Cultural context for expense categories

### Sample Data Amounts:
- **Monthly Income**: ₹6,80,000
- **Total Balance**: ₹12,34,650
- **Groceries**: ₹10,040
- **Transportation**: ₹3,616
- **Entertainment**: ₹1,020

## 🔧 Development

### Environment Variables
Create a `.env` file in the backend directory:
```env
FLASK_ENV=development
DATABASE_URL=postgresql://finance_user:finance_password@localhost:5432/smart_finance
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key
```

### Running Tests
```bash
# Backend tests
cd backend
python -m pytest tests/

# Frontend tests
cd frontend
npm test
```

### Building for Production
```bash
# Frontend build
cd frontend
npm run build

# Backend deployment
cd backend
pip install gunicorn
gunicorn app:app
```

## 📱 Features Demo

### Dashboard
- Real-time financial overview
- Monthly trend visualization
- Recent transactions
- Budget alerts and insights

### Analytics
- Spending category breakdown
- Year-over-year comparisons
- Trend analysis
- Goal tracking

### Transactions
- Add/edit/delete transactions
- Bulk import from CSV
- Smart categorization
- Search and filtering

### Budgets
- Create category-wise budgets
- Real-time spending tracking
- Budget vs actual comparisons
- Alert notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **D3.js** for beautiful data visualizations
- **Tailwind CSS** for responsive design
- **Flask** for the robust backend framework
- **PostgreSQL** for reliable data storage

## 📞 Support

For support, email your-email@example.com or create an issue on GitHub.

---

**Built with ❤️ for better financial management**