import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, date
import sys
import os

# Add ML models to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'ml_models'))

try:
    from ml_models.training import ModelTrainer
    from ml_models.categorization import TransactionCategorizer
    from ml_models.prediction import SpendingPredictor
    from ml_models.recommendation import BudgetRecommendationEngine
    from ml_models.evaluation import ModelEvaluator
    ML_AVAILABLE = True
except ImportError as e:
    logging.warning(f"ML models not available: {str(e)}")
    ML_AVAILABLE = False

from .. import db
from ..models.transaction import Transaction
from ..models.category import Category
from ..models.user import User
from ..models.prediction import Prediction

logger = logging.getLogger(__name__)

class MLService:
    """Service for machine learning operations"""
    
    def __init__(self):
        self.model_path = os.path.join(os.path.dirname(__file__), '..', '..', 'ml_models', 'trained_models')
        
        if ML_AVAILABLE:
            self.trainer = ModelTrainer(self.model_path)
            self.categorizer = TransactionCategorizer(self.model_path)
            self.predictor = SpendingPredictor(self.model_path)
            self.recommender = BudgetRecommendationEngine(self.model_path)
            self.evaluator = ModelEvaluator()
            
            # Try to load existing models
            self._load_models()
        else:
            logger.warning("ML functionality disabled - missing dependencies")
    
    def _load_models(self):
        """Load existing trained models"""
        try:
            self.trainer.load_all_models()
            logger.info("ML models loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load existing models: {str(e)}")
    
    def auto_categorize_transaction(self, transaction):
        """Auto-categorize transaction using ML"""
        if not ML_AVAILABLE or not self.categorizer.is_trained:
            logger.warning("Categorization model not available")
            return None
        
        try:
            # Prepare transaction data for prediction
            transaction_data = {
                'description': transaction.description,
                'amount': float(transaction.amount),
                'date': transaction.date,
                'merchant': transaction.merchant,
                'user_id': transaction.user_id
            }
            
            # Get prediction
            prediction_result = self.categorizer.predict_category(transaction_data)
            
            if prediction_result and prediction_result.get('confidence', 0) > 0.5:
                # Update transaction with ML prediction
                transaction.set_ml_prediction(
                    prediction_result['predicted_category_id'],
                    prediction_result['confidence']
                )
                
                # Store prediction in database for tracking
                self._store_prediction_result(transaction, prediction_result)
                
                logger.info(f"Transaction {transaction.id} auto-categorized as {prediction_result['predicted_category_name']} (confidence: {prediction_result['confidence']:.2f})")
                
                return prediction_result
            
        except Exception as e:
            logger.error(f"Error auto-categorizing transaction {transaction.id}: {str(e)}")
        
        return None
    
    def get_category_suggestions(self, description: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Get category suggestions for a transaction description"""
        if not ML_AVAILABLE or not self.categorizer.is_trained:
            return []
        
        try:
            return self.categorizer.get_category_suggestions(description, top_k)
        except Exception as e:
            logger.error(f"Error getting category suggestions: {str(e)}")
            return []
    
    def predict_future_spending(self, user_id: int, periods_ahead: int = 4, period: str = 'week') -> Optional[Dict[str, Any]]:
        """Predict future spending for a user"""
        if not ML_AVAILABLE or not self.predictor.is_trained:
            return None
        
        try:
            # Get user transactions
            transactions_data = self._get_user_transactions_data(user_id)
            
            if len(transactions_data) == 0:
                return None
            
            # Make prediction
            prediction_result = self.predictor.predict_future_spending(
                transactions_data, user_id, periods_ahead, period
            )
            
            # Store predictions in database
            self._store_spending_predictions(user_id, prediction_result, period)
            
            return prediction_result
            
        except Exception as e:
            logger.error(f"Error predicting spending for user {user_id}: {str(e)}")
            return None
    
    def generate_budget_recommendations(self, user_id: int, target_budget: float = None, 
                                      budget_style: str = 'balanced') -> Optional[Dict[str, Any]]:
        """Generate budget recommendations for a user"""
        if not ML_AVAILABLE or not self.recommender.is_fitted:
            return None
        
        try:
            # Get data
            transactions_data = self._get_user_transactions_data(user_id)
            categories_data = self._get_categories_data()
            
            if len(transactions_data) == 0:
                return None
            
            # Generate recommendations
            recommendations = self.recommender.generate_budget_recommendations(
                transactions_data, categories_data, user_id, target_budget, budget_style
            )
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating budget recommendations for user {user_id}: {str(e)}")
            return None
    
    def detect_spending_anomalies(self, user_id: int, period: str = 'week', 
                                 threshold: float = 2.0) -> List[Dict[str, Any]]:
        """Detect spending anomalies for a user"""
        if not ML_AVAILABLE or not self.predictor.is_trained:
            return []
        
        try:
            transactions_data = self._get_user_transactions_data(user_id)
            
            if len(transactions_data) == 0:
                return []
            
            anomalies = self.predictor.detect_spending_anomalies(
                transactions_data, user_id, period, threshold
            )
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Error detecting anomalies for user {user_id}: {str(e)}")
            return []
    
    def train_all_models(self, force_retrain: bool = False):
        """Train all ML models"""
        if not ML_AVAILABLE:
            return {'error': 'ML functionality not available'}
        
        try:
            logger.info("Starting ML model training...")
            
            # Get training data
            transactions_data = self._get_transactions_data()
            categories_data = self._get_categories_data()
            users_data = self._get_users_data()
            
            # Train models
            training_results = self.trainer.train_all_models(
                transactions_data, categories_data, users_data, force_retrain
            )
            
            # Update model instances
            self.categorizer = self.trainer.categorizer
            self.predictor = self.trainer.predictor
            self.recommender = self.trainer.recommender
            
            logger.info("ML model training completed")
            
            return training_results
            
        except Exception as e:
            logger.error(f"Error training models: {str(e)}")
            return {'error': str(e)}
    
    def evaluate_models(self) -> Dict[str, Any]:
        """Evaluate all trained models"""
        if not ML_AVAILABLE:
            return {'error': 'ML functionality not available'}
        
        try:
            evaluation_results = {}
            
            # Get test data
            transactions_data = self._get_transactions_data()
            categories_data = self._get_categories_data()
            
            # Evaluate categorization model
            if self.categorizer.is_trained:
                cat_eval = self.evaluator.evaluate_categorization_model(
                    self.categorizer, transactions_data, categories_data
                )
                evaluation_results['categorization'] = cat_eval
            
            # Evaluate prediction model (sample user)
            if self.predictor.is_trained and len(transactions_data) > 0:
                sample_user = transactions_data['user_id'].iloc[0]
                pred_eval = self.evaluator.evaluate_prediction_model(
                    self.predictor, transactions_data, sample_user
                )
                evaluation_results['prediction'] = pred_eval
            
            # Evaluate recommendation engine
            if self.recommender.is_fitted:
                rec_eval = self.evaluator.evaluate_recommendation_engine(
                    self.recommender, transactions_data, categories_data
                )
                evaluation_results['recommendation'] = rec_eval
            
            return evaluation_results
            
        except Exception as e:
            logger.error(f"Error evaluating models: {str(e)}")
            return {'error': str(e)}
    
    def get_model_status(self) -> Dict[str, Any]:
        """Get status of all ML models"""
        if not ML_AVAILABLE:
            return {'ml_available': False, 'error': 'ML dependencies not installed'}
        
        return {
            'ml_available': True,
            'models': {
                'categorization': {
                    'is_trained': self.categorizer.is_trained,
                    'performance': self.categorizer.model_performance
                },
                'prediction': {
                    'is_trained': self.predictor.is_trained,
                    'performance': self.predictor.model_performance
                },
                'recommendation': {
                    'is_fitted': self.recommender.is_fitted,
                    'clusters': len(self.recommender.cluster_profiles) if self.recommender.cluster_profiles else 0
                }
            },
            'last_updated': datetime.now().isoformat()
        }
    
    def _get_transactions_data(self):
        """Get transactions data as DataFrame"""
        import pandas as pd
        
        transactions = Transaction.query.filter_by(is_deleted=False).all()
        
        data = []
        for t in transactions:
            data.append({
                'id': t.id,
                'user_id': t.user_id,
                'amount': float(t.amount),
                'description': t.description,
                'date': t.date,
                'type': t.type,
                'category_id': t.category_id,
                'merchant': t.merchant,
                'created_at': t.created_at
            })
        
        return pd.DataFrame(data)
    
    def _get_user_transactions_data(self, user_id: int):
        """Get transactions data for specific user"""
        import pandas as pd
        
        transactions = Transaction.query.filter_by(
            user_id=user_id, is_deleted=False
        ).all()
        
        data = []
        for t in transactions:
            data.append({
                'id': t.id,
                'user_id': t.user_id,
                'amount': float(t.amount),
                'description': t.description,
                'date': t.date,
                'type': t.type,
                'category_id': t.category_id,
                'merchant': t.merchant
            })
        
        return pd.DataFrame(data)
    
    def _get_categories_data(self):
        """Get categories data as DataFrame"""
        import pandas as pd
        
        categories = Category.query.filter_by(is_active=True).all()
        
        data = []
        for c in categories:
            data.append({
                'id': c.id,
                'name': c.name,
                'type': c.type,
                'parent_id': c.parent_id,
                'user_id': c.user_id,
                'is_system': c.is_system
            })
        
        return pd.DataFrame(data)
    
    def _get_users_data(self):
        """Get users data as DataFrame"""
        import pandas as pd
        
        users = User.query.filter_by(is_active=True).all()
        
        data = []
        for u in users:
            data.append({
                'id': u.id,
                'email': u.email,
                'created_at': u.created_at,
                'currency': u.currency,
                'timezone': u.timezone
            })
        
        return pd.DataFrame(data)
    
    def _store_prediction_result(self, transaction, prediction_result):
        """Store prediction result in database"""
        try:
            prediction = Prediction(
                user_id=transaction.user_id,
                category_id=prediction_result.get('predicted_category_id'),
                prediction_type='spending_forecast',
                prediction_date=transaction.date,
                valid_from=datetime.now().date(),
                valid_until=datetime.now().date(),
                confidence_score=prediction_result.get('confidence', 0.0),
                model_version='1.0.0',
                prediction_data=prediction_result
            )
            
            db.session.add(prediction)
            db.session.commit()
            
        except Exception as e:
            logger.error(f"Error storing prediction result: {str(e)}")
    
    def _store_spending_predictions(self, user_id: int, prediction_result: Dict[str, Any], period: str):
        """Store spending predictions in database"""
        try:
            for i, (pred_amount, pred_date) in enumerate(zip(
                prediction_result['predictions'], 
                prediction_result['dates']
            )):
                prediction = Prediction(
                    user_id=user_id,
                    prediction_type='spending_forecast',
                    period_type=period,
                    prediction_date=pred_date,
                    valid_from=datetime.now().date(),
                    valid_until=pred_date,
                    predicted_amount=pred_amount,
                    confidence_score=0.8,  # Default confidence
                    model_version='1.0.0',
                    prediction_data=prediction_result
                )
                
                db.session.add(prediction)
            
            db.session.commit()
            
        except Exception as e:
            logger.error(f"Error storing spending predictions: {str(e)}")

# Global ML service instance
ml_service = MLService()