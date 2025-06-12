"""
Model Training and Management

This module handles training, validation, and management of all ML models
in the Smart Finance Assistant system.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import logging
from datetime import datetime, date
import os
import json
from pathlib import Path

from .categorization import TransactionCategorizer
from .prediction import SpendingPredictor
from .recommendation import BudgetRecommendationEngine
from .evaluation import ModelEvaluator

logger = logging.getLogger(__name__)

class ModelTrainer:
    """Central model training and management class"""
    
    def __init__(self, model_path: str = None, config: Dict[str, Any] = None):
        self.model_path = model_path or os.path.join(os.path.dirname(__file__), 'trained_models')
        self.config = config or self._load_default_config()
        
        # Initialize models
        self.categorizer = TransactionCategorizer(self.model_path)
        self.predictor = SpendingPredictor(self.model_path)
        self.recommender = BudgetRecommendationEngine(self.model_path)
        self.evaluator = ModelEvaluator()
        
        # Training history
        self.training_history = []
        
        # Ensure directories exist
        os.makedirs(self.model_path, exist_ok=True)
        os.makedirs(os.path.join(self.model_path, 'logs'), exist_ok=True)
    
    def _load_default_config(self) -> Dict[str, Any]:
        """Load default training configuration"""
        return {
            'categorization': {
                'min_transactions_per_category': 10,
                'test_size': 0.2,
                'validation_split': 0.1,
                'retrain_threshold': 0.05  # Retrain if accuracy drops by 5%
            },
            'prediction': {
                'min_periods': 10,
                'forecast_periods': 4,
                'period_type': 'week',
                'test_size': 0.2
            },
            'recommendation': {
                'min_users': 5,
                'cluster_update_frequency': 30,  # days
                'budget_styles': ['conservative', 'balanced', 'aggressive']
            },
            'general': {
                'random_state': 42,
                'save_models': True,
                'backup_models': True,
                'log_level': 'INFO'
            }
        }
    
    def validate_training_data(self, transactions_df: pd.DataFrame, 
                             categories_df: pd.DataFrame, 
                             users_df: pd.DataFrame = None) -> Dict[str, Any]:
        """Validate data quality before training"""
        
        logger.info("Validating training data...")
        
        validation_results = {
            'is_valid': True,
            'errors': [],
            'warnings': [],
            'data_stats': {}
        }
        
        # Basic data validation
        if len(transactions_df) == 0:
            validation_results['errors'].append("No transactions data provided")
            validation_results['is_valid'] = False
        
        if len(categories_df) == 0:
            validation_results['errors'].append("No categories data provided")
            validation_results['is_valid'] = False
        
        # Check required columns
        required_transaction_columns = ['id', 'user_id', 'amount', 'description', 'date', 'type']
        missing_columns = [col for col in required_transaction_columns if col not in transactions_df.columns]
        if missing_columns:
            validation_results['errors'].append(f"Missing transaction columns: {missing_columns}")
            validation_results['is_valid'] = False
        
        required_category_columns = ['id', 'name', 'type']
        missing_cat_columns = [col for col in required_category_columns if col not in categories_df.columns]
        if missing_cat_columns:
            validation_results['errors'].append(f"Missing category columns: {missing_cat_columns}")
            validation_results['is_valid'] = False
        
        if not validation_results['is_valid']:
            return validation_results
        
        # Data quality checks
        categorized_transactions = transactions_df[transactions_df['category_id'].notna()]
        validation_results['data_stats'] = {
            'total_transactions': len(transactions_df),
            'categorized_transactions': len(categorized_transactions),
            'categorization_rate': len(categorized_transactions) / len(transactions_df),
            'unique_users': transactions_df['user_id'].nunique(),
            'unique_categories': categories_df['id'].nunique(),
            'date_range': {
                'start': transactions_df['date'].min(),
                'end': transactions_df['date'].max()
            }
        }
        
        # Check minimum requirements
        if len(categorized_transactions) < 100:
            validation_results['warnings'].append("Less than 100 categorized transactions available")
        
        if validation_results['data_stats']['unique_users'] < 5:
            validation_results['warnings'].append("Less than 5 users in dataset")
        
        # Category distribution check
        category_counts = categorized_transactions['category_id'].value_counts()
        small_categories = category_counts[category_counts < self.config['categorization']['min_transactions_per_category']]
        
        if len(small_categories) > 0:
            validation_results['warnings'].append(
                f"{len(small_categories)} categories have fewer than "
                f"{self.config['categorization']['min_transactions_per_category']} transactions"
            )
        
        logger.info(f"Data validation complete. Valid: {validation_results['is_valid']}")
        return validation_results
    
    def train_categorization_model(self, transactions_df: pd.DataFrame, 
                                 categories_df: pd.DataFrame,
                                 force_retrain: bool = False) -> Dict[str, Any]:
        """Train transaction categorization model"""
        
        logger.info("Training transaction categorization model...")
        
        # Check if retraining is needed
        if not force_retrain and self._should_skip_categorization_training():
            logger.info("Categorization model is up to date, skipping training")
            return {'status': 'skipped', 'reason': 'model_up_to_date'}
        
        # Prepare training data
        categorized_transactions = transactions_df[transactions_df['category_id'].notna()]
        
        # Filter categories with sufficient data
        category_counts = categorized_transactions['category_id'].value_counts()
        valid_categories = category_counts[
            category_counts >= self.config['categorization']['min_transactions_per_category']
        ].index
        
        training_data = categorized_transactions[
            categorized_transactions['category_id'].isin(valid_categories)
        ]
        
        if len(training_data) < 50:
            raise ValueError("Not enough training data for categorization model")
        
        # Train model
        start_time = datetime.now()
        
        try:
            model_scores = self.categorizer.train_models(training_data, categories_df)
            
            training_time = (datetime.now() - start_time).total_seconds()
            
            # Evaluate model
            evaluation_results = self.evaluator.evaluate_categorization_model(
                self.categorizer, training_data, categories_df
            )
            
            # Save model if configured
            if self.config['general']['save_models']:
                self.categorizer.save_model()
            
            # Record training history
            training_record = {
                'model_type': 'categorization',
                'timestamp': datetime.now().isoformat(),
                'training_data_size': len(training_data),
                'model_scores': model_scores,
                'evaluation_results': evaluation_results,
                'training_time_seconds': training_time,
                'best_model': self.categorizer.best_model_name
            }
            
            self.training_history.append(training_record)
            self._save_training_log(training_record)
            
            logger.info(f"Categorization model training complete. Best model: {self.categorizer.best_model_name}")
            
            return {
                'status': 'success',
                'model_scores': model_scores,
                'evaluation_results': evaluation_results,
                'training_time': training_time,
                'best_model': self.categorizer.best_model_name
            }
            
        except Exception as e:
            logger.error(f"Error training categorization model: {str(e)}")
            return {'status': 'error', 'error': str(e)}
    
    def train_prediction_models(self, transactions_df: pd.DataFrame,
                               user_ids: List[int] = None,
                               force_retrain: bool = False) -> Dict[str, Any]:
        """Train spending prediction models"""
        
        logger.info("Training spending prediction models...")
        
        if user_ids is None:
            user_ids = transactions_df['user_id'].unique()[:10]  # Limit for demo
        
        results = {}
        
        for user_id in user_ids:
            logger.info(f"Training prediction model for user {user_id}")
            
            try:
                user_transactions = transactions_df[transactions_df['user_id'] == user_id]
                
                # Check if user has enough data
                user_periods = self.predictor.prepare_time_series_features(
                    user_transactions, user_id, self.config['prediction']['period_type']
                )
                
                if len(user_periods) < self.config['prediction']['min_periods']:
                    logger.warning(f"User {user_id} has insufficient data for prediction model")
                    results[user_id] = {'status': 'insufficient_data'}
                    continue
                
                # Train model
                start_time = datetime.now()
                
                model_scores = self.predictor.train_prediction_models(
                    user_transactions, user_id, self.config['prediction']['period_type']
                )
                
                training_time = (datetime.now() - start_time).total_seconds()
                
                # Test predictions
                test_predictions = self.predictor.predict_future_spending(
                    user_transactions, user_id, 
                    self.config['prediction']['forecast_periods'],
                    self.config['prediction']['period_type']
                )
                
                results[user_id] = {
                    'status': 'success',
                    'model_scores': model_scores,
                    'training_time': training_time,
                    'test_predictions': test_predictions,
                    'best_model': self.predictor.best_model_name
                }
                
                logger.info(f"Prediction model for user {user_id} trained successfully")
                
            except Exception as e:
                logger.error(f"Error training prediction model for user {user_id}: {str(e)}")
                results[user_id] = {'status': 'error', 'error': str(e)}
        
        # Save models if configured
        if self.config['general']['save_models']:
            self.predictor.save_model()
        
        return results
    
    def train_recommendation_engine(self, transactions_df: pd.DataFrame,
                                  categories_df: pd.DataFrame,
                                  users_df: pd.DataFrame = None,
                                  force_retrain: bool = False) -> Dict[str, Any]:
        """Train budget recommendation engine"""
        
        logger.info("Training budget recommendation engine...")
        
        try:
            start_time = datetime.now()
            
            # Create user clusters
            clustering_results = self.recommender.create_user_clusters(
                transactions_df, categories_df
            )
            
            if 'error' in clustering_results:
                return {'status': 'error', 'error': clustering_results['error']}
            
            training_time = (datetime.now() - start_time).total_seconds()
            
            # Test recommendations for a few users
            test_users = transactions_df['user_id'].unique()[:3]
            sample_recommendations = {}
            
            for user_id in test_users:
                try:
                    recommendation = self.recommender.generate_budget_recommendations(
                        transactions_df, categories_df, user_id
                    )
                    sample_recommendations[user_id] = recommendation
                except Exception as e:
                    logger.warning(f"Could not generate test recommendation for user {user_id}: {str(e)}")
            
            # Save model if configured
            if self.config['general']['save_models']:
                self.recommender.save_model()
            
            # Record training history
            training_record = {
                'model_type': 'recommendation',
                'timestamp': datetime.now().isoformat(),
                'clustering_results': clustering_results,
                'training_time_seconds': training_time,
                'sample_recommendations': len(sample_recommendations)
            }
            
            self.training_history.append(training_record)
            self._save_training_log(training_record)
            
            logger.info("Budget recommendation engine training complete")
            
            return {
                'status': 'success',
                'clustering_results': clustering_results,
                'training_time': training_time,
                'sample_recommendations': sample_recommendations
            }
            
        except Exception as e:
            logger.error(f"Error training recommendation engine: {str(e)}")
            return {'status': 'error', 'error': str(e)}
    
    def train_all_models(self, transactions_df: pd.DataFrame,
                        categories_df: pd.DataFrame,
                        users_df: pd.DataFrame = None,
                        force_retrain: bool = False) -> Dict[str, Any]:
        """Train all ML models"""
        
        logger.info("Starting training of all ML models...")
        
        # Validate data first
        validation_results = self.validate_training_data(transactions_df, categories_df, users_df)
        
        if not validation_results['is_valid']:
            return {
                'status': 'error',
                'error': 'Data validation failed',
                'validation_results': validation_results
            }
        
        all_results = {
            'validation_results': validation_results,
            'training_results': {}
        }
        
        # Train categorization model
        logger.info("Training categorization model...")
        categorization_results = self.train_categorization_model(
            transactions_df, categories_df, force_retrain
        )
        all_results['training_results']['categorization'] = categorization_results
        
        # Train prediction models
        logger.info("Training prediction models...")
        prediction_results = self.train_prediction_models(
            transactions_df, force_retrain=force_retrain
        )
        all_results['training_results']['prediction'] = prediction_results
        
        # Train recommendation engine
        logger.info("Training recommendation engine...")
        recommendation_results = self.train_recommendation_engine(
            transactions_df, categories_df, users_df, force_retrain
        )
        all_results['training_results']['recommendation'] = recommendation_results
        
        # Overall training summary
        successful_models = sum(1 for result in all_results['training_results'].values() 
                              if isinstance(result, dict) and result.get('status') == 'success')
        
        all_results['summary'] = {
            'total_models': 3,
            'successful_models': successful_models,
            'overall_status': 'success' if successful_models >= 2 else 'partial_failure',
            'training_completed_at': datetime.now().isoformat()
        }
        
        logger.info(f"Model training complete. {successful_models}/3 models trained successfully")
        
        return all_results
    
    def _should_skip_categorization_training(self) -> bool:
        """Check if categorization model training should be skipped"""
        # This is a simplified check - in production you'd compare model performance,
        # data freshness, etc.
        model_file = os.path.join(self.model_path, 'categorizer_model.pkl')
        return os.path.exists(model_file)
    
    def _save_training_log(self, training_record: Dict[str, Any]):
        """Save training record to log file"""
        
        log_file = os.path.join(self.model_path, 'logs', f'training_log_{datetime.now().strftime("%Y%m")}.json')
        
        # Load existing logs
        logs = []
        if os.path.exists(log_file):
            try:
                with open(log_file, 'r') as f:
                    logs = json.load(f)
            except:
                logs = []
        
        # Add new record
        logs.append(training_record)
        
        # Save updated logs
        with open(log_file, 'w') as f:
            json.dump(logs, f, indent=2, default=str)
    
    def get_model_status(self) -> Dict[str, Any]:
        """Get status of all trained models"""
        
        status = {
            'categorization': {
                'is_trained': self.categorizer.is_trained,
                'model_file_exists': os.path.exists(os.path.join(self.model_path, 'categorizer_model.pkl'))
            },
            'prediction': {
                'is_trained': self.predictor.is_trained,
                'model_file_exists': os.path.exists(os.path.join(self.model_path, 'spending_predictor_model.pkl'))
            },
            'recommendation': {
                'is_fitted': self.recommender.is_fitted,
                'model_file_exists': os.path.exists(os.path.join(self.model_path, 'budget_recommender_model.pkl'))
            },
            'last_training': None
        }
        
        # Get last training date from logs
        if self.training_history:
            status['last_training'] = self.training_history[-1]['timestamp']
        
        return status
    
    def load_all_models(self) -> Dict[str, Any]:
        """Load all trained models from disk"""
        
        logger.info("Loading all trained models...")
        
        results = {}
        
        # Load categorization model
        try:
            self.categorizer.load_model()
            results['categorization'] = {'status': 'loaded'}
        except Exception as e:
            logger.warning(f"Could not load categorization model: {str(e)}")
            results['categorization'] = {'status': 'error', 'error': str(e)}
        
        # Load prediction model
        try:
            self.predictor.load_model()
            results['prediction'] = {'status': 'loaded'}
        except Exception as e:
            logger.warning(f"Could not load prediction model: {str(e)}")
            results['prediction'] = {'status': 'error', 'error': str(e)}
        
        # Load recommendation model
        try:
            self.recommender.load_model()
            results['recommendation'] = {'status': 'loaded'}
        except Exception as e:
            logger.warning(f"Could not load recommendation model: {str(e)}")
            results['recommendation'] = {'status': 'error', 'error': str(e)}
        
        successful_loads = sum(1 for result in results.values() 
                              if result.get('status') == 'loaded')
        
        logger.info(f"Model loading complete. {successful_loads}/3 models loaded successfully")
        
        return {
            'results': results,
            'successful_loads': successful_loads,
            'total_models': 3
        }