from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from .. import db, limiter
from ..models.user import User
from ..utils.validators import validate_email, validate_phone
from ..utils.decorators import handle_errors

users_bp = Blueprint('users', __name__)

@users_bp.route('/profile', methods=['GET'])
@jwt_required()
@handle_errors
def get_profile():
    """Get user profile"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
@handle_errors
def update_profile():
    """Update user profile"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Validate email if being updated
    if 'email' in data:
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if email is already taken by another user
        existing_user = User.find_by_email(data['email'])
        if existing_user and existing_user.id != user_id:
            return jsonify({'error': 'Email already registered'}), 409
        
        user.email = data['email'].lower()
        user.is_verified = False  # Require re-verification for new email
    
    # Validate username if being updated
    if 'username' in data:
        existing_user = User.find_by_username(data['username'])
        if existing_user and existing_user.id != user_id:
            return jsonify({'error': 'Username already taken'}), 409
        
        user.username = data['username']
    
    # Validate phone if provided
    if 'phone' in data and data['phone']:
        if not validate_phone(data['phone']):
            return jsonify({'error': 'Invalid phone number format'}), 400
        user.phone = data['phone']
    
    # Update other fields
    updateable_fields = [
        'first_name', 'last_name', 'date_of_birth', 'currency', 
        'timezone', 'notification_preferences', 'auto_categorize',
        'ml_confidence_threshold'
    ]
    
    for field in updateable_fields:
        if field in data:
            setattr(user, field, data[field])
    
    user.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Profile update error: {str(e)}")
        return jsonify({'error': 'Profile update failed'}), 500

@users_bp.route('/preferences', methods=['GET'])
@jwt_required()
@handle_errors
def get_preferences():
    """Get user preferences"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    preferences = {
        'currency': user.currency,
        'timezone': user.timezone,
        'notification_preferences': user.notification_preferences,
        'auto_categorize': user.auto_categorize,
        'ml_confidence_threshold': user.ml_confidence_threshold
    }
    
    return jsonify({'preferences': preferences}), 200

@users_bp.route('/preferences', methods=['PUT'])
@jwt_required()
@handle_errors
def update_preferences():
    """Update user preferences"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Update currency
    if 'currency' in data:
        if data['currency'] not in ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR']:
            return jsonify({'error': 'Unsupported currency'}), 400
        user.currency = data['currency']
    
    # Update timezone
    if 'timezone' in data:
        # You might want to validate timezone against pytz.all_timezones
        user.timezone = data['timezone']
    
    # Update notification preferences
    if 'notification_preferences' in data:
        valid_keys = [
            'email_notifications', 'budget_alerts', 'spending_alerts', 'weekly_summary'
        ]
        notification_prefs = {}
        for key in valid_keys:
            notification_prefs[key] = data['notification_preferences'].get(key, True)
        user.notification_preferences = notification_prefs
    
    # Update ML preferences
    if 'auto_categorize' in data:
        user.auto_categorize = bool(data['auto_categorize'])
    
    if 'ml_confidence_threshold' in data:
        threshold = float(data['ml_confidence_threshold'])
        if 0.0 <= threshold <= 1.0:
            user.ml_confidence_threshold = threshold
        else:
            return jsonify({'error': 'ML confidence threshold must be between 0.0 and 1.0'}), 400
    
    user.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Preferences updated successfully',
            'preferences': {
                'currency': user.currency,
                'timezone': user.timezone,
                'notification_preferences': user.notification_preferences,
                'auto_categorize': user.auto_categorize,
                'ml_confidence_threshold': user.ml_confidence_threshold
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Preferences update error: {str(e)}")
        return jsonify({'error': 'Preferences update failed'}), 500

@users_bp.route('/stats', methods=['GET'])
@jwt_required()
@handle_errors
def get_user_stats():
    """Get user statistics"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    from ..models.transaction import Transaction
    from ..models.budget import Budget
    from ..models.category import Category
    from sqlalchemy import func
    
    # Transaction stats
    transaction_stats = db.session.query(
        func.count(Transaction.id).label('total_transactions'),
        func.sum(Transaction.amount).filter(Transaction.type == 'income').label('total_income'),
        func.sum(Transaction.amount).filter(Transaction.type == 'expense').label('total_expenses')
    ).filter(
        Transaction.user_id == user_id,
        Transaction.is_deleted == False
    ).first()
    
    # Budget stats
    budget_stats = db.session.query(
        func.count(Budget.id).label('total_budgets'),
        func.count(Budget.id).filter(Budget.is_active == True).label('active_budgets')
    ).filter(Budget.user_id == user_id).first()
    
    # Category stats
    category_stats = db.session.query(
        func.count(Category.id).label('custom_categories')
    ).filter(
        Category.user_id == user_id,
        Category.is_active == True
    ).first()
    
    # Recent activity
    recent_transactions = Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.is_deleted == False
    ).order_by(Transaction.created_at.desc()).limit(5).all()
    
    stats = {
        'account': {
            'member_since': user.created_at.isoformat(),
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'is_verified': user.is_verified
        },
        'transactions': {
            'total': transaction_stats.total_transactions or 0,
            'total_income': float(transaction_stats.total_income or 0),
            'total_expenses': float(transaction_stats.total_expenses or 0),
            'net_worth': float((transaction_stats.total_income or 0) - (transaction_stats.total_expenses or 0))
        },
        'budgets': {
            'total': budget_stats.total_budgets or 0,
            'active': budget_stats.active_budgets or 0
        },
        'categories': {
            'custom': category_stats.custom_categories or 0
        },
        'recent_activity': [t.to_dict() for t in recent_transactions]
    }
    
    return jsonify({'stats': stats}), 200

@users_bp.route('/export', methods=['POST'])
@jwt_required()
@limiter.limit("5 per hour")
@handle_errors
def export_user_data():
    """Export user data (GDPR compliance)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    export_format = data.get('format', 'json')  # json, csv
    include_transactions = data.get('include_transactions', True)
    include_budgets = data.get('include_budgets', True)
    
    if export_format not in ['json', 'csv']:
        return jsonify({'error': 'Unsupported export format'}), 400
    
    try:
        from ..services.export_service import ExportService
        
        export_data = ExportService.export_user_data(
            user_id,
            format=export_format,
            include_transactions=include_transactions,
            include_budgets=include_budgets
        )
        
        return jsonify({
            'message': 'Data export completed',
            'download_url': export_data['download_url'],
            'expires_at': export_data['expires_at']
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Data export error: {str(e)}")
        return jsonify({'error': 'Data export failed'}), 500

@users_bp.route('/delete', methods=['DELETE'])
@jwt_required()
@handle_errors
def delete_account():
    """Delete user account (GDPR compliance)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    confirmation = data.get('confirmation')
    password = data.get('password')
    
    if confirmation != 'DELETE':
        return jsonify({'error': 'Account deletion not confirmed'}), 400
    
    if not user.check_password(password):
        return jsonify({'error': 'Invalid password'}), 401
    
    try:
        from ..services.user_service import UserService
        
        # This will soft delete or anonymize data based on requirements
        UserService.delete_user_account(user_id)
        
        return jsonify({'message': 'Account deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Account deletion error: {str(e)}")
        return jsonify({'error': 'Account deletion failed'}), 500

@users_bp.route('/avatar', methods=['POST'])
@jwt_required()
@handle_errors
def upload_avatar():
    """Upload user avatar"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if 'avatar' not in request.files:
        return jsonify({'error': 'No avatar file provided'}), 400
    
    file = request.files['avatar']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    try:
        from ..services.file_service import FileService
        
        avatar_url = FileService.upload_avatar(user_id, file)
        
        return jsonify({
            'message': 'Avatar uploaded successfully',
            'avatar_url': avatar_url
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Avatar upload error: {str(e)}")
        return jsonify({'error': 'Avatar upload failed'}), 500