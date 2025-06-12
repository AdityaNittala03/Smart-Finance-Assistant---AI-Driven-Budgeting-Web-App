import secrets
import hashlib
import base64
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import json

def generate_token(length: int = 32) -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(length)

def hash_token(token: str) -> str:
    """Hash a token using SHA-256"""
    return hashlib.sha256(token.encode()).hexdigest()

def verify_token(token: str, hashed_token: str) -> bool:
    """Verify a token against its hash"""
    return hash_token(token) == hashed_token

def generate_uuid() -> str:
    """Generate a UUID4 string"""
    return str(uuid.uuid4())

def encode_base64(data: str) -> str:
    """Encode string to base64"""
    return base64.b64encode(data.encode()).decode()

def decode_base64(encoded_data: str) -> str:
    """Decode base64 string"""
    try:
        return base64.b64decode(encoded_data.encode()).decode()
    except Exception:
        return None

def safe_int(value: Any, default: int = 0) -> int:
    """Safely convert value to integer"""
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

def safe_float(value: Any, default: float = 0.0) -> float:
    """Safely convert value to float"""
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def truncate_string(text: str, max_length: int, suffix: str = "...") -> str:
    """Truncate string to max length with suffix"""
    if not text or len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix

def format_currency(amount: float, currency: str = 'USD') -> str:
    """Format amount as currency string"""
    currency_symbols = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
        'CAD': 'C$', 'AUD': 'A$', 'CHF': 'CHF', 'CNY': '¥'
    }
    
    symbol = currency_symbols.get(currency, currency)
    
    if currency == 'JPY':
        # JPY doesn't use decimal places
        return f"{symbol}{amount:,.0f}"
    else:
        return f"{symbol}{amount:,.2f}"

def parse_date_string(date_string: str, format: str = '%Y-%m-%d') -> Optional[datetime]:
    """Parse date string to datetime object"""
    try:
        return datetime.strptime(date_string, format)
    except (ValueError, TypeError):
        return None

def format_date(date_obj: datetime, format: str = '%Y-%m-%d') -> str:
    """Format datetime object to string"""
    if not date_obj:
        return ""
    return date_obj.strftime(format)

def get_date_range(period: str, start_date: Optional[datetime] = None) -> tuple:
    """Get start and end dates for a period"""
    if not start_date:
        start_date = datetime.now()
    
    if period == 'week':
        # Start of week (Monday)
        days_since_monday = start_date.weekday()
        week_start = start_date - timedelta(days=days_since_monday)
        week_end = week_start + timedelta(days=6)
        return week_start.date(), week_end.date()
    
    elif period == 'month':
        # Start of month
        month_start = start_date.replace(day=1)
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1) - timedelta(days=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1) - timedelta(days=1)
        return month_start.date(), month_end.date()
    
    elif period == 'quarter':
        # Start of quarter
        quarter = (start_date.month - 1) // 3
        quarter_start = start_date.replace(month=quarter * 3 + 1, day=1)
        quarter_end_month = quarter_start.month + 2
        if quarter_end_month > 12:
            quarter_end = quarter_start.replace(year=quarter_start.year + 1, month=quarter_end_month - 12)
        else:
            quarter_end = quarter_start.replace(month=quarter_end_month)
        
        # Last day of quarter
        if quarter_end.month == 12:
            quarter_end = quarter_end.replace(year=quarter_end.year + 1, month=1) - timedelta(days=1)
        else:
            quarter_end = quarter_end.replace(month=quarter_end.month + 1) - timedelta(days=1)
        
        return quarter_start.date(), quarter_end.date()
    
    elif period == 'year':
        # Start of year
        year_start = start_date.replace(month=1, day=1)
        year_end = start_date.replace(month=12, day=31)
        return year_start.date(), year_end.date()
    
    else:
        # Default to current day
        return start_date.date(), start_date.date()

def calculate_percentage_change(old_value: float, new_value: float) -> float:
    """Calculate percentage change between two values"""
    if old_value == 0:
        return 100.0 if new_value > 0 else 0.0
    
    return ((new_value - old_value) / old_value) * 100

def round_to_nearest(value: float, nearest: float = 0.01) -> float:
    """Round value to nearest specified amount"""
    return round(value / nearest) * nearest

def generate_filename(original_filename: str, prefix: str = "", suffix: str = "") -> str:
    """Generate unique filename with timestamp"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    name, ext = original_filename.rsplit('.', 1) if '.' in original_filename else (original_filename, '')
    
    parts = [prefix, name, timestamp, suffix]
    clean_parts = [part for part in parts if part]
    
    new_name = '_'.join(clean_parts)
    return f"{new_name}.{ext}" if ext else new_name

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage"""
    import re
    
    # Remove or replace dangerous characters
    sanitized = re.sub(r'[^\w\-_\.]', '_', filename)
    
    # Remove multiple consecutive underscores
    sanitized = re.sub(r'_+', '_', sanitized)
    
    # Remove leading/trailing underscores
    sanitized = sanitized.strip('_')
    
    return sanitized

def chunks(lst: list, chunk_size: int):
    """Split list into chunks of specified size"""
    for i in range(0, len(lst), chunk_size):
        yield lst[i:i + chunk_size]

def deep_merge_dicts(dict1: dict, dict2: dict) -> dict:
    """Deep merge two dictionaries"""
    result = dict1.copy()
    
    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge_dicts(result[key], value)
        else:
            result[key] = value
    
    return result

def flatten_dict(d: dict, parent_key: str = '', separator: str = '.') -> dict:
    """Flatten nested dictionary"""
    items = []
    
    for key, value in d.items():
        new_key = f"{parent_key}{separator}{key}" if parent_key else key
        
        if isinstance(value, dict):
            items.extend(flatten_dict(value, new_key, separator).items())
        else:
            items.append((new_key, value))
    
    return dict(items)

def mask_sensitive_data(data: str, visible_chars: int = 4, mask_char: str = '*') -> str:
    """Mask sensitive data showing only last few characters"""
    if len(data) <= visible_chars:
        return mask_char * len(data)
    
    masked_length = len(data) - visible_chars
    return mask_char * masked_length + data[-visible_chars:]

def calculate_file_hash(file_content: bytes, algorithm: str = 'sha256') -> str:
    """Calculate hash of file content"""
    if algorithm == 'md5':
        hash_obj = hashlib.md5()
    elif algorithm == 'sha1':
        hash_obj = hashlib.sha1()
    elif algorithm == 'sha256':
        hash_obj = hashlib.sha256()
    else:
        raise ValueError(f"Unsupported hash algorithm: {algorithm}")
    
    hash_obj.update(file_content)
    return hash_obj.hexdigest()

def get_client_ip(request) -> str:
    """Get client IP address from request"""
    # Check for forwarded IPs (when behind proxy/load balancer)
    if request.headers.get('X-Forwarded-For'):
        # Take the first IP in the chain
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    elif request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    else:
        return request.remote_addr

def is_valid_json(json_string: str) -> bool:
    """Check if string is valid JSON"""
    try:
        json.loads(json_string)
        return True
    except (json.JSONDecodeError, TypeError):
        return False

def get_nested_value(data: dict, path: str, default=None, separator: str = '.'):
    """Get nested value from dictionary using dot notation"""
    keys = path.split(separator)
    current = data
    
    try:
        for key in keys:
            current = current[key]
        return current
    except (KeyError, TypeError, IndexError):
        return default

def set_nested_value(data: dict, path: str, value, separator: str = '.') -> dict:
    """Set nested value in dictionary using dot notation"""
    keys = path.split(separator)
    current = data
    
    for key in keys[:-1]:
        if key not in current or not isinstance(current[key], dict):
            current[key] = {}
        current = current[key]
    
    current[keys[-1]] = value
    return data

def remove_none_values(data: dict) -> dict:
    """Remove None values from dictionary recursively"""
    if isinstance(data, dict):
        return {
            key: remove_none_values(value)
            for key, value in data.items()
            if value is not None
        }
    elif isinstance(data, list):
        return [remove_none_values(item) for item in data if item is not None]
    else:
        return data

def time_ago(date_time: datetime) -> str:
    """Get human-readable time ago string"""
    if not date_time:
        return "Never"
    
    now = datetime.utcnow()
    diff = now - date_time
    
    seconds = diff.total_seconds()
    
    if seconds < 60:
        return "Just now"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif seconds < 2592000:  # 30 days
        days = int(seconds / 86400)
        return f"{days} day{'s' if days != 1 else ''} ago"
    elif seconds < 31536000:  # 365 days
        months = int(seconds / 2592000)
        return f"{months} month{'s' if months != 1 else ''} ago"
    else:
        years = int(seconds / 31536000)
        return f"{years} year{'s' if years != 1 else ''} ago"