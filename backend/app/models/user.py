from datetime import datetime, timedelta
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from .. import db

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Profile information
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20))
    date_of_birth = db.Column(db.Date)
    
    # Account status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    verification_token = db.Column(db.String(100))
    
    # Security
    failed_login_attempts = db.Column(db.Integer, default=0, nullable=False)
    locked_until = db.Column(db.DateTime)
    last_login = db.Column(db.DateTime)
    password_reset_token = db.Column(db.String(100))
    password_reset_expires = db.Column(db.DateTime)
    
    # Preferences
    currency = db.Column(db.String(3), default='USD', nullable=False)
    timezone = db.Column(db.String(50), default='UTC', nullable=False)
    notification_preferences = db.Column(db.JSON, default={
        'email_notifications': True,
        'budget_alerts': True,
        'spending_alerts': True,
        'weekly_summary': True
    })
    
    # ML preferences
    auto_categorize = db.Column(db.Boolean, default=True, nullable=False)
    ml_confidence_threshold = db.Column(db.Float, default=0.8, nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    transactions = db.relationship('Transaction', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    budgets = db.relationship('Budget', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    categories = db.relationship('Category', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    sessions = db.relationship('UserSession', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def __init__(self, email, username, password, first_name, last_name, **kwargs):
        self.email = email.lower()
        self.username = username
        self.first_name = first_name
        self.last_name = last_name
        self.set_password(password)
        
        # Set optional fields
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)
    
    def get_id(self):
        """Return user ID as string for Flask-Login"""
        return str(self.id)
    
    @property
    def full_name(self):
        """Return full name"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_locked(self):
        """Check if account is locked"""
        if self.locked_until:
            return datetime.utcnow() < self.locked_until
        return False
    
    def lock_account(self, duration_minutes=15):
        """Lock account for specified duration"""
        self.locked_until = datetime.utcnow() + timedelta(minutes=duration_minutes)
        self.failed_login_attempts = 0
        db.session.commit()
    
    def unlock_account(self):
        """Unlock account"""
        self.locked_until = None
        self.failed_login_attempts = 0
        db.session.commit()
    
    def increment_failed_login(self):
        """Increment failed login attempts"""
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            self.lock_account()
        db.session.commit()
    
    def reset_failed_login(self):
        """Reset failed login attempts"""
        self.failed_login_attempts = 0
        db.session.commit()
    
    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self, include_sensitive=False):
        """Convert user to dictionary"""
        data = {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'phone': self.phone,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'currency': self.currency,
            'timezone': self.timezone,
            'notification_preferences': self.notification_preferences,
            'auto_categorize': self.auto_categorize,
            'ml_confidence_threshold': self.ml_confidence_threshold,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_sensitive:
            data.update({
                'failed_login_attempts': self.failed_login_attempts,
                'is_locked': self.is_locked,
                'locked_until': self.locked_until.isoformat() if self.locked_until else None
            })
        
        return data
    
    @staticmethod
    def find_by_email(email):
        """Find user by email"""
        return User.query.filter_by(email=email.lower()).first()
    
    @staticmethod
    def find_by_username(username):
        """Find user by username"""
        return User.query.filter_by(username=username).first()
    
    def __repr__(self):
        return f'<User {self.username}>'