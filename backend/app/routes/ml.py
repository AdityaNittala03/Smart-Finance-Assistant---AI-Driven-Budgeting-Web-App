from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from .. import db
from ..models.prediction import Prediction
from ..models.transaction import Transaction
from ..services.ml_service import ml_service
from ..utils.decorators import handle_errors, validate_json

ml_bp = Blueprint('ml', __name__)

@ml_bp.route('/categorize', methods=['POST'])
@jwt_required()
@validate_json(required_fields=['description'])
@handle_errors
def categorize_transaction():
    """Auto-categorize transaction using ML"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    description = data['description']
    amount = data.get('amount', 0)
    
    # Get category suggestions
    suggestions = ml_service.get_category_suggestions(description, top_k=5)
    
    return jsonify({
        'suggestions': suggestions,
        'description': description,
        'amount': amount
    }), 200

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

@ml_bp.route('/spending-forecast', methods=['POST'])
@jwt_required()
@handle_errors
def generate_spending_forecast():
    """Generate future spending predictions"""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    periods_ahead = data.get('periods_ahead', 4)
    period = data.get('period', 'week')
    
    # Generate predictions
    forecast = ml_service.predict_future_spending(user_id, periods_ahead, period)
    
    if forecast:
        return jsonify({
            'forecast': forecast,
            'user_id': user_id
        }), 200
    else:
        return jsonify({
            'error': 'Could not generate spending forecast',
            'reason': 'Insufficient data or model not available'
        }), 400

@ml_bp.route('/budget-recommendations', methods=['POST'])
@jwt_required()
@handle_errors
def generate_budget_recommendations():
    """Generate personalized budget recommendations"""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    target_budget = data.get('target_budget')
    budget_style = data.get('budget_style', 'balanced')
    
    # Generate recommendations
    recommendations = ml_service.generate_budget_recommendations(
        user_id, target_budget, budget_style
    )
    
    if recommendations:
        return jsonify({
            'recommendations': recommendations,
            'user_id': user_id
        }), 200
    else:
        return jsonify({
            'error': 'Could not generate budget recommendations',
            'reason': 'Insufficient data or model not available'
        }), 400

@ml_bp.route('/anomalies', methods=['GET'])
@jwt_required()
@handle_errors
def detect_spending_anomalies():
    """Detect spending anomalies for user"""
    user_id = get_jwt_identity()
    
    period = request.args.get('period', 'week')
    threshold = float(request.args.get('threshold', 2.0))
    
    # Detect anomalies
    anomalies = ml_service.detect_spending_anomalies(user_id, period, threshold)
    
    return jsonify({
        'anomalies': anomalies,
        'user_id': user_id,
        'detection_params': {
            'period': period,
            'threshold': threshold
        }
    }), 200

@ml_bp.route('/train', methods=['POST'])
@jwt_required()
@handle_errors
def train_models():
    """Train ML models (admin only for now)"""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    force_retrain = data.get('force_retrain', False)
    
    # Train models
    training_results = ml_service.train_all_models(force_retrain)
    
    return jsonify({
        'training_results': training_results,
        'initiated_by': user_id
    }), 200

@ml_bp.route('/evaluate', methods=['POST'])
@jwt_required()
@handle_errors
def evaluate_models():
    """Evaluate ML model performance"""
    user_id = get_jwt_identity()
    
    # Evaluate models
    evaluation_results = ml_service.evaluate_models()
    
    return jsonify({
        'evaluation_results': evaluation_results,
        'evaluated_by': user_id
    }), 200

@ml_bp.route('/status', methods=['GET'])
@jwt_required()
@handle_errors
def get_model_status():
    """Get ML model status and performance"""
    
    status = ml_service.get_model_status()
    
    return jsonify({
        'status': status
    }), 200

@ml_bp.route('/feedback', methods=['POST'])
@jwt_required()
@validate_json(required_fields=['transaction_id', 'correct_category_id'])
@handle_errors
def provide_feedback():
    """Provide feedback on ML categorization"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    transaction_id = data['transaction_id']
    correct_category_id = data['correct_category_id']
    
    # Get transaction
    transaction = Transaction.query.filter_by(
        id=transaction_id, user_id=user_id
    ).first()
    
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    
    # Update transaction with correct category
    transaction.set_category(correct_category_id, user_verified=True)
    
    # Log feedback for model improvement
    current_app.logger.info(
        f"ML feedback: Transaction {transaction_id} corrected to category {correct_category_id} by user {user_id}"
    )
    
    return jsonify({
        'message': 'Feedback recorded successfully',
        'transaction_id': transaction_id,
        'correct_category_id': correct_category_id
    }), 200