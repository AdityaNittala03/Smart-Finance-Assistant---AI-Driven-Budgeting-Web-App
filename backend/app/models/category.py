from datetime import datetime
from .. import db

class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    color = db.Column(db.String(7), default='#3498db')  # Hex color code
    icon = db.Column(db.String(50), default='category')
    
    # Category type
    type = db.Column(db.Enum('income', 'expense', name='category_type'), nullable=False)
    
    # Parent category for subcategories
    parent_id = db.Column(db.Integer, db.ForeignKey('categories.id'))
    parent = db.relationship('Category', remote_side=[id], backref='subcategories')
    
    # User ownership (None for system categories)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Category status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_system = db.Column(db.Boolean, default=False, nullable=False)  # System vs user-created
    
    # ML training data
    keywords = db.Column(db.JSON, default=[])  # Keywords for ML categorization
    training_count = db.Column(db.Integer, default=0)  # Number of transactions used for training
    
    # Budget settings
    budget_default = db.Column(db.Numeric(10, 2), default=0.00)  # Default budget amount
    budget_period = db.Column(db.Enum('weekly', 'monthly', 'yearly', name='budget_period'), default='monthly')
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    transactions = db.relationship('Transaction', backref='category', lazy='dynamic')
    budgets = db.relationship('Budget', backref='category', lazy='dynamic')
    
    # Constraints
    __table_args__ = (
        db.UniqueConstraint('name', 'user_id', 'parent_id', name='unique_category_per_user'),
        db.Index('idx_category_user_type', 'user_id', 'type'),
        db.Index('idx_category_active', 'is_active'),
    )
    
    def __init__(self, name, type, user_id=None, **kwargs):
        self.name = name
        self.type = type
        self.user_id = user_id
        
        # Set optional fields
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    @property
    def full_name(self):
        """Return full category name including parent"""
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name
    
    @property
    def level(self):
        """Return category hierarchy level"""
        if self.parent:
            return self.parent.level + 1
        return 0
    
    @property
    def is_subcategory(self):
        """Check if this is a subcategory"""
        return self.parent_id is not None
    
    def get_all_subcategories(self):
        """Get all subcategories recursively"""
        subcats = list(self.subcategories)
        for subcat in self.subcategories:
            subcats.extend(subcat.get_all_subcategories())
        return subcats
    
    def get_transaction_count(self):
        """Get number of transactions in this category"""
        return self.transactions.count()
    
    def get_total_amount(self, start_date=None, end_date=None):
        """Get total amount spent in this category"""
        from .transaction import Transaction
        
        query = self.transactions
        
        if start_date:
            query = query.filter(Transaction.date >= start_date)
        if end_date:
            query = query.filter(Transaction.date <= end_date)
        
        return query.with_entities(db.func.sum(Transaction.amount)).scalar() or 0
    
    def add_keyword(self, keyword):
        """Add keyword for ML categorization"""
        if keyword.lower() not in [k.lower() for k in self.keywords]:
            self.keywords.append(keyword.lower())
            db.session.commit()
    
    def remove_keyword(self, keyword):
        """Remove keyword from ML categorization"""
        self.keywords = [k for k in self.keywords if k.lower() != keyword.lower()]
        db.session.commit()
    
    def to_dict(self, include_stats=False):
        """Convert category to dictionary"""
        data = {
            'id': self.id,
            'name': self.name,
            'full_name': self.full_name,
            'description': self.description,
            'color': self.color,
            'icon': self.icon,
            'type': self.type,
            'parent_id': self.parent_id,
            'user_id': self.user_id,
            'is_active': self.is_active,
            'is_system': self.is_system,
            'is_subcategory': self.is_subcategory,
            'level': self.level,
            'keywords': self.keywords,
            'budget_default': float(self.budget_default) if self.budget_default else 0.0,
            'budget_period': self.budget_period,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_stats:
            data.update({
                'transaction_count': self.get_transaction_count(),
                'total_amount': float(self.get_total_amount()),
                'subcategories_count': len(self.subcategories),
                'training_count': self.training_count
            })
        
        return data
    
    @staticmethod
    def get_system_categories():
        """Get all system-defined categories"""
        return Category.query.filter_by(is_system=True, is_active=True).all()
    
    @staticmethod
    def get_user_categories(user_id, category_type=None):
        """Get categories for a specific user"""
        query = Category.query.filter_by(user_id=user_id, is_active=True)
        if category_type:
            query = query.filter_by(type=category_type)
        return query.all()
    
    @staticmethod
    def get_available_categories(user_id, category_type=None):
        """Get all available categories for a user (system + user-created)"""
        query = Category.query.filter(
            db.or_(Category.user_id == user_id, Category.is_system == True),
            Category.is_active == True
        )
        if category_type:
            query = query.filter_by(type=category_type)
        return query.order_by(Category.name).all()
    
    @staticmethod
    def create_default_categories():
        """Create default system categories"""
        default_categories = [
            # Income categories
            {'name': 'Salary', 'type': 'income', 'icon': 'money', 'color': '#2ecc71'},
            {'name': 'Freelance', 'type': 'income', 'icon': 'briefcase', 'color': '#27ae60'},
            {'name': 'Investment', 'type': 'income', 'icon': 'trending-up', 'color': '#16a085'},
            {'name': 'Other Income', 'type': 'income', 'icon': 'plus', 'color': '#1abc9c'},
            
            # Expense categories
            {'name': 'Food & Dining', 'type': 'expense', 'icon': 'utensils', 'color': '#e74c3c'},
            {'name': 'Transportation', 'type': 'expense', 'icon': 'car', 'color': '#f39c12'},
            {'name': 'Shopping', 'type': 'expense', 'icon': 'shopping-bag', 'color': '#9b59b6'},
            {'name': 'Entertainment', 'type': 'expense', 'icon': 'music', 'color': '#8e44ad'},
            {'name': 'Bills & Utilities', 'type': 'expense', 'icon': 'file-text', 'color': '#34495e'},
            {'name': 'Healthcare', 'type': 'expense', 'icon': 'heart', 'color': '#e67e22'},
            {'name': 'Education', 'type': 'expense', 'icon': 'book', 'color': '#3498db'},
            {'name': 'Travel', 'type': 'expense', 'icon': 'plane', 'color': '#2980b9'},
            {'name': 'Home & Garden', 'type': 'expense', 'icon': 'home', 'color': '#95a5a6'},
            {'name': 'Personal Care', 'type': 'expense', 'icon': 'user', 'color': '#7f8c8d'},
            {'name': 'Gifts & Donations', 'type': 'expense', 'icon': 'gift', 'color': '#d35400'},
            {'name': 'Other Expenses', 'type': 'expense', 'icon': 'more-horizontal', 'color': '#bdc3c7'},
        ]
        
        for cat_data in default_categories:
            existing = Category.query.filter_by(
                name=cat_data['name'], 
                is_system=True
            ).first()
            
            if not existing:
                category = Category(
                    name=cat_data['name'],
                    type=cat_data['type'],
                    icon=cat_data['icon'],
                    color=cat_data['color'],
                    is_system=True,
                    user_id=None
                )
                db.session.add(category)
        
        db.session.commit()
    
    def __repr__(self):
        return f'<Category {self.full_name}>'