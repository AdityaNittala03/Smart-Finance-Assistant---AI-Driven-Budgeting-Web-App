from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date

from .. import db, limiter
from ..models.transaction import Transaction
from ..models.category import Category
from ..utils.decorators import handle_errors, validate_json
from ..utils.validators import validate_amount, validate_date_string, validate_transaction_type

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('', methods=['GET'])
@jwt_required()
@handle_errors
def get_transactions():
    """Get user transactions with filtering and pagination"""
    user_id = get_jwt_identity()
    
    # Get query parameters
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 20)), 100)
    category_id = request.args.get('category_id')
    transaction_type = request.args.get('type')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    search = request.args.get('search')
    
    # Build filters
    filters = {}
    if category_id:
        filters['category_id'] = category_id
    if transaction_type:
        filters['type'] = transaction_type
    if start_date:
        filters['start_date'] = datetime.strptime(start_date, '%Y-%m-%d').date()
    if end_date:
        filters['end_date'] = datetime.strptime(end_date, '%Y-%m-%d').date()
    if search:
        filters['search'] = search
    
    # Get transactions
    offset = (page - 1) * per_page
    transactions = Transaction.get_user_transactions(
        user_id, 
        limit=per_page, 
        offset=offset, 
        filters=filters
    )
    
    # Get total count for pagination
    total_query = Transaction.query.filter_by(user_id=user_id, is_deleted=False)
    if filters:
        # Apply same filters for count
        if filters.get('category_id'):
            total_query = total_query.filter_by(category_id=filters['category_id'])
        if filters.get('type'):
            total_query = total_query.filter_by(type=filters['type'])
        if filters.get('start_date'):
            total_query = total_query.filter(Transaction.date >= filters['start_date'])
        if filters.get('end_date'):
            total_query = total_query.filter(Transaction.date <= filters['end_date'])
        if filters.get('search'):
            search_term = f"%{filters['search']}%"
            total_query = total_query.filter(
                db.or_(
                    Transaction.description.ilike(search_term),
                    Transaction.merchant.ilike(search_term)
                )
            )
    
    total = total_query.count()
    
    return jsonify({
        'transactions': [t.to_dict() for t in transactions],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'pages': (total + per_page - 1) // per_page
        }
    }), 200

@transactions_bp.route('', methods=['POST'])
@jwt_required()
@validate_json(required_fields=['amount', 'description', 'date', 'type'])
@handle_errors
def create_transaction():
    """Create a new transaction"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate data
    if not validate_amount(data['amount']):
        return jsonify({'error': 'Invalid amount'}), 400
    
    if not validate_date_string(data['date']):
        return jsonify({'error': 'Invalid date format (YYYY-MM-DD)'}), 400
    
    if not validate_transaction_type(data['type']):
        return jsonify({'error': 'Invalid transaction type'}), 400
    
    try:
        # Create transaction
        transaction = Transaction(
            amount=data['amount'],
            description=data['description'],
            date=data['date'],
            type=data['type'],
            user_id=user_id,
            category_id=data.get('category_id'),
            merchant=data.get('merchant'),
            location=data.get('location'),
            notes=data.get('notes'),
            tags=data.get('tags', []),
            account_name=data.get('account_name', 'Default Account')
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        # Auto-categorize if enabled and no category provided
        if not transaction.category_id:
            from ..services.ml_service import ml_service
            ml_service.auto_categorize_transaction(transaction)
        
        return jsonify({
            'message': 'Transaction created successfully',
            'transaction': transaction.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Transaction creation error: {str(e)}")
        return jsonify({'error': 'Transaction creation failed'}), 500

# Placeholder for other transaction routes
@transactions_bp.route('/<int:transaction_id>', methods=['GET'])
@jwt_required()
@handle_errors
def get_transaction(transaction_id):
    """Get specific transaction"""
    # Implementation placeholder
    return jsonify({'message': 'Get transaction endpoint - Coming soon'}), 200

@transactions_bp.route('/<int:transaction_id>', methods=['PUT'])
@jwt_required()
@handle_errors
def update_transaction(transaction_id):
    """Update transaction"""
    # Implementation placeholder
    return jsonify({'message': 'Update transaction endpoint - Coming soon'}), 200

@transactions_bp.route('/<int:transaction_id>', methods=['DELETE'])
@jwt_required()
@handle_errors
def delete_transaction(transaction_id):
    """Delete transaction"""
    # Implementation placeholder
    return jsonify({'message': 'Delete transaction endpoint - Coming soon'}), 200