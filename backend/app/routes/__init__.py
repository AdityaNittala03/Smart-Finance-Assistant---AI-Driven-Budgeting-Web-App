from flask import Blueprint
from .auth import auth_bp
from .users import users_bp
from .transactions import transactions_bp
from .categories import categories_bp
from .budgets import budgets_bp
from .analytics import analytics_bp
from .ml import ml_bp
from .health import health_bp

def register_blueprints(app):
    """Register all blueprints with the Flask app"""
    
    # API version prefix
    api_prefix = '/api/v1'
    
    # Register blueprints
    app.register_blueprint(health_bp)  # No prefix for health check
    app.register_blueprint(auth_bp, url_prefix=f'{api_prefix}/auth')
    app.register_blueprint(users_bp, url_prefix=f'{api_prefix}/users')
    app.register_blueprint(transactions_bp, url_prefix=f'{api_prefix}/transactions')
    app.register_blueprint(categories_bp, url_prefix=f'{api_prefix}/categories')
    app.register_blueprint(budgets_bp, url_prefix=f'{api_prefix}/budgets')
    app.register_blueprint(analytics_bp, url_prefix=f'{api_prefix}/analytics')
    app.register_blueprint(ml_bp, url_prefix=f'{api_prefix}/ml')

__all__ = [
    'register_blueprints',
    'auth_bp',
    'users_bp', 
    'transactions_bp',
    'categories_bp',
    'budgets_bp',
    'analytics_bp',
    'ml_bp',
    'health_bp'
]