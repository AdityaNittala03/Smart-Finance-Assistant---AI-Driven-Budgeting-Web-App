from datetime import datetime
from decimal import Decimal
from .. import db

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Basic transaction info
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    date = db.Column(db.Date, nullable=False, index=True)
    
    # Transaction type
    type = db.Column(db.Enum('income', 'expense', name='transaction_type'), nullable=False)
    
    # Categorization
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    subcategory_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    
    # User and account info
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    account_name = db.Column(db.String(100), default='Default Account')
    
    # Additional transaction details
    merchant = db.Column(db.String(100))
    location = db.Column(db.String(200))
    reference_number = db.Column(db.String(50))
    notes = db.Column(db.Text)
    tags = db.Column(db.JSON, default=[])
    
    # ML categorization info
    ml_category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    ml_confidence = db.Column(db.Float, default=0.0)
    is_ml_categorized = db.Column(db.Boolean, default=False)
    user_verified = db.Column(db.Boolean, default=False)
    
    # Import and sync info
    import_id = db.Column(db.String(100))  # ID from CSV import or bank sync
    source = db.Column(db.Enum('manual', 'csv_import', 'bank_sync', 'api', name='transaction_source'), default='manual')
    external_id = db.Column(db.String(100))  # External system ID
    
    # Status and flags
    is_recurring = db.Column(db.Boolean, default=False)
    is_pending = db.Column(db.Boolean, default=False)
    is_deleted = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    ml_category = db.relationship('Category', foreign_keys=[ml_category_id])
    subcategory = db.relationship('Category', foreign_keys=[subcategory_id])
    
    # Indexes
    __table_args__ = (
        db.Index('idx_transaction_user_date', 'user_id', 'date'),
        db.Index('idx_transaction_category', 'category_id'),
        db.Index('idx_transaction_type', 'type'),
        db.Index('idx_transaction_amount', 'amount'),
        db.Index('idx_transaction_source', 'source'),
        db.UniqueConstraint('user_id', 'external_id', 'source', name='unique_external_transaction'),
    )
    
    def __init__(self, amount, description, date, type, user_id, **kwargs):
        self.amount = Decimal(str(amount))
        self.description = description
        self.date = date if isinstance(date, datetime) else datetime.strptime(date, '%Y-%m-%d').date()
        self.type = type
        self.user_id = user_id
        
        # Set optional fields
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    @property
    def signed_amount(self):
        """Return amount with appropriate sign (negative for expenses)"""
        if self.type == 'expense':
            return -abs(self.amount)
        return abs(self.amount)
    
    @property
    def category_name(self):
        """Get category name"""
        if self.category:
            return self.category.name
        return 'Uncategorized'
    
    @property
    def subcategory_name(self):
        """Get subcategory name"""
        if self.subcategory:
            return self.subcategory.name
        return None
    
    @property
    def full_category_name(self):
        """Get full category path"""
        if self.subcategory:
            return f"{self.category_name} > {self.subcategory_name}"
        return self.category_name
    
    @property
    def needs_categorization(self):
        """Check if transaction needs categorization"""
        return self.category_id is None
    
    @property
    def ml_suggestion_available(self):
        """Check if ML suggestion is available"""
        return self.ml_category_id is not None and self.ml_confidence > 0
    
    def add_tag(self, tag):
        """Add a tag to the transaction"""
        if tag not in self.tags:
            self.tags.append(tag)
            db.session.commit()
    
    def remove_tag(self, tag):
        """Remove a tag from the transaction"""
        if tag in self.tags:
            self.tags.remove(tag)
            db.session.commit()
    
    def set_category(self, category_id, subcategory_id=None, user_verified=True):
        """Set transaction category"""
        self.category_id = category_id
        self.subcategory_id = subcategory_id
        self.user_verified = user_verified
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def set_ml_prediction(self, category_id, confidence):
        """Set ML prediction for categorization"""
        self.ml_category_id = category_id
        self.ml_confidence = confidence
        self.is_ml_categorized = True
        db.session.commit()
    
    def accept_ml_suggestion(self):
        """Accept ML categorization suggestion"""
        if self.ml_category_id:
            self.category_id = self.ml_category_id
            self.user_verified = True
            db.session.commit()
    
    def reject_ml_suggestion(self):
        """Reject ML categorization suggestion"""
        self.ml_category_id = None
        self.ml_confidence = 0.0
        self.is_ml_categorized = False
        db.session.commit()
    
    def mark_as_duplicate(self):
        """Mark transaction as duplicate"""
        self.is_deleted = True
        self.notes = (self.notes or '') + ' [DUPLICATE]'
        db.session.commit()
    
    def soft_delete(self):
        """Soft delete transaction"""
        self.is_deleted = True
        db.session.commit()
    
    def restore(self):
        """Restore soft deleted transaction"""
        self.is_deleted = False
        db.session.commit()
    
    def to_dict(self, include_ml=False):
        """Convert transaction to dictionary"""
        data = {
            'id': self.id,
            'amount': float(self.amount),
            'signed_amount': float(self.signed_amount),
            'description': self.description,
            'date': self.date.isoformat(),
            'type': self.type,
            'category_id': self.category_id,
            'category_name': self.category_name,
            'subcategory_id': self.subcategory_id,
            'subcategory_name': self.subcategory_name,
            'full_category_name': self.full_category_name,
            'account_name': self.account_name,
            'merchant': self.merchant,
            'location': self.location,
            'reference_number': self.reference_number,
            'notes': self.notes,
            'tags': self.tags,
            'source': self.source,
            'is_recurring': self.is_recurring,
            'is_pending': self.is_pending,
            'needs_categorization': self.needs_categorization,
            'user_verified': self.user_verified,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_ml:
            data.update({
                'ml_category_id': self.ml_category_id,
                'ml_confidence': self.ml_confidence,
                'is_ml_categorized': self.is_ml_categorized,
                'ml_suggestion_available': self.ml_suggestion_available
            })
        
        return data
    
    @staticmethod
    def get_user_transactions(user_id, limit=None, offset=None, filters=None):
        """Get transactions for a user with optional filters"""
        query = Transaction.query.filter_by(user_id=user_id, is_deleted=False)
        
        if filters:
            # Date range filter
            if filters.get('start_date'):
                query = query.filter(Transaction.date >= filters['start_date'])
            if filters.get('end_date'):
                query = query.filter(Transaction.date <= filters['end_date'])
            
            # Category filter
            if filters.get('category_id'):
                query = query.filter(Transaction.category_id == filters['category_id'])
            
            # Type filter
            if filters.get('type'):
                query = query.filter(Transaction.type == filters['type'])
            
            # Amount range filter
            if filters.get('min_amount'):
                query = query.filter(Transaction.amount >= filters['min_amount'])
            if filters.get('max_amount'):
                query = query.filter(Transaction.amount <= filters['max_amount'])
            
            # Search filter
            if filters.get('search'):
                search_term = f"%{filters['search']}%"
                query = query.filter(
                    db.or_(
                        Transaction.description.ilike(search_term),
                        Transaction.merchant.ilike(search_term),
                        Transaction.notes.ilike(search_term)
                    )
                )
        
        # Order by date descending
        query = query.order_by(Transaction.date.desc(), Transaction.created_at.desc())
        
        if limit:
            query = query.limit(limit)
        if offset:
            query = query.offset(offset)
        
        return query.all()
    
    @staticmethod
    def get_monthly_summary(user_id, year, month):
        """Get monthly transaction summary"""
        from sqlalchemy import extract, func
        
        query = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.is_deleted == False,
            extract('year', Transaction.date) == year,
            extract('month', Transaction.date) == month
        )
        
        income = query.filter(Transaction.type == 'income').with_entities(
            func.sum(Transaction.amount)
        ).scalar() or 0
        
        expenses = query.filter(Transaction.type == 'expense').with_entities(
            func.sum(Transaction.amount)
        ).scalar() or 0
        
        return {
            'income': float(income),
            'expenses': float(expenses),
            'net': float(income - expenses),
            'transaction_count': query.count()
        }
    
    @staticmethod
    def find_potential_duplicates(user_id, transaction_data, days_window=3):
        """Find potential duplicate transactions"""
        from datetime import timedelta
        
        target_date = transaction_data['date']
        amount = transaction_data['amount']
        description = transaction_data['description']
        
        start_date = target_date - timedelta(days=days_window)
        end_date = target_date + timedelta(days=days_window)
        
        return Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.is_deleted == False,
            Transaction.date.between(start_date, end_date),
            Transaction.amount == amount,
            Transaction.description.ilike(f"%{description}%")
        ).all()
    
    def __repr__(self):
        return f'<Transaction {self.id}: {self.description} - ${self.amount}>'