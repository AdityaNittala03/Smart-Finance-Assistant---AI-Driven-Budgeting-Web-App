from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_mail import Mail
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from redis import Redis
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
mail = Mail()
jwt = JWTManager()
# Create a dummy limiter class for development
class DummyLimiter:
    def limit(self, *args, **kwargs):
        def decorator(f):
            return f
        return decorator
    
    def init_app(self, app):
        pass

# Temporarily disable Redis and rate limiting for development
redis_client = None
limiter = DummyLimiter()


def create_app(config_name='default'):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Configure app
    app.config.from_object(get_config(config_name))
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    mail.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)  # Using dummy limiter
    
    # Configure CORS - Allow specific origins for development
    if os.getenv('FLASK_ENV') == 'development':
        CORS(app, 
             origins=['http://localhost:3000', 'http://127.0.0.1:3000', 'http://0.0.0.0:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'],
             allow_headers=['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
             methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
             supports_credentials=True)
    else:
        CORS(app, 
             origins=[os.getenv('FRONTEND_URL', 'http://localhost:3000')],
             allow_headers=['Content-Type', 'Authorization', 'Accept'],
             methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
    # Configure login manager
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    login_manager.login_message_category = 'info'
    
    # Register blueprints
    from .routes import register_blueprints
    register_blueprints(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Register CLI commands
    register_cli_commands(app)
    
    return app


def get_config(config_name):
    """Get configuration class based on environment"""
    from .config import config
    return config.get(config_name, config['default'])


def register_error_handlers(app):
    """Register error handlers"""
    from flask import jsonify
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad request'}), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'error': 'Unauthorized'}), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({'error': 'Forbidden'}), 403
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({'error': 'Rate limit exceeded', 'message': str(e.description)}), 429
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


def register_cli_commands(app):
    """Register CLI commands"""
    
    @app.cli.command()
    def init_db():
        """Initialize the database"""
        db.create_all()
        print('Database initialized.')
    
    @app.cli.command()
    def seed_db():
        """Seed the database with sample data"""
        from .services.seed_service import seed_database
        seed_database()
        print('Database seeded.')
    
    @app.cli.command()
    def train_models():
        """Train ML models"""
        from .services.ml_service import train_all_models
        train_all_models()
        print('ML models trained.')


@login_manager.user_loader
def load_user(user_id):
    """Load user for Flask-Login"""
    from .models.user import User
    return User.query.get(int(user_id))