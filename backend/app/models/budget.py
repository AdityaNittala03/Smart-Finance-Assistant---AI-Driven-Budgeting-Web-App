from datetime import datetime, date
from decimal import Decimal
from .. import db

class Budget(db.Model):
    __tablename__ = 'budgets'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Budget basic info
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    
    # Budget period
    period = db.Column(db.Enum('weekly', 'monthly', 'quarterly', 'yearly', name='budget_period'), default='monthly', nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    
    # Category association
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    include_subcategories = db.Column(db.Boolean, default=True)
    
    # User ownership
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Budget status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    auto_renew = db.Column(db.Boolean, default=True, nullable=False)
    
    # Alert settings
    alert_threshold_1 = db.Column(db.Float, default=0.8)  # 80% threshold
    alert_threshold_2 = db.Column(db.Float, default=1.0)  # 100% threshold
    alert_enabled = db.Column(db.Boolean, default=True)
    
    # Rollover settings
    allow_rollover = db.Column(db.Boolean, default=False)
    rollover_percentage = db.Column(db.Float, default=0.0)  # Percentage of unused budget to rollover
    
    # ML recommendations
    is_ml_recommended = db.Column(db.Boolean, default=False)
    ml_confidence = db.Column(db.Float, default=0.0)
    recommendation_reason = db.Column(db.Text)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Indexes
    __table_args__ = (
        db.Index('idx_budget_user_period', 'user_id', 'period'),
        db.Index('idx_budget_category', 'category_id'),
        db.Index('idx_budget_active', 'is_active'),
        db.Index('idx_budget_dates', 'start_date', 'end_date'),
        db.UniqueConstraint('user_id', 'category_id', 'start_date', 'end_date', name='unique_budget_period'),
    )
    
    def __init__(self, name, amount, period, category_id, user_id, **kwargs):
        self.name = name
        self.amount = Decimal(str(amount))
        self.period = period
        self.category_id = category_id
        self.user_id = user_id
        
        # Auto-set dates based on period if not provided
        if 'start_date' not in kwargs:
            self.start_date = self._calculate_period_start()
        if 'end_date' not in kwargs:
            self.end_date = self._calculate_period_end(kwargs.get('start_date', self.start_date))
        
        # Set optional fields
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def _calculate_period_start(self):
        """Calculate period start date based on current date and period type"""
        today = date.today()
        
        if self.period == 'weekly':
            # Start of current week (Monday)
            days_since_monday = today.weekday()
            return today - timedelta(days=days_since_monday)
        elif self.period == 'monthly':
            # Start of current month
            return today.replace(day=1)
        elif self.period == 'quarterly':
            # Start of current quarter
            quarter = (today.month - 1) // 3
            return today.replace(month=quarter * 3 + 1, day=1)
        elif self.period == 'yearly':
            # Start of current year
            return today.replace(month=1, day=1)
        
        return today
    
    def _calculate_period_end(self, start_date):
        """Calculate period end date based on start date and period type"""
        from datetime import timedelta
        from calendar import monthrange
        
        if self.period == 'weekly':
            return start_date + timedelta(days=6)
        elif self.period == 'monthly':
            # Last day of the month
            _, last_day = monthrange(start_date.year, start_date.month)
            return start_date.replace(day=last_day)
        elif self.period == 'quarterly':
            # End of quarter (3 months)
            if start_date.month in [1, 4, 7, 10]:
                end_month = start_date.month + 2
                end_year = start_date.year
            else:
                end_month = (start_date.month + 2) % 12
                end_year = start_date.year + (1 if end_month < start_date.month else 0)
            
            _, last_day = monthrange(end_year, end_month)
            return date(end_year, end_month, last_day)
        elif self.period == 'yearly':
            return start_date.replace(month=12, day=31)
        
        return start_date
    
    @property
    def is_current(self):
        """Check if budget is current (active period)"""
        today = date.today()
        return self.start_date <= today <= self.end_date and self.is_active
    
    @property
    def is_expired(self):
        """Check if budget period has expired"""
        return date.today() > self.end_date
    
    @property
    def days_remaining(self):
        """Get number of days remaining in budget period"""
        if self.is_expired:
            return 0
        return (self.end_date - date.today()).days
    
    @property
    def progress_percentage(self):
        """Get budget period progress percentage"""
        total_days = (self.end_date - self.start_date).days + 1
        elapsed_days = (date.today() - self.start_date).days + 1
        return min(100, max(0, (elapsed_days / total_days) * 100))
    
    def get_spent_amount(self):
        """Get total amount spent in this budget category during the period"""
        from .transaction import Transaction
        
        query = Transaction.query.filter(
            Transaction.user_id == self.user_id,
            Transaction.category_id == self.category_id,
            Transaction.type == 'expense',
            Transaction.is_deleted == False,
            Transaction.date >= self.start_date,
            Transaction.date <= self.end_date
        )
        
        # Include subcategories if specified
        if self.include_subcategories and self.category.subcategories:
            subcategory_ids = [sub.id for sub in self.category.subcategories]
            query = query.filter(
                db.or_(
                    Transaction.category_id == self.category_id,
                    Transaction.category_id.in_(subcategory_ids)
                )
            )
        
        return query.with_entities(db.func.sum(Transaction.amount)).scalar() or Decimal('0.00')
    
    @property
    def spent_amount(self):
        """Get spent amount as property"""
        return self.get_spent_amount()
    
    @property
    def remaining_amount(self):
        """Get remaining budget amount"""
        return self.amount - self.spent_amount
    
    @property
    def spent_percentage(self):
        """Get percentage of budget spent"""
        if self.amount == 0:
            return 0
        return min(100, (float(self.spent_amount) / float(self.amount)) * 100)
    
    @property
    def is_over_budget(self):
        """Check if budget is exceeded"""
        return self.spent_amount > self.amount
    
    @property
    def alert_status(self):
        """Get current alert status"""
        spent_pct = self.spent_percentage
        
        if spent_pct >= (self.alert_threshold_2 * 100):
            return 'exceeded'
        elif spent_pct >= (self.alert_threshold_1 * 100):
            return 'warning'
        else:
            return 'good'
    
    @property
    def projected_spending(self):
        """Project spending for the entire period based on current rate"""
        if self.progress_percentage == 0:
            return Decimal('0.00')
        
        daily_rate = float(self.spent_amount) / max(1, (date.today() - self.start_date).days + 1)
        total_days = (self.end_date - self.start_date).days + 1
        return Decimal(str(daily_rate * total_days))
    
    def renew_budget(self):
        """Create a new budget for the next period"""
        from datetime import timedelta
        
        if not self.auto_renew:
            return None
        
        # Calculate new period dates
        if self.period == 'weekly':
            new_start = self.end_date + timedelta(days=1)
            new_end = new_start + timedelta(days=6)
        elif self.period == 'monthly':
            if self.end_date.month == 12:
                new_start = self.end_date.replace(year=self.end_date.year + 1, month=1, day=1)
            else:
                new_start = self.end_date.replace(month=self.end_date.month + 1, day=1)
            new_end = self._calculate_period_end(new_start)
        elif self.period == 'quarterly':
            new_start = self.end_date + timedelta(days=1)
            new_end = self._calculate_period_end(new_start)
        elif self.period == 'yearly':
            new_start = self.end_date.replace(year=self.end_date.year + 1, month=1, day=1)
            new_end = new_start.replace(month=12, day=31)
        
        # Calculate rollover amount
        rollover_amount = Decimal('0.00')
        if self.allow_rollover and self.remaining_amount > 0:
            rollover_amount = self.remaining_amount * Decimal(str(self.rollover_percentage))
        
        # Create new budget
        new_budget = Budget(
            name=self.name,
            amount=self.amount + rollover_amount,
            period=self.period,
            category_id=self.category_id,
            user_id=self.user_id,
            start_date=new_start,
            end_date=new_end,
            description=self.description,
            include_subcategories=self.include_subcategories,
            alert_threshold_1=self.alert_threshold_1,
            alert_threshold_2=self.alert_threshold_2,
            alert_enabled=self.alert_enabled,
            allow_rollover=self.allow_rollover,
            rollover_percentage=self.rollover_percentage,
            auto_renew=self.auto_renew
        )
        
        db.session.add(new_budget)
        db.session.commit()
        
        return new_budget
    
    def to_dict(self, include_stats=True):
        """Convert budget to dictionary"""
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'amount': float(self.amount),
            'period': self.period,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'include_subcategories': self.include_subcategories,
            'is_active': self.is_active,
            'auto_renew': self.auto_renew,
            'alert_threshold_1': self.alert_threshold_1,
            'alert_threshold_2': self.alert_threshold_2,
            'alert_enabled': self.alert_enabled,
            'allow_rollover': self.allow_rollover,
            'rollover_percentage': self.rollover_percentage,
            'is_ml_recommended': self.is_ml_recommended,
            'ml_confidence': self.ml_confidence,
            'recommendation_reason': self.recommendation_reason,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_stats:
            data.update({
                'spent_amount': float(self.spent_amount),
                'remaining_amount': float(self.remaining_amount),
                'spent_percentage': self.spent_percentage,
                'progress_percentage': self.progress_percentage,
                'days_remaining': self.days_remaining,
                'is_current': self.is_current,
                'is_expired': self.is_expired,
                'is_over_budget': self.is_over_budget,
                'alert_status': self.alert_status,
                'projected_spending': float(self.projected_spending)
            })
        
        return data
    
    @staticmethod
    def get_user_budgets(user_id, active_only=True, current_only=False):
        """Get budgets for a user"""
        query = Budget.query.filter_by(user_id=user_id)
        
        if active_only:
            query = query.filter_by(is_active=True)
        
        if current_only:
            today = date.today()
            query = query.filter(
                Budget.start_date <= today,
                Budget.end_date >= today
            )
        
        return query.order_by(Budget.start_date.desc()).all()
    
    @staticmethod
    def get_budgets_needing_renewal(user_id=None):
        """Get budgets that need renewal"""
        today = date.today()
        query = Budget.query.filter(
            Budget.end_date < today,
            Budget.auto_renew == True,
            Budget.is_active == True
        )
        
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        return query.all()
    
    @staticmethod
    def get_alert_budgets(user_id):
        """Get budgets that need alerts"""
        current_budgets = Budget.get_user_budgets(user_id, current_only=True)
        alert_budgets = []
        
        for budget in current_budgets:
            if budget.alert_enabled and budget.alert_status in ['warning', 'exceeded']:
                alert_budgets.append(budget)
        
        return alert_budgets
    
    def __repr__(self):
        return f'<Budget {self.name}: ${self.amount} ({self.period})>'