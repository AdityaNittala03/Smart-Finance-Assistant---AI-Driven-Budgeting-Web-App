import re
import phonenumbers
from phonenumbers import NumberParseException

def validate_email(email):
    """Validate email format"""
    if not email or not isinstance(email, str):
        return False
    
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email.strip()) is not None

def validate_password(password):
    """Validate password strength and return list of errors"""
    errors = []
    
    if not password or not isinstance(password, str):
        errors.append("Password is required")
        return errors
    
    # Length check
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    
    if len(password) > 128:
        errors.append("Password must be less than 128 characters")
    
    # Character type checks
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not re.search(r'\d', password):
        errors.append("Password must contain at least one number")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least one special character")
    
    # Common password checks
    common_passwords = [
        'password', '123456', 'password123', 'admin', 'qwerty',
        'letmein', 'welcome', 'monkey', '1234567890'
    ]
    
    if password.lower() in common_passwords:
        errors.append("Password is too common")
    
    # Sequential characters
    if re.search(r'(012|123|234|345|456|567|678|789|890)', password):
        errors.append("Password should not contain sequential numbers")
    
    if re.search(r'(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)', password.lower()):
        errors.append("Password should not contain sequential letters")
    
    return errors

def validate_phone(phone):
    """Validate phone number format"""
    if not phone or not isinstance(phone, str):
        return False
    
    try:
        # Parse the phone number
        parsed_number = phonenumbers.parse(phone, None)
        
        # Check if the number is valid
        return phonenumbers.is_valid_number(parsed_number)
    
    except NumberParseException:
        return False

def validate_currency(currency):
    """Validate currency code"""
    valid_currencies = {
        'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR',
        'BRL', 'MXN', 'KRW', 'SGD', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK',
        'PLN', 'CZK', 'HUF', 'RUB', 'ZAR', 'TRY', 'ILS', 'AED', 'SAR'
    }
    
    return currency and currency.upper() in valid_currencies

def validate_timezone(timezone):
    """Validate timezone string"""
    try:
        import pytz
        return timezone in pytz.all_timezones
    except ImportError:
        # Basic validation if pytz not available
        common_timezones = [
            'UTC', 'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific',
            'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo',
            'Asia/Shanghai', 'Australia/Sydney'
        ]
        return timezone in common_timezones

def validate_amount(amount, min_amount=0.01, max_amount=1000000):
    """Validate monetary amount"""
    try:
        amount_float = float(amount)
        return min_amount <= amount_float <= max_amount
    except (ValueError, TypeError):
        return False

def validate_date_string(date_string, format='%Y-%m-%d'):
    """Validate date string format"""
    if not date_string or not isinstance(date_string, str):
        return False
    
    try:
        from datetime import datetime
        datetime.strptime(date_string, format)
        return True
    except ValueError:
        return False

def validate_transaction_type(transaction_type):
    """Validate transaction type"""
    valid_types = ['income', 'expense']
    return transaction_type and transaction_type.lower() in valid_types

def validate_budget_period(period):
    """Validate budget period"""
    valid_periods = ['weekly', 'monthly', 'quarterly', 'yearly']
    return period and period.lower() in valid_periods

def validate_category_type(category_type):
    """Validate category type"""
    valid_types = ['income', 'expense']
    return category_type and category_type.lower() in valid_types

def validate_hex_color(color):
    """Validate hex color code"""
    if not color or not isinstance(color, str):
        return False
    
    pattern = r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'
    return re.match(pattern, color) is not None

def validate_username(username):
    """Validate username format"""
    if not username or not isinstance(username, str):
        return False
    
    # Username rules: 3-30 characters, alphanumeric + underscore, no leading/trailing underscore
    if len(username) < 3 or len(username) > 30:
        return False
    
    if username.startswith('_') or username.endswith('_'):
        return False
    
    pattern = r'^[a-zA-Z0-9_]+$'
    return re.match(pattern, username) is not None

def validate_file_extension(filename, allowed_extensions):
    """Validate file extension"""
    if not filename or not isinstance(filename, str):
        return False
    
    if '.' not in filename:
        return False
    
    extension = filename.rsplit('.', 1)[1].lower()
    return extension in allowed_extensions

def validate_csv_headers(headers, required_headers):
    """Validate CSV headers"""
    if not headers or not isinstance(headers, list):
        return False
    
    headers_lower = [h.lower().strip() for h in headers]
    required_lower = [h.lower() for h in required_headers]
    
    return all(req in headers_lower for req in required_lower)

def sanitize_string(input_string, max_length=None):
    """Sanitize input string"""
    if not input_string or not isinstance(input_string, str):
        return ""
    
    # Remove null bytes and control characters
    sanitized = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', input_string)
    
    # Strip whitespace
    sanitized = sanitized.strip()
    
    # Truncate if max_length specified
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized

def validate_confidence_score(score):
    """Validate ML confidence score (0.0 to 1.0)"""
    try:
        score_float = float(score)
        return 0.0 <= score_float <= 1.0
    except (ValueError, TypeError):
        return False

def validate_pagination_params(page, per_page, max_per_page=100):
    """Validate pagination parameters"""
    try:
        page_int = int(page) if page else 1
        per_page_int = int(per_page) if per_page else 20
        
        if page_int < 1:
            page_int = 1
        
        if per_page_int < 1:
            per_page_int = 20
        elif per_page_int > max_per_page:
            per_page_int = max_per_page
        
        return page_int, per_page_int
    
    except (ValueError, TypeError):
        return 1, 20