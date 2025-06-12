#!/usr/bin/env python3
"""
Smart Finance Assistant - Main Application Entry Point
"""

import os
import sys
from datetime import datetime

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User, Transaction, Category, Budget, Prediction, UserSession

# Create Flask application
app = create_app(os.getenv('FLASK_ENV', 'development'))

@app.shell_context_processor
def make_shell_context():
    """Make database models available in Flask shell"""
    return {
        'db': db,
        'User': User,
        'Transaction': Transaction,
        'Category': Category,
        'Budget': Budget,
        'Prediction': Prediction,
        'UserSession': UserSession
    }

@app.before_request
def log_request_info():
    """Log request information for debugging"""
    from flask import request
    if app.config.get('DEBUG'):
        app.logger.debug(f"Request: {request.method} {request.url}")
        if request.is_json:
            app.logger.debug(f"Request JSON: {request.get_json()}")

@app.after_request
def after_request(response):
    """Log response information and add security headers"""
    # Log response status
    if app.config.get('DEBUG'):
        app.logger.debug(f"Response: {response.status_code}")
    
    # Add security headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    # Add CORS headers if not already added by Flask-CORS
    if not response.headers.get('Access-Control-Allow-Origin'):
        frontend_url = app.config.get('FRONTEND_URL', 'http://localhost:3000')
        response.headers['Access-Control-Allow-Origin'] = frontend_url
    
    return response

# CLI Commands
@app.cli.command()
def init_db():
    """Initialize the database with tables and default data"""
    try:
        print("Creating database tables...")
        db.create_all()
        
        print("Creating default categories...")
        Category.create_default_categories()
        
        print("Database initialized successfully!")
        
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        sys.exit(1)

@app.cli.command()
def reset_db():
    """Reset the database (WARNING: This will delete all data!)"""
    try:
        response = input("This will delete ALL data. Are you sure? (type 'yes' to confirm): ")
        if response.lower() != 'yes':
            print("Database reset cancelled.")
            return
        
        print("Dropping all tables...")
        db.drop_all()
        
        print("Creating new tables...")
        db.create_all()
        
        print("Creating default categories...")
        Category.create_default_categories()
        
        print("Database reset completed!")
        
    except Exception as e:
        print(f"Error resetting database: {str(e)}")
        sys.exit(1)

@app.cli.command()
def create_admin():
    """Create an admin user"""
    try:
        email = input("Admin email: ")
        username = input("Admin username: ")
        password = input("Admin password: ")
        first_name = input("First name: ")
        last_name = input("Last name: ")
        
        # Check if user already exists
        if User.find_by_email(email):
            print(f"User with email {email} already exists!")
            return
        
        # Create admin user
        admin_user = User(
            email=email,
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_verified=True  # Auto-verify admin
        )
        
        db.session.add(admin_user)
        db.session.commit()
        
        print(f"Admin user created successfully! ID: {admin_user.id}")
        
    except Exception as e:
        print(f"Error creating admin user: {str(e)}")
        db.session.rollback()

@app.cli.command()
def seed_data():
    """Seed the database with sample data for development"""
    try:
        from app.services.seed_service import SeedService
        
        print("Seeding database with sample data...")
        SeedService.seed_all()
        print("Database seeded successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {str(e)}")

@app.cli.command()
def train_models():
    """Train ML models"""
    try:
        from app.services.ml_service import MLService
        
        print("Training ML models...")
        results = MLService.train_all_models()
        
        for model_name, accuracy in results.items():
            print(f"{model_name}: {accuracy:.2%} accuracy")
        
        print("ML models trained successfully!")
        
    except Exception as e:
        print(f"Error training models: {str(e)}")

@app.cli.command()
def cleanup():
    """Clean up expired sessions and tokens"""
    try:
        from app.models.user_session import UserSession
        from app.services.auth_service import AuthService
        
        print("Cleaning up expired sessions...")
        expired_sessions = UserSession.cleanup_expired_sessions()
        print(f"Cleaned up {expired_sessions} expired sessions")
        
        print("Cleaning up expired tokens...")
        expired_tokens = AuthService.cleanup_expired_tokens()
        print(f"Cleaned up {expired_tokens} expired tokens")
        
        print("Cleanup completed!")
        
    except Exception as e:
        print(f"Error during cleanup: {str(e)}")

@app.cli.command()
def show_config():
    """Show current configuration"""
    print("Current Configuration:")
    print(f"Environment: {app.config.get('ENV')}")
    print(f"Debug: {app.config.get('DEBUG')}")
    print(f"Database URL: {app.config.get('SQLALCHEMY_DATABASE_URI', '').split('@')[-1]}")
    print(f"Redis URL: {app.config.get('REDIS_URL', '').split('@')[-1]}")
    print(f"Mail Server: {app.config.get('MAIL_SERVER')}")
    print(f"Frontend URL: {app.config.get('FRONTEND_URL')}")

if __name__ == '__main__':
    # Get host and port from environment
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    # Print startup information
    print("=" * 50)
    print("🤖 Smart Finance Assistant API")
    print("=" * 50)
    print(f"Environment: {os.getenv('FLASK_ENV', 'development')}")
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"Debug: {debug}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # Run the application
    try:
        app.run(host=host, port=port, debug=debug)
    except KeyboardInterrupt:
        print("\n👋 Shutting down Smart Finance Assistant API")
    except Exception as e:
        print(f"❌ Error starting application: {str(e)}")
        sys.exit(1)