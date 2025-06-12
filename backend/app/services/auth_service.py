from datetime import datetime, timedelta
from flask import current_app
from flask_mail import Message
import secrets
import hashlib

from .. import db, mail
from ..models.user import User
from ..utils.helpers import generate_token, hash_token

class AuthService:
    """Service class for authentication operations"""
    
    # Token blacklist storage (in production, use Redis)
    _token_blacklist = set()
    
    @staticmethod
    def send_verification_email(user):
        """Send email verification to user"""
        try:
            # Generate verification token
            token = generate_token(32)
            user.verification_token = hash_token(token)
            db.session.commit()
            
            # Create verification URL
            frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
            verification_url = f"{frontend_url}/verify-email?token={token}"
            
            # Send email
            msg = Message(
                subject="Verify Your Email - Smart Finance Assistant",
                recipients=[user.email],
                html=f"""
                <h2>Welcome to Smart Finance Assistant!</h2>
                <p>Hi {user.first_name},</p>
                <p>Thank you for registering with Smart Finance Assistant. To complete your registration, please verify your email address by clicking the link below:</p>
                <p><a href="{verification_url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p>{verification_url}</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create this account, please ignore this email.</p>
                <p>Best regards,<br>Smart Finance Assistant Team</p>
                """,
                sender=current_app.config.get('MAIL_DEFAULT_SENDER')
            )
            
            mail.send(msg)
            current_app.logger.info(f"Verification email sent to {user.email}")
            
        except Exception as e:
            current_app.logger.error(f"Failed to send verification email: {str(e)}")
            raise
    
    @staticmethod
    def verify_email_token(token):
        """Verify email verification token"""
        try:
            hashed_token = hash_token(token)
            user = User.query.filter_by(verification_token=hashed_token).first()
            
            if user:
                user.is_verified = True
                user.verification_token = None
                db.session.commit()
                return user
            
            return None
            
        except Exception as e:
            current_app.logger.error(f"Email verification error: {str(e)}")
            return None
    
    @staticmethod
    def send_password_reset_email(user):
        """Send password reset email"""
        try:
            # Generate reset token
            token = generate_token(32)
            user.password_reset_token = hash_token(token)
            user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
            db.session.commit()
            
            # Create reset URL
            frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
            reset_url = f"{frontend_url}/reset-password?token={token}"
            
            # Send email
            msg = Message(
                subject="Password Reset - Smart Finance Assistant",
                recipients=[user.email],
                html=f"""
                <h2>Password Reset Request</h2>
                <p>Hi {user.first_name},</p>
                <p>We received a request to reset your password for your Smart Finance Assistant account.</p>
                <p>Click the link below to reset your password:</p>
                <p><a href="{reset_url}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p>{reset_url}</p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
                <p>Best regards,<br>Smart Finance Assistant Team</p>
                """,
                sender=current_app.config.get('MAIL_DEFAULT_SENDER')
            )
            
            mail.send(msg)
            current_app.logger.info(f"Password reset email sent to {user.email}")
            
        except Exception as e:
            current_app.logger.error(f"Failed to send password reset email: {str(e)}")
            raise
    
    @staticmethod
    def reset_password(token, new_password):
        """Reset user password with token"""
        try:
            hashed_token = hash_token(token)
            user = User.query.filter_by(password_reset_token=hashed_token).first()
            
            if not user or not user.password_reset_expires:
                return None
            
            # Check if token is expired
            if datetime.utcnow() > user.password_reset_expires:
                return None
            
            # Reset password
            user.set_password(new_password)
            user.password_reset_token = None
            user.password_reset_expires = None
            user.failed_login_attempts = 0
            user.locked_until = None
            db.session.commit()
            
            return user
            
        except Exception as e:
            current_app.logger.error(f"Password reset error: {str(e)}")
            return None
    
    @staticmethod
    def blacklist_token(jti):
        """Add JWT token to blacklist"""
        AuthService._token_blacklist.add(jti)
        current_app.logger.info(f"Token blacklisted: {jti}")
    
    @staticmethod
    def is_token_blacklisted(jti):
        """Check if JWT token is blacklisted"""
        return jti in AuthService._token_blacklist
    
    @staticmethod
    def send_welcome_email(user):
        """Send welcome email to new user"""
        try:
            msg = Message(
                subject="Welcome to Smart Finance Assistant!",
                recipients=[user.email],
                html=f"""
                <h2>Welcome to Smart Finance Assistant!</h2>
                <p>Hi {user.first_name},</p>
                <p>Congratulations! Your email has been verified and your account is now active.</p>
                <p>Here are some next steps to get you started:</p>
                <ul>
                    <li>📊 Add your first transaction</li>
                    <li>🎯 Set up your budgets</li>
                    <li>🤖 Let our AI categorize your expenses</li>
                    <li>📈 Explore your spending insights</li>
                </ul>
                <p>If you have any questions, feel free to reach out to our support team.</p>
                <p>Happy budgeting!</p>
                <p>Best regards,<br>Smart Finance Assistant Team</p>
                """,
                sender=current_app.config.get('MAIL_DEFAULT_SENDER')
            )
            
            mail.send(msg)
            current_app.logger.info(f"Welcome email sent to {user.email}")
            
        except Exception as e:
            current_app.logger.error(f"Failed to send welcome email: {str(e)}")
    
    @staticmethod
    def send_login_alert(user, session):
        """Send login alert email for new device/location"""
        try:
            # Only send if user has notifications enabled
            if not user.notification_preferences.get('email_notifications', True):
                return
            
            msg = Message(
                subject="New Login to Your Account - Smart Finance Assistant",
                recipients=[user.email],
                html=f"""
                <h2>New Login Detected</h2>
                <p>Hi {user.first_name},</p>
                <p>We detected a new login to your Smart Finance Assistant account:</p>
                <ul>
                    <li><strong>Time:</strong> {session.created_at.strftime('%Y-%m-%d %H:%M:%S')} UTC</li>
                    <li><strong>Device:</strong> {session.device_type or 'Unknown'}</li>
                    <li><strong>Browser:</strong> {session.browser or 'Unknown'}</li>
                    <li><strong>Operating System:</strong> {session.operating_system or 'Unknown'}</li>
                    <li><strong>IP Address:</strong> {session.ip_address or 'Unknown'}</li>
                    <li><strong>Location:</strong> {session.city or 'Unknown'}, {session.country or 'Unknown'}</li>
                </ul>
                <p>If this was you, you can ignore this email.</p>
                <p>If this wasn't you, please secure your account immediately by changing your password.</p>
                <p>Best regards,<br>Smart Finance Assistant Team</p>
                """,
                sender=current_app.config.get('MAIL_DEFAULT_SENDER')
            )
            
            mail.send(msg)
            current_app.logger.info(f"Login alert sent to {user.email}")
            
        except Exception as e:
            current_app.logger.error(f"Failed to send login alert: {str(e)}")
    
    @staticmethod
    def cleanup_expired_tokens():
        """Clean up expired password reset tokens"""
        try:
            expired_users = User.query.filter(
                User.password_reset_expires < datetime.utcnow(),
                User.password_reset_token.isnot(None)
            ).all()
            
            count = 0
            for user in expired_users:
                user.password_reset_token = None
                user.password_reset_expires = None
                count += 1
            
            if count > 0:
                db.session.commit()
                current_app.logger.info(f"Cleaned up {count} expired password reset tokens")
            
            return count
            
        except Exception as e:
            current_app.logger.error(f"Token cleanup error: {str(e)}")
            return 0
    
    @staticmethod
    def generate_api_key(user_id):
        """Generate API key for user (future feature)"""
        # This is a placeholder for future API key functionality
        prefix = "sfa_"  # Smart Finance Assistant prefix
        key_data = f"{user_id}:{datetime.utcnow().isoformat()}:{secrets.token_hex(16)}"
        api_key = prefix + hash_token(key_data)[:32]
        return api_key
    
    @staticmethod
    def validate_api_key(api_key):
        """Validate API key (future feature)"""
        # This is a placeholder for future API key functionality
        if not api_key or not api_key.startswith("sfa_"):
            return None
        
        # In production, store API keys in database with user association
        return None