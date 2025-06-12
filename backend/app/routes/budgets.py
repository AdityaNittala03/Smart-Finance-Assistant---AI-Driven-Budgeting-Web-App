from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from .. import db
from ..models.budget import Budget
from ..utils.decorators import handle_errors

budgets_bp = Blueprint('budgets', __name__)

@budgets_bp.route('', methods=['GET'])
@jwt_required()
@handle_errors
def get_budgets():
    """Get user budgets"""
    user_id = get_jwt_identity()
    active_only = request.args.get('active_only', 'true').lower() == 'true'
    current_only = request.args.get('current_only', 'false').lower() == 'true'
    
    budgets = Budget.get_user_budgets(user_id, active_only, current_only)
    
    return jsonify({
        'budgets': [budget.to_dict() for budget in budgets]
    }), 200

@budgets_bp.route('', methods=['POST'])
@jwt_required()
@handle_errors
def create_budget():
    """Create new budget"""
    # Implementation placeholder
    return jsonify({'message': 'Create budget endpoint - Coming soon'}), 200