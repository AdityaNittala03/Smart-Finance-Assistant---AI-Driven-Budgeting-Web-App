from datetime import datetime, timedelta
from .. import db
import uuid

class UserSession(db.Model):
    __tablename__ = 'user_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Session identification
    session_id = db.Column(db.String(100), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Session details
    ip_address = db.Column(db.String(45))  # IPv6 compatible
    user_agent = db.Column(db.Text)
    device_type = db.Column(db.String(50))  # mobile, tablet, desktop
    browser = db.Column(db.String(100))
    operating_system = db.Column(db.String(100))
    
    # Geographic info
    country = db.Column(db.String(100))
    city = db.Column(db.String(100))
    
    # Session timing
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    
    # Session status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    logout_reason = db.Column(db.Enum(
        'user_logout', 'timeout', 'forced', 'expired', 'security',
        name='logout_reason'
    ))
    
    # Security flags
    is_suspicious = db.Column(db.Boolean, default=False)
    failed_attempts = db.Column(db.Integer, default=0)
    
    # Session data (optional)
    session_data = db.Column(db.JSON, default={})
    
    # Indexes
    __table_args__ = (
        db.Index('idx_session_user_active', 'user_id', 'is_active'),
        db.Index('idx_session_expiry', 'expires_at'),
        db.Index('idx_session_activity', 'last_activity'),
    )
    
    def __init__(self, user_id, ip_address=None, user_agent=None, **kwargs):
        self.session_id = str(uuid.uuid4())
        self.user_id = user_id
        self.ip_address = ip_address
        self.user_agent = user_agent
        
        # Set default expiry (24 hours from now)
        self.expires_at = datetime.utcnow() + timedelta(hours=24)
        
        # Parse user agent if provided
        if user_agent:
            self._parse_user_agent(user_agent)
        
        # Set optional fields
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def _parse_user_agent(self, user_agent):
        """Parse user agent string to extract device info"""
        user_agent_lower = user_agent.lower()
        
        # Detect device type
        if any(mobile in user_agent_lower for mobile in ['mobile', 'android', 'iphone']):
            self.device_type = 'mobile'
        elif 'tablet' in user_agent_lower or 'ipad' in user_agent_lower:
            self.device_type = 'tablet'
        else:
            self.device_type = 'desktop'
        
        # Detect browser
        if 'chrome' in user_agent_lower and 'edge' not in user_agent_lower:
            self.browser = 'Chrome'
        elif 'firefox' in user_agent_lower:
            self.browser = 'Firefox'
        elif 'safari' in user_agent_lower and 'chrome' not in user_agent_lower:
            self.browser = 'Safari'
        elif 'edge' in user_agent_lower:
            self.browser = 'Edge'
        elif 'opera' in user_agent_lower:
            self.browser = 'Opera'
        else:
            self.browser = 'Unknown'
        
        # Detect operating system
        if 'windows' in user_agent_lower:
            self.operating_system = 'Windows'
        elif 'mac' in user_agent_lower:
            self.operating_system = 'macOS'
        elif 'linux' in user_agent_lower:
            self.operating_system = 'Linux'
        elif 'android' in user_agent_lower:
            self.operating_system = 'Android'
        elif 'ios' in user_agent_lower or 'iphone' in user_agent_lower or 'ipad' in user_agent_lower:
            self.operating_system = 'iOS'
        else:
            self.operating_system = 'Unknown'
    
    @property
    def is_expired(self):
        """Check if session is expired"""
        return datetime.utcnow() > self.expires_at
    
    @property
    def time_until_expiry(self):
        """Get time until session expires"""
        if self.is_expired:
            return timedelta(0)
        return self.expires_at - datetime.utcnow()
    
    @property
    def duration(self):
        """Get session duration"""
        return self.last_activity - self.created_at
    
    @property
    def is_valid(self):
        """Check if session is valid (active and not expired)"""
        return self.is_active and not self.is_expired
    
    def update_activity(self):
        """Update last activity timestamp"""
        self.last_activity = datetime.utcnow()
        db.session.commit()
    
    def extend_session(self, hours=24):
        """Extend session expiry time"""
        self.expires_at = datetime.utcnow() + timedelta(hours=hours)
        self.update_activity()
    
    def invalidate(self, reason='user_logout'):
        """Invalidate the session"""
        self.is_active = False
        self.logout_reason = reason
        db.session.commit()
    
    def mark_suspicious(self):
        """Mark session as suspicious"""
        self.is_suspicious = True
        db.session.commit()
    
    def increment_failed_attempts(self):
        """Increment failed attempts counter"""
        self.failed_attempts += 1
        if self.failed_attempts >= 5:
            self.invalidate(reason='security')
        db.session.commit()
    
    def reset_failed_attempts(self):
        """Reset failed attempts counter"""
        self.failed_attempts = 0
        db.session.commit()
    
    def set_location(self, country=None, city=None):
        """Set geographic location"""
        if country:
            self.country = country
        if city:
            self.city = city
        db.session.commit()
    
    def update_session_data(self, key, value):
        """Update session data"""
        if self.session_data is None:
            self.session_data = {}
        self.session_data[key] = value
        db.session.commit()
    
    def get_session_data(self, key, default=None):
        """Get session data value"""
        if self.session_data is None:
            return default
        return self.session_data.get(key, default)
    
    def to_dict(self, include_sensitive=False):
        """Convert session to dictionary"""
        data = {
            'id': self.id,
            'session_id': self.session_id,
            'user_id': self.user_id,
            'device_type': self.device_type,
            'browser': self.browser,
            'operating_system': self.operating_system,
            'country': self.country,
            'city': self.city,
            'created_at': self.created_at.isoformat(),
            'last_activity': self.last_activity.isoformat(),
            'expires_at': self.expires_at.isoformat(),
            'is_active': self.is_active,
            'is_expired': self.is_expired,
            'is_valid': self.is_valid,
            'duration_seconds': int(self.duration.total_seconds()),
            'time_until_expiry_seconds': int(self.time_until_expiry.total_seconds()),
            'logout_reason': self.logout_reason
        }
        
        if include_sensitive:
            data.update({
                'ip_address': self.ip_address,
                'user_agent': self.user_agent,
                'is_suspicious': self.is_suspicious,
                'failed_attempts': self.failed_attempts,
                'session_data': self.session_data
            })
        
        return data
    
    @staticmethod
    def find_by_session_id(session_id):
        """Find session by session ID"""
        return UserSession.query.filter_by(session_id=session_id, is_active=True).first()
    
    @staticmethod
    def get_user_sessions(user_id, active_only=True):
        """Get all sessions for a user"""
        query = UserSession.query.filter_by(user_id=user_id)
        
        if active_only:
            query = query.filter_by(is_active=True)
        
        return query.order_by(UserSession.last_activity.desc()).all()
    
    @staticmethod
    def cleanup_expired_sessions():
        """Clean up expired sessions"""
        expired_sessions = UserSession.query.filter(
            UserSession.expires_at < datetime.utcnow(),
            UserSession.is_active == True
        ).all()
        
        for session in expired_sessions:
            session.invalidate(reason='expired')
        
        return len(expired_sessions)
    
    @staticmethod
    def force_logout_user(user_id, reason='forced'):
        """Force logout all sessions for a user"""
        sessions = UserSession.query.filter_by(
            user_id=user_id,
            is_active=True
        ).all()
        
        for session in sessions:
            session.invalidate(reason=reason)
        
        return len(sessions)
    
    @staticmethod
    def get_session_stats(user_id=None, days=30):
        """Get session statistics"""
        from datetime import date
        from sqlalchemy import func
        
        start_date = datetime.utcnow() - timedelta(days=days)
        query = UserSession.query.filter(UserSession.created_at >= start_date)
        
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        sessions = query.all()
        
        stats = {
            'total_sessions': len(sessions),
            'active_sessions': len([s for s in sessions if s.is_active]),
            'expired_sessions': len([s for s in sessions if s.is_expired]),
            'suspicious_sessions': len([s for s in sessions if s.is_suspicious]),
            'device_breakdown': {},
            'browser_breakdown': {},
            'os_breakdown': {},
            'average_duration_minutes': 0
        }
        
        if sessions:
            # Calculate breakdowns
            for session in sessions:
                # Device breakdown
                device = session.device_type or 'Unknown'
                stats['device_breakdown'][device] = stats['device_breakdown'].get(device, 0) + 1
                
                # Browser breakdown
                browser = session.browser or 'Unknown'
                stats['browser_breakdown'][browser] = stats['browser_breakdown'].get(browser, 0) + 1
                
                # OS breakdown
                os_name = session.operating_system or 'Unknown'
                stats['os_breakdown'][os_name] = stats['os_breakdown'].get(os_name, 0) + 1
            
            # Calculate average duration
            total_duration = sum(s.duration.total_seconds() for s in sessions)
            stats['average_duration_minutes'] = int(total_duration / len(sessions) / 60)
        
        return stats
    
    def __repr__(self):
        return f'<UserSession {self.session_id} for user {self.user_id}>'