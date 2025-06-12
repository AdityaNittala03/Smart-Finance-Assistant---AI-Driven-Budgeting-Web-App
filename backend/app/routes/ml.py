from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from .. import db
from ..models.prediction import Prediction
from ..utils.decorators import handle_errors

ml_bp = Blueprint('ml', __name__)

@ml_bp.route('/categorize', methods=['POST'])
@jwt_required()
@handle_errors
def categorize_transaction():
    """Auto-categorize transaction using ML"""
    # Implementation placeholder
    return jsonify({'message': 'ML categorization endpoint - Coming soon'}), 200

@ml_bp.route('/predictions', methods=['GET'])
@jwt_required()
@handle_errors
def get_predictions():
    """Get ML predictions for user"""
    user_id = get_jwt_identity()
    prediction_type = request.args.get('type')
    
    predictions = Prediction.get_user_predictions(user_id, prediction_type, current_only=True)
    
    return jsonify({
        'predictions': [pred.to_dict() for pred in predictions]
    }), 200