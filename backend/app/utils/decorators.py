from functools import wraps
from flask import jsonify, current_app, request
from flask_jwt_extended import get_jwt_identity, jwt_required
import traceback
import time

def handle_errors(f):
    """Decorator to handle exceptions and return proper JSON responses"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            current_app.logger.warning(f"ValueError in {f.__name__}: {str(e)}")
            return jsonify({'error': 'Invalid input data', 'details': str(e)}), 400
        except KeyError as e:
            current_app.logger.warning(f"KeyError in {f.__name__}: {str(e)}")
            return jsonify({'error': 'Missing required field', 'field': str(e)}), 400
        except PermissionError as e:
            current_app.logger.warning(f"PermissionError in {f.__name__}: {str(e)}")
            return jsonify({'error': 'Permission denied', 'details': str(e)}), 403
        except FileNotFoundError as e:
            current_app.logger.warning(f"FileNotFoundError in {f.__name__}: {str(e)}")
            return jsonify({'error': 'Resource not found', 'details': str(e)}), 404
        except Exception as e:
            current_app.logger.error(f"Unexpected error in {f.__name__}: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            
            # Don't expose internal errors in production
            if current_app.config.get('DEBUG'):
                return jsonify({'error': 'Internal server error', 'details': str(e)}), 500
            else:
                return jsonify({'error': 'Internal server error'}), 500
    
    return decorated_function

def require_permission(permission):
    """Decorator to require specific permissions"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # This is a placeholder for future role-based access control
            # For now, just ensure user is authenticated
            user_id = get_jwt_identity()
            if not user_id:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Future: Check user permissions against required permission
            # user = User.query.get(user_id)
            # if not user.has_permission(permission):
            #     return jsonify({'error': 'Insufficient permissions'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def validate_json(required_fields=None, optional_fields=None):
    """Decorator to validate JSON request data"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({'error': 'Request must be JSON'}), 400
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No JSON data provided'}), 400
            
            # Check required fields
            if required_fields:
                missing_fields = []
                for field in required_fields:
                    if field not in data or data[field] is None:
                        missing_fields.append(field)
                
                if missing_fields:
                    return jsonify({
                        'error': 'Missing required fields',
                        'missing_fields': missing_fields
                    }), 400
            
            # Filter to allowed fields only
            if optional_fields or required_fields:
                allowed_fields = set()
                if required_fields:
                    allowed_fields.update(required_fields)
                if optional_fields:
                    allowed_fields.update(optional_fields)
                
                # Remove unexpected fields
                filtered_data = {k: v for k, v in data.items() if k in allowed_fields}
                request._cached_json = filtered_data
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def rate_limit_key():
    """Generate rate limit key based on user or IP"""
    try:
        user_id = get_jwt_identity()
        if user_id:
            return f"user:{user_id}"
    except:
        pass
    
    return f"ip:{request.remote_addr}"

def cache_response(timeout=300):
    """Decorator to cache response data"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # This is a placeholder for future caching implementation
            # For now, just execute the function
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def log_activity(activity_type):
    """Decorator to log user activity"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                user_id = get_jwt_identity()
                if user_id:
                    # Log the activity
                    current_app.logger.info(
                        f"User {user_id} performed {activity_type} - "
                        f"{request.method} {request.path}"
                    )
                
                result = f(*args, **kwargs)
                
                # Log successful completion
                if user_id:
                    current_app.logger.info(
                        f"User {user_id} completed {activity_type} successfully"
                    )
                
                return result
            
            except Exception as e:
                # Log failed activity
                if 'user_id' in locals():
                    current_app.logger.warning(
                        f"User {user_id} failed {activity_type}: {str(e)}"
                    )
                raise
        
        return decorated_function
    return decorator

def validate_user_access(get_user_id_func=None):
    """Decorator to validate user access to resources"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user_id = get_jwt_identity()
            
            if get_user_id_func:
                # Custom function to extract user ID from request
                resource_user_id = get_user_id_func(*args, **kwargs)
            else:
                # Default: check if 'user_id' is in kwargs or request args
                resource_user_id = kwargs.get('user_id') or request.args.get('user_id')
            
            if resource_user_id and str(current_user_id) != str(resource_user_id):
                return jsonify({'error': 'Access denied to this resource'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_verification(f):
    """Decorator to require email verification"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
        
        from ..models.user import User
        user = User.query.get(user_id)
        
        if not user or not user.is_verified:
            return jsonify({
                'error': 'Email verification required',
                'verification_required': True
            }), 403
        
        return f(*args, **kwargs)
    return decorated_function

def track_api_usage(f):
    """Decorator to track API endpoint usage"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        
        try:
            result = f(*args, **kwargs)
            status_code = getattr(result, 'status_code', 200)
        except Exception as e:
            status_code = 500
            raise
        finally:
            end_time = time.time()
            duration = end_time - start_time
            
            # Log API usage metrics
            current_app.logger.info(
                f"API Usage - {request.method} {request.path} - "
                f"Status: {status_code} - Duration: {duration:.3f}s"
            )
        
        return result
    return decorated_function

def require_content_type(content_type):
    """Decorator to require specific content type"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if request.content_type != content_type:
                return jsonify({
                    'error': f'Content-Type must be {content_type}'
                }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator