import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Config:
    """Base configuration class"""
    
    # Basic Flask configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    
    # Database configuration
    DATABASE_URL = os.getenv('DATABASE_URL')
    if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
    
    SQLALCHEMY_DATABASE_URI = DATABASE_URL or \
        f"postgresql://{os.getenv('DB_USER', 'finance_user')}:" \
        f"{os.getenv('DB_PASSWORD', 'finance_password')}@" \
        f"{os.getenv('DB_HOST', 'localhost')}:" \
        f"{os.getenv('DB_PORT', '5432')}/" \
        f"{os.getenv('DB_NAME', 'finance_tracker')}"
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
        'pool_timeout': 20,
        'max_overflow': 0
    }
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ['access', 'refresh']
    
    # Redis configuration
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    
    # Session configuration
    SESSION_TYPE = 'redis'
    SESSION_REDIS = None  # Will be set in create_app
    SESSION_PERMANENT = False
    SESSION_USE_SIGNER = True
    SESSION_KEY_PREFIX = 'finance_tracker:'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    
    # Mail configuration
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', '587'))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@financetracker.com')
    
    # File upload configuration
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_FILE_SIZE', '10485760'))  # 10MB
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads/')
    ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}
    
    # Security settings
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = None
    
    # Rate limiting
    RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    RATELIMIT_DEFAULT = os.getenv('RATE_LIMIT_REQUESTS', '100') + '/hour'
    
    # ML Model configuration
    MODEL_PATH = os.getenv('MODEL_PATH', 'backend/ml_models/trained_models/')
    ML_MODEL_VERSION = os.getenv('ML_MODEL_VERSION', '1.0.0')
    RETRAIN_INTERVAL = int(os.getenv('RETRAIN_INTERVAL', '7'))  # days
    
    # Logging configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'logs/app.log')
    LOG_MAX_BYTES = int(os.getenv('LOG_MAX_BYTES', '10485760'))  # 10MB
    LOG_BACKUP_COUNT = int(os.getenv('LOG_BACKUP_COUNT', '5'))
    
    # Third-party API keys
    PLAID_CLIENT_ID = os.getenv('PLAID_CLIENT_ID')
    PLAID_SECRET = os.getenv('PLAID_SECRET')
    PLAID_ENVIRONMENT = os.getenv('PLAID_ENVIRONMENT', 'sandbox')
    
    # Monitoring
    SENTRY_DSN = os.getenv('SENTRY_DSN')
    
    # Backup configuration
    BACKUP_INTERVAL = int(os.getenv('BACKUP_INTERVAL', '24'))  # hours
    BACKUP_RETENTION = int(os.getenv('BACKUP_RETENTION', '30'))  # days
    BACKUP_LOCATION = os.getenv('BACKUP_LOCATION', 'backups/')
    
    @staticmethod
    def init_app(app):
        """Initialize application with this configuration"""
        pass


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    SESSION_COOKIE_SECURE = False
    
    # Development database
    SQLALCHEMY_DATABASE_URI = os.getenv('DEV_DATABASE_URL') or \
        'postgresql://finance_user:finance_password@localhost:5432/finance_tracker_dev'
    
    # Disable CSRF for development
    WTF_CSRF_ENABLED = False
    
    # More verbose logging
    LOG_LEVEL = 'DEBUG'


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    WTF_CSRF_ENABLED = False
    SESSION_COOKIE_SECURE = False
    
    # Use in-memory SQLite for testing
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
    # Faster password hashing for tests
    BCRYPT_LOG_ROUNDS = 4
    
    # Disable rate limiting for tests
    RATELIMIT_ENABLED = False
    
    # Test Redis
    REDIS_URL = 'redis://localhost:6379/1'


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    
    # Enhanced security for production
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Strict'
    
    # Production logging
    LOG_LEVEL = 'WARNING'
    
    # SSL redirect
    PREFERRED_URL_SCHEME = 'https'
    
    @classmethod
    def init_app(cls, app):
        """Production-specific initialization"""
        Config.init_app(app)
        
        # Log to syslog in production
        import logging
        from logging.handlers import SysLogHandler
        syslog_handler = SysLogHandler()
        syslog_handler.setLevel(logging.WARNING)
        app.logger.addHandler(syslog_handler)


class DockerConfig(ProductionConfig):
    """Docker-specific configuration"""
    
    @classmethod
    def init_app(cls, app):
        """Docker-specific initialization"""
        ProductionConfig.init_app(app)
        
        # Log to stdout in Docker
        import logging
        import sys
        stream_handler = logging.StreamHandler(sys.stdout)
        stream_handler.setLevel(logging.INFO)
        app.logger.addHandler(stream_handler)


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'docker': DockerConfig,
    'default': DevelopmentConfig
}