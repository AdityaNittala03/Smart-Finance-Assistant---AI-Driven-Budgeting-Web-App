from datetime import datetime, date
from decimal import Decimal
from .. import db

class Prediction(db.Model):
    __tablename__ = 'predictions'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Prediction basic info
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    
    # Prediction type and period
    prediction_type = db.Column(db.Enum(
        'spending_forecast',
        'budget_recommendation',
        'category_trend',
        'anomaly_detection',
        'goal_achievement',
        name='prediction_type'
    ), nullable=False)
    
    period_type = db.Column(db.Enum(
        'daily', 'weekly', 'monthly', 'quarterly', 'yearly',
        name='period_type'
    ), default='monthly')
    
    # Prediction timeframe
    prediction_date = db.Column(db.Date, nullable=False)  # Date this prediction is for
    valid_from = db.Column(db.Date, nullable=False)  # When prediction becomes valid
    valid_until = db.Column(db.Date, nullable=False)  # When prediction expires
    
    # Prediction values
    predicted_amount = db.Column(db.Numeric(10, 2))
    confidence_score = db.Column(db.Float, nullable=False)  # 0.0 to 1.0
    
    # Metadata
    model_version = db.Column(db.String(20), nullable=False)
    features_used = db.Column(db.JSON, default=[])  # List of features used for prediction
    
    # Prediction details
    prediction_data = db.Column(db.JSON, default={})  # Additional prediction data
    explanation = db.Column(db.Text)  # Human-readable explanation
    
    # Actual vs predicted (for accuracy tracking)
    actual_amount = db.Column(db.Numeric(10, 2))
    accuracy_score = db.Column(db.Float)  # Calculated after actual data is available
    is_validated = db.Column(db.Boolean, default=False)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Indexes
    __table_args__ = (
        db.Index('idx_prediction_user_type', 'user_id', 'prediction_type'),
        db.Index('idx_prediction_date', 'prediction_date'),
        db.Index('idx_prediction_period', 'valid_from', 'valid_until'),
        db.Index('idx_prediction_category', 'category_id'),
        db.Index('idx_prediction_active', 'is_active'),
    )
    
    def __init__(self, user_id, prediction_type, prediction_date, confidence_score, 
                 model_version, **kwargs):
        self.user_id = user_id
        self.prediction_type = prediction_type
        self.prediction_date = prediction_date
        self.confidence_score = confidence_score
        self.model_version = model_version
        
        # Set default valid dates if not provided
        if 'valid_from' not in kwargs:
            self.valid_from = date.today()
        if 'valid_until' not in kwargs:
            self.valid_until = self._calculate_default_expiry()
        
        # Set optional fields
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def _calculate_default_expiry(self):
        """Calculate default expiry date based on prediction type"""
        from datetime import timedelta
        
        if self.prediction_type in ['spending_forecast', 'category_trend']:
            return date.today() + timedelta(days=30)  # 1 month
        elif self.prediction_type == 'budget_recommendation':
            return date.today() + timedelta(days=90)  # 3 months
        elif self.prediction_type == 'anomaly_detection':
            return date.today() + timedelta(days=7)   # 1 week
        elif self.prediction_type == 'goal_achievement':
            return date.today() + timedelta(days=365) # 1 year
        
        return date.today() + timedelta(days=30)  # Default 1 month
    
    @property
    def is_current(self):
        """Check if prediction is currently valid"""
        today = date.today()
        return self.valid_from <= today <= self.valid_until and self.is_active
    
    @property
    def is_expired(self):
        """Check if prediction has expired"""
        return date.today() > self.valid_until
    
    @property
    def days_until_expiry(self):
        """Get days until prediction expires"""
        if self.is_expired:
            return 0
        return (self.valid_until - date.today()).days
    
    @property
    def accuracy_percentage(self):
        """Get accuracy as percentage"""
        if self.accuracy_score is None:
            return None
        return self.accuracy_score * 100
    
    @property
    def confidence_percentage(self):
        """Get confidence as percentage"""
        return self.confidence_score * 100
    
    def validate_prediction(self, actual_amount):
        """Validate prediction against actual amount"""
        self.actual_amount = Decimal(str(actual_amount))
        
        if self.predicted_amount and self.predicted_amount != 0:
            # Calculate accuracy as inverse of percentage error
            error = abs(float(self.predicted_amount) - float(actual_amount))
            percentage_error = error / float(self.predicted_amount)
            self.accuracy_score = max(0, 1 - percentage_error)
        else:
            self.accuracy_score = 0.0
        
        self.is_validated = True
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def update_prediction(self, new_amount=None, new_confidence=None, new_data=None):
        """Update prediction with new values"""
        if new_amount is not None:
            self.predicted_amount = Decimal(str(new_amount))
        if new_confidence is not None:
            self.confidence_score = new_confidence
        if new_data is not None:
            self.prediction_data.update(new_data)
        
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def deactivate(self):
        """Deactivate prediction"""
        self.is_active = False
        db.session.commit()
    
    def to_dict(self, include_validation=False):
        """Convert prediction to dictionary"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'prediction_type': self.prediction_type,
            'period_type': self.period_type,
            'prediction_date': self.prediction_date.isoformat(),
            'valid_from': self.valid_from.isoformat(),
            'valid_until': self.valid_until.isoformat(),
            'predicted_amount': float(self.predicted_amount) if self.predicted_amount else None,
            'confidence_score': self.confidence_score,
            'confidence_percentage': self.confidence_percentage,
            'model_version': self.model_version,
            'features_used': self.features_used,
            'prediction_data': self.prediction_data,
            'explanation': self.explanation,
            'is_current': self.is_current,
            'is_expired': self.is_expired,
            'days_until_expiry': self.days_until_expiry,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_validation:
            data.update({
                'actual_amount': float(self.actual_amount) if self.actual_amount else None,
                'accuracy_score': self.accuracy_score,
                'accuracy_percentage': self.accuracy_percentage,
                'is_validated': self.is_validated
            })
        
        return data
    
    @staticmethod
    def get_user_predictions(user_id, prediction_type=None, active_only=True, current_only=False):
        """Get predictions for a user"""
        query = Prediction.query.filter_by(user_id=user_id)
        
        if prediction_type:
            query = query.filter_by(prediction_type=prediction_type)
        
        if active_only:
            query = query.filter_by(is_active=True)
        
        if current_only:
            today = date.today()
            query = query.filter(
                Prediction.valid_from <= today,
                Prediction.valid_until >= today
            )
        
        return query.order_by(Prediction.prediction_date.desc()).all()
    
    @staticmethod
    def get_spending_forecast(user_id, category_id=None, period_type='monthly'):
        """Get current spending forecast"""
        query = Prediction.query.filter(
            Prediction.user_id == user_id,
            Prediction.prediction_type == 'spending_forecast',
            Prediction.period_type == period_type,
            Prediction.is_active == True
        )
        
        if category_id:
            query = query.filter_by(category_id=category_id)
        
        today = date.today()
        query = query.filter(
            Prediction.valid_from <= today,
            Prediction.valid_until >= today
        )
        
        return query.order_by(Prediction.confidence_score.desc()).first()
    
    @staticmethod
    def get_budget_recommendations(user_id):
        """Get current budget recommendations"""
        today = date.today()
        return Prediction.query.filter(
            Prediction.user_id == user_id,
            Prediction.prediction_type == 'budget_recommendation',
            Prediction.is_active == True,
            Prediction.valid_from <= today,
            Prediction.valid_until >= today
        ).order_by(Prediction.confidence_score.desc()).all()
    
    @staticmethod
    def get_anomaly_alerts(user_id):
        """Get current anomaly detection alerts"""
        today = date.today()
        return Prediction.query.filter(
            Prediction.user_id == user_id,
            Prediction.prediction_type == 'anomaly_detection',
            Prediction.is_active == True,
            Prediction.valid_from <= today,
            Prediction.valid_until >= today
        ).order_by(Prediction.created_at.desc()).all()
    
    @staticmethod
    def calculate_model_accuracy(model_version, prediction_type=None):
        """Calculate overall accuracy for a model version"""
        query = Prediction.query.filter(
            Prediction.model_version == model_version,
            Prediction.is_validated == True,
            Prediction.accuracy_score.isnot(None)
        )
        
        if prediction_type:
            query = query.filter_by(prediction_type=prediction_type)
        
        accuracies = [p.accuracy_score for p in query.all()]
        
        if not accuracies:
            return None
        
        return sum(accuracies) / len(accuracies)
    
    @staticmethod
    def cleanup_expired_predictions(days_old=30):
        """Clean up old expired predictions"""
        from datetime import timedelta
        
        cutoff_date = date.today() - timedelta(days=days_old)
        
        expired_predictions = Prediction.query.filter(
            Prediction.valid_until < cutoff_date,
            Prediction.is_active == True
        ).all()
        
        for prediction in expired_predictions:
            prediction.deactivate()
        
        return len(expired_predictions)
    
    def __repr__(self):
        return f'<Prediction {self.prediction_type}: {self.predicted_amount} (confidence: {self.confidence_percentage:.1f}%)>'