from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from .. import db
from ..models.category import Category
from ..utils.decorators import handle_errors

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('', methods=['GET'])
@jwt_required()
@handle_errors
def get_categories():
    """Get user categories"""
    user_id = get_jwt_identity()
    category_type = request.args.get('type')  # income or expense
    
    categories = Category.get_available_categories(user_id, category_type)
    
    return jsonify({
        'categories': [cat.to_dict() for cat in categories]
    }), 200

@categories_bp.route('', methods=['POST'])
@jwt_required()
@handle_errors
def create_category():
    """Create custom category"""
    # Implementation placeholder
    return jsonify({'message': 'Create category endpoint - Coming soon'}), 200

@categories_bp.route('/<int:category_id>', methods=['PUT'])
@jwt_required()
@handle_errors
def update_category(category_id):
    """Update category"""
    # Implementation placeholder
    return jsonify({'message': 'Update category endpoint - Coming soon'}), 200