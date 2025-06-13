# Smart Finance Assistant - Setup & Installation Guide

This guide will help you set up and run the Smart Finance Assistant application, which consists of a Python Flask backend with ML capabilities and a modern JavaScript frontend with D3.js visualizations.

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Python 3.8+** - [Download Python](https://python.org/downloads/)
- **Node.js 16+** - [Download Node.js](https://nodejs.org/)
- **Docker & Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)
- **Git** - [Install Git](https://git-scm.com/downloads)

## 🚀 Quick Start (Recommended)

### Option 1: Docker Compose (Easiest)

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd AI_Finance_Tracker
   ```

2. **Start all services with Docker:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database: PostgreSQL on localhost:5432

4. **Stop the application:**
   ```bash
   docker-compose down
   ```

## 🛠 Manual Setup (Development)

### Step 1: Database Setup

#### Using Docker (Recommended):
```bash
# Start PostgreSQL container
docker run --name finance-db \
  -e POSTGRES_DB=smart_finance \
  -e POSTGRES_USER=finance_user \
  -e POSTGRES_PASSWORD=finance_password \
  -p 5432:5432 \
  -d postgres:13

# Verify database is running
docker ps
```

#### Using Local PostgreSQL:
```bash
# Create database
createdb smart_finance

# Create user (optional)
psql -c "CREATE USER finance_user WITH PASSWORD 'finance_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE smart_finance TO finance_user;"
```

### Step 2: Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   
   # Activate virtual environment
   # On macOS/Linux:
   source venv/bin/activate
   # On Windows:
   venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit .env file with your settings
   nano .env
   ```

   **Required environment variables:**
   ```env
   FLASK_APP=app
   FLASK_ENV=development
   SECRET_KEY=your-secret-key-here
   DATABASE_URL=postgresql://finance_user:finance_password@localhost:5432/smart_finance
   JWT_SECRET_KEY=your-jwt-secret-here
   ```

5. **Initialize database:**
   ```bash
   # Run database migrations
   flask db upgrade
   
   # Seed with sample data (optional)
   python seed_data.py
   ```

6. **Start the backend server:**
   ```bash
   flask run
   ```
   
   Backend will be available at: http://localhost:5000

### Step 3: Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```
   
   Frontend will be available at: http://localhost:3000

## 🧪 Testing

### Backend Tests:
```bash
cd backend
pytest
```

### Frontend Tests:
```bash
cd frontend
npm test
```

## 🔧 Development Commands

### Backend Commands:
```bash
# Activate virtual environment
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Install new package
pip install package_name
pip freeze > requirements.txt

# Database migrations
flask db init        # Initialize migrations (first time only)
flask db migrate -m "Description"  # Create migration
flask db upgrade     # Apply migrations

# Run with debug mode
export FLASK_ENV=development
flask run --debug

# Lint code
flake8 app/
black app/

# Type checking
mypy app/
```

### Frontend Commands:
```bash
# Development server
npm start

# Build for production
npm run build

# Run tests
npm test
npm run test:coverage

# Lint and format
npm run lint
npm run lint:fix

# Clean build
npm run clean
```

### Docker Commands:
```bash
# Build and start all services
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove volumes (reset database)
docker-compose down -v

# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# Run database migrations in container
docker-compose exec backend flask db upgrade

# Access database directly
docker-compose exec db psql -U finance_user -d smart_finance
```

## 🌐 Production Deployment

### Environment Setup:
```bash
# Backend production environment
export FLASK_ENV=production
export DATABASE_URL=your-production-db-url
export SECRET_KEY=your-production-secret

# Build frontend for production
cd frontend
npm run build
```

### Docker Production:
```bash
# Use production docker-compose file
docker-compose -f docker-compose.prod.yml up --build -d
```

## 📊 Default Accounts & Demo Data

The application comes with demo data for testing:

- **Demo User:** demo@smartfinance.com / demo123
- **Admin User:** admin@smartfinance.com / admin123

## 🔍 Troubleshooting

### Common Issues:

#### Database Connection Error:
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check connection
psql -h localhost -U finance_user -d smart_finance
```

#### Frontend Build Issues:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Backend Import Errors:
```bash
# Ensure virtual environment is activated
which python
pip list

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

#### Port Already in Use:
```bash
# Find process using port 5000
lsof -i :5000
kill -9 <PID>

# Or use different port
flask run --port 5001
```

### Debug Mode:

#### Backend Debug:
```bash
export FLASK_ENV=development
export FLASK_DEBUG=1
flask run
```

#### Frontend Debug:
```bash
# Check webpack build
npm run build:dev

# Analyze bundle
npm run analyze
```

## 📁 Project Structure

```
AI_Finance_Tracker/
├── backend/                 # Python Flask backend
│   ├── app/                # Application code
│   ├── migrations/         # Database migrations
│   ├── tests/              # Backend tests
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile         # Backend container
├── frontend/               # JavaScript frontend
│   ├── src/               # Source code
│   ├── dist/              # Built files
│   ├── package.json       # Node dependencies
│   └── Dockerfile         # Frontend container
├── docker-compose.yml     # Development setup
├── docker-compose.prod.yml # Production setup
└── INSTRUCTIONS.md        # This file
```

## 🤝 Development Workflow

1. **Start development environment:**
   ```bash
   docker-compose up
   ```

2. **Make changes to code**

3. **Test changes:**
   ```bash
   # Backend tests
   cd backend && pytest
   
   # Frontend tests
   cd frontend && npm test
   ```

4. **Commit changes:**
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

## 🔐 Security Notes

- Change default passwords in production
- Use environment variables for sensitive data
- Enable HTTPS in production
- Regularly update dependencies
- Review and rotate API keys

## 📞 Support

If you encounter issues:

1. Check this guide first
2. Review application logs
3. Check GitHub issues
4. Create a new issue with details

---

Happy coding! 🚀