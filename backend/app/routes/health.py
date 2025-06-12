from flask import Blueprint, jsonify
from datetime import datetime
from .. import db
import os

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Check database connection
        db.session.execute('SELECT 1')
        db_status = 'healthy'
    except Exception as e:
        db_status = f'unhealthy: {str(e)}'
    
    # Check if in development mode
    is_dev = os.getenv('FLASK_ENV') == 'development'
    
    health_data = {
        'status': 'healthy' if db_status == 'healthy' else 'unhealthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0',
        'environment': os.getenv('FLASK_ENV', 'production'),
        'database': db_status,
        'uptime': datetime.utcnow().isoformat()  # Simplified uptime
    }
    
    # Add debug info in development
    if is_dev:
        health_data['debug'] = {
            'python_version': os.sys.version,
            'database_url': os.getenv('DATABASE_URL', '').split('@')[-1] if os.getenv('DATABASE_URL') else 'not set'
        }
    
    status_code = 200 if health_data['status'] == 'healthy' else 503
    return jsonify(health_data), status_code

@health_bp.route('/ready', methods=['GET'])
def readiness_check():
    """Readiness check for Kubernetes/Docker deployments"""
    try:
        # More thorough checks for readiness
        db.session.execute('SELECT COUNT(*) FROM users LIMIT 1')
        
        return jsonify({
            'status': 'ready',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'not ready',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 503

@health_bp.route('/live', methods=['GET'])
def liveness_check():
    """Liveness check for Kubernetes/Docker deployments"""
    return jsonify({
        'status': 'alive',
        'timestamp': datetime.utcnow().isoformat()
    }), 200