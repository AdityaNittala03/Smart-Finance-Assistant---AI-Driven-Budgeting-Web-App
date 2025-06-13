from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required, 
    get_jwt_identity, get_jwt
)
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.security import check_password_hash
from datetime import datetime, timedelta
import uuid

from .. import db, limiter
from ..models.user import User
from ..models.user_session import UserSession
from ..services.auth_service import AuthService
from ..utils.validators import validate_email, validate_password
from ..utils.decorators import handle_errors

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per minute")
@handle_errors
def register():
    """User registration endpoint"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['email', 'username', 'password', 'first_name', 'last_name']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Validate email format
    if not validate_email(data['email']):
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Validate password strength
    password_errors = validate_password(data['password'])
    if password_errors:
        return jsonify({'error': 'Password validation failed', 'details': password_errors}), 400
    
    # Check if user already exists
    if User.find_by_email(data['email']):
        return jsonify({'error': 'Email already registered'}), 409
    
    if User.find_by_username(data['username']):
        return jsonify({'error': 'Username already taken'}), 409
    
    # Create new user
    try:
        user = User(
            email=data['email'],
            username=data['username'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data.get('phone'),
            date_of_birth=data.get('date_of_birth'),
            currency=data.get('currency', 'INR'),
            timezone=data.get('timezone', 'UTC')
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Send verification email
        AuthService.send_verification_email(user)
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'verification_required': True
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed'}), 500

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
@handle_errors
def login():
    """User login endpoint"""
    data = request.get_json()
    
    # Validate required fields
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    email = data['email'].lower()
    password = data['password']
    
    # Find user
    user = User.find_by_email(email)
    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Check if account is locked
    if user.is_locked:
        return jsonify({
            'error': 'Account is temporarily locked',
            'locked_until': user.locked_until.isoformat()
        }), 423
    
    # Check if account is active
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 401
    
    # Verify password
    if not user.check_password(password):
        user.increment_failed_login()
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Reset failed login attempts on successful login
    user.reset_failed_login()
    user.update_last_login()
    
    # Create session
    session = UserSession(
        user_id=user.id,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(session)
    db.session.commit()
    
    # Create JWT tokens
    access_token = create_access_token(
        identity=user.id,
        additional_claims={'session_id': session.session_id}
    )
    refresh_token = create_refresh_token(identity=user.id)
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token,
        'session_id': session.session_id
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
@handle_errors
def logout():
    """User logout endpoint"""
    user_id = get_jwt_identity()
    claims = get_jwt()
    session_id = claims.get('session_id')
    
    # Invalidate session if exists
    if session_id:
        session = UserSession.find_by_session_id(session_id)
        if session:
            session.invalidate('user_logout')
    
    # Add token to blacklist (implement token blacklist service)
    AuthService.blacklist_token(get_jwt()['jti'])
    
    return jsonify({'message': 'Logout successful'}), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
@handle_errors
def refresh():
    """Refresh access token"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or not user.is_active:
        return jsonify({'error': 'Invalid user'}), 401
    
    # Create new access token
    access_token = create_access_token(identity=user_id)
    
    return jsonify({'access_token': access_token}), 200

@auth_bp.route('/verify-email', methods=['POST'])
@handle_errors
def verify_email():
    """Email verification endpoint"""
    data = request.get_json()
    token = data.get('token')
    
    if not token:
        return jsonify({'error': 'Verification token is required'}), 400
    
    # Verify token and activate user
    user = AuthService.verify_email_token(token)
    if not user:
        return jsonify({'error': 'Invalid or expired verification token'}), 400
    
    return jsonify({
        'message': 'Email verified successfully',
        'user': user.to_dict()
    }), 200

@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit("3 per hour")
@handle_errors
def forgot_password():
    """Forgot password endpoint"""
    data = request.get_json()
    email = data.get('email')
    
    if not email or not validate_email(email):
        return jsonify({'error': 'Valid email is required'}), 400
    
    user = User.find_by_email(email)
    if user:
        # Send password reset email
        AuthService.send_password_reset_email(user)
    
    # Always return success to prevent email enumeration
    return jsonify({
        'message': 'If the email exists, a password reset link has been sent'
    }), 200

@auth_bp.route('/reset-password', methods=['POST'])
@handle_errors
def reset_password():
    """Reset password endpoint"""
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')
    
    if not token or not new_password:
        return jsonify({'error': 'Token and new password are required'}), 400
    
    # Validate password strength
    password_errors = validate_password(new_password)
    if password_errors:
        return jsonify({'error': 'Password validation failed', 'details': password_errors}), 400
    
    # Reset password
    user = AuthService.reset_password(token, new_password)
    if not user:
        return jsonify({'error': 'Invalid or expired reset token'}), 400
    
    # Force logout all sessions
    UserSession.force_logout_user(user.id, 'password_reset')
    
    return jsonify({'message': 'Password reset successfully'}), 200

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
@handle_errors
def change_password():
    """Change password endpoint (for logged-in users)"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({'error': 'Current and new passwords are required'}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Verify current password
    if not user.check_password(current_password):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    # Validate new password
    password_errors = validate_password(new_password)
    if password_errors:
        return jsonify({'error': 'Password validation failed', 'details': password_errors}), 400
    
    # Update password
    user.set_password(new_password)
    db.session.commit()
    
    # Force logout other sessions
    claims = get_jwt()
    current_session_id = claims.get('session_id')
    sessions = UserSession.get_user_sessions(user_id)
    
    for session in sessions:
        if session.session_id != current_session_id:
            session.invalidate('password_change')
    
    return jsonify({'message': 'Password changed successfully'}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
@handle_errors
def get_current_user():
    """Get current user information"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200

@auth_bp.route('/sessions', methods=['GET'])
@jwt_required()
@handle_errors
def get_user_sessions():
    """Get user's active sessions"""
    user_id = get_jwt_identity()
    sessions = UserSession.get_user_sessions(user_id, active_only=True)
    
    return jsonify({
        'sessions': [session.to_dict() for session in sessions]
    }), 200

@auth_bp.route('/sessions/<session_id>', methods=['DELETE'])
@jwt_required()
@handle_errors
def terminate_session(session_id):
    """Terminate a specific session"""
    user_id = get_jwt_identity()
    session = UserSession.find_by_session_id(session_id)
    
    if not session or session.user_id != user_id:
        return jsonify({'error': 'Session not found'}), 404
    
    session.invalidate('user_termination')
    
    return jsonify({'message': 'Session terminated successfully'}), 200

@auth_bp.route('/sessions/terminate-all', methods=['POST'])
@jwt_required()
@handle_errors
def terminate_all_sessions():
    """Terminate all user sessions except current"""
    user_id = get_jwt_identity()
    claims = get_jwt()
    current_session_id = claims.get('session_id')
    
    sessions = UserSession.get_user_sessions(user_id)
    terminated_count = 0
    
    for session in sessions:
        if session.session_id != current_session_id and session.is_active:
            session.invalidate('user_termination')
            terminated_count += 1
    
    return jsonify({
        'message': f'Terminated {terminated_count} sessions',
        'terminated_count': terminated_count
    }), 200