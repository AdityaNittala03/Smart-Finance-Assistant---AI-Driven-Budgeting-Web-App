"""
Transaction Categorization ML Model

This module implements machine learning models for automatically categorizing
financial transactions based on their descriptions, amounts, and patterns.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import logging
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
import os
from datetime import datetime

from .preprocessing import DataPreprocessor

logger = logging.getLogger(__name__)

class TransactionCategorizer:
    """ML model for transaction categorization"""
    
    def __init__(self, model_path: str = None):
        self.model_path = model_path or os.path.join(os.path.dirname(__file__), 'trained_models')
        self.preprocessor = DataPreprocessor(model_path)
        
        # Initialize models
        self.models = {
            'random_forest': RandomForestClassifier(
                n_estimators=100,
                max_depth=20,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42
            ),
            'logistic_regression': LogisticRegression(
                max_iter=1000,
                random_state=42
            ),
            'naive_bayes': MultinomialNB(alpha=1.0)
        }
        
        self.best_model = None
        self.best_model_name = None
        self.model_performance = {}
        self.category_mapping = {}
        self.is_trained = False
        
        # Ensure model directory exists
        os.makedirs(self.model_path, exist_ok=True)
    
    def prepare_training_data(self, transactions_df: pd.DataFrame, categories_df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
        """Prepare training data with proper category mapping"""
        
        # Merge transactions with categories
        training_data = transactions_df.merge(
            categories_df[['id', 'name', 'type']],
            left_on='category_id',
            right_on='id',
            how='inner',
            suffixes=('', '_category')
        )
        
        # Filter out uncategorized transactions
        training_data = training_data[training_data['category_id'].notna()]
        
        # Create category mapping
        self.category_mapping = dict(zip(
            categories_df['id'],
            categories_df['name']
        ))
        
        # Get unique categories
        unique_categories = training_data['name'].unique().tolist()
        
        logger.info(f"Prepared training data: {len(training_data)} transactions, {len(unique_categories)} categories")
        
        return training_data, unique_categories
    
    def train_models(self, transactions_df: pd.DataFrame, categories_df: pd.DataFrame) -> Dict[str, float]:
        """Train multiple models and select the best one"""
        
        # Prepare training data
        training_data, unique_categories = self.prepare_training_data(transactions_df, categories_df)
        
        if len(training_data) < 50:
            raise ValueError("Need at least 50 categorized transactions for training")
        
        # Preprocess features
        features_df = self.preprocessor.preprocess_transactions(training_data)
        X, y = self.preprocessor.prepare_features_for_training(features_df, target_column='name')
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        logger.info(f"Training set: {X_train.shape}, Test set: {X_test.shape}")
        
        # Train and evaluate each model
        model_scores = {}
        
        for model_name, model in self.models.items():
            logger.info(f"Training {model_name}...")
            
            try:
                # Handle different model requirements
                if model_name == 'naive_bayes':
                    # Naive Bayes requires non-negative features
                    X_train_nb = np.abs(X_train)
                    X_test_nb = np.abs(X_test)
                    model.fit(X_train_nb, y_train)
                    y_pred = model.predict(X_test_nb)
                    test_score = accuracy_score(y_test, y_pred)
                else:
                    model.fit(X_train, y_train)
                    y_pred = model.predict(X_test)
                    test_score = accuracy_score(y_test, y_pred)
                
                # Cross-validation score
                if model_name == 'naive_bayes':
                    cv_scores = cross_val_score(model, np.abs(X_train), y_train, cv=5)
                else:
                    cv_scores = cross_val_score(model, X_train, y_train, cv=5)
                
                cv_score = cv_scores.mean()
                
                model_scores[model_name] = {
                    'test_accuracy': test_score,
                    'cv_accuracy': cv_score,
                    'std_cv': cv_scores.std()
                }
                
                logger.info(f"{model_name} - Test: {test_score:.3f}, CV: {cv_score:.3f} ± {cv_scores.std():.3f}")
                
            except Exception as e:
                logger.error(f"Error training {model_name}: {str(e)}")
                model_scores[model_name] = {'test_accuracy': 0, 'cv_accuracy': 0, 'std_cv': 0}
        
        # Select best model based on cross-validation score
        self.best_model_name = max(model_scores.keys(), key=lambda k: model_scores[k]['cv_accuracy'])
        self.best_model = self.models[self.best_model_name]
        self.model_performance = model_scores
        
        # Retrain best model on full training set
        if self.best_model_name == 'naive_bayes':
            self.best_model.fit(np.abs(X), y)
        else:
            self.best_model.fit(X, y)
        
        self.is_trained = True
        
        logger.info(f"Best model: {self.best_model_name} with CV accuracy: {model_scores[self.best_model_name]['cv_accuracy']:.3f}")
        
        return {name: scores['cv_accuracy'] for name, scores in model_scores.items()}
    
    def predict_category(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict category for a single transaction"""
        
        if not self.is_trained:
            raise ValueError("Model not trained. Call train_models first.")
        
        # Convert to DataFrame
        df = pd.DataFrame([transaction_data])
        
        # Preprocess
        features_df = self.preprocessor.preprocess_transactions(df)
        X = self.preprocessor.transform_features(features_df)
        
        # Make prediction
        if self.best_model_name == 'naive_bayes':
            X = np.abs(X)
        
        prediction = self.best_model.predict(X)[0]
        prediction_proba = self.best_model.predict_proba(X)[0]
        
        # Get category name from label encoder
        category_name = self.preprocessor.label_encoder.inverse_transform([prediction])[0]
        confidence = prediction_proba.max()
        
        # Get category ID from mapping
        category_id = None
        for cat_id, cat_name in self.category_mapping.items():
            if cat_name == category_name:
                category_id = cat_id
                break
        
        return {
            'predicted_category_id': category_id,
            'predicted_category_name': category_name,
            'confidence': float(confidence),
            'all_probabilities': {
                self.preprocessor.label_encoder.inverse_transform([i])[0]: float(prob)
                for i, prob in enumerate(prediction_proba)
            }
        }
    
    def predict_batch(self, transactions_df: pd.DataFrame) -> pd.DataFrame:
        """Predict categories for multiple transactions"""
        
        if not self.is_trained:
            raise ValueError("Model not trained. Call train_models first.")
        
        # Preprocess
        features_df = self.preprocessor.preprocess_transactions(transactions_df)
        X = self.preprocessor.transform_features(features_df)
        
        # Make predictions
        if self.best_model_name == 'naive_bayes':
            X = np.abs(X)
        
        predictions = self.best_model.predict(X)
        prediction_probas = self.best_model.predict_proba(X)
        
        # Convert predictions to category names
        category_names = self.preprocessor.label_encoder.inverse_transform(predictions)
        confidences = prediction_probas.max(axis=1)
        
        # Create results DataFrame
        results = transactions_df.copy()
        results['predicted_category_name'] = category_names
        results['prediction_confidence'] = confidences
        
        # Map category names to IDs
        name_to_id = {name: cat_id for cat_id, name in self.category_mapping.items()}
        results['predicted_category_id'] = results['predicted_category_name'].map(name_to_id)
        
        return results
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from the best model"""
        
        if not self.is_trained:
            raise ValueError("Model not trained. Call train_models first.")
        
        if hasattr(self.best_model, 'feature_importances_'):
            # For tree-based models
            importances = self.best_model.feature_importances_
            
            # Get feature names (this is simplified - in practice you'd need to track feature names)
            feature_names = [f'feature_{i}' for i in range(len(importances))]
            
            return dict(zip(feature_names, importances))
        
        elif hasattr(self.best_model, 'coef_'):
            # For linear models
            coefficients = np.abs(self.best_model.coef_[0])
            feature_names = [f'feature_{i}' for i in range(len(coefficients))]
            
            return dict(zip(feature_names, coefficients))
        
        else:
            return {}
    
    def evaluate_model(self, test_transactions_df: pd.DataFrame, test_categories_df: pd.DataFrame) -> Dict[str, Any]:
        """Evaluate model performance on test data"""
        
        if not self.is_trained:
            raise ValueError("Model not trained. Call train_models first.")
        
        # Prepare test data
        test_data = test_transactions_df.merge(
            test_categories_df[['id', 'name']],
            left_on='category_id',
            right_on='id',
            how='inner'
        )
        
        # Get predictions
        predictions_df = self.predict_batch(test_transactions_df)
        
        # Calculate metrics
        y_true = test_data['name'].values
        y_pred = predictions_df['predicted_category_name'].values
        
        accuracy = accuracy_score(y_true, y_pred)
        
        # Classification report
        class_report = classification_report(y_true, y_pred, output_dict=True)
        
        # Confusion matrix
        conf_matrix = confusion_matrix(y_true, y_pred)
        
        return {
            'accuracy': accuracy,
            'classification_report': class_report,
            'confusion_matrix': conf_matrix.tolist(),
            'model_performance': self.model_performance
        }
    
    def save_model(self, filename_prefix: str = 'categorizer'):
        """Save trained model to disk"""
        
        if not self.is_trained:
            raise ValueError("Model not trained. Cannot save.")
        
        model_path = os.path.join(self.model_path, f'{filename_prefix}_model.pkl')
        metadata_path = os.path.join(self.model_path, f'{filename_prefix}_metadata.pkl')
        
        # Save model
        joblib.dump(self.best_model, model_path)
        
        # Save metadata
        metadata = {
            'best_model_name': self.best_model_name,
            'model_performance': self.model_performance,
            'category_mapping': self.category_mapping,
            'trained_at': datetime.now().isoformat(),
            'is_trained': self.is_trained
        }
        joblib.dump(metadata, metadata_path)
        
        # Save preprocessors
        self.preprocessor.save_preprocessors(filename_prefix)
        
        logger.info(f"Model saved to {self.model_path}")
    
    def load_model(self, filename_prefix: str = 'categorizer'):
        """Load trained model from disk"""
        
        model_path = os.path.join(self.model_path, f'{filename_prefix}_model.pkl')
        metadata_path = os.path.join(self.model_path, f'{filename_prefix}_metadata.pkl')
        
        if os.path.exists(model_path) and os.path.exists(metadata_path):
            # Load model
            self.best_model = joblib.load(model_path)
            
            # Load metadata
            metadata = joblib.load(metadata_path)
            self.best_model_name = metadata['best_model_name']
            self.model_performance = metadata['model_performance']
            self.category_mapping = metadata['category_mapping']
            self.is_trained = metadata['is_trained']
            
            # Load preprocessors
            self.preprocessor.load_preprocessors(filename_prefix)
            
            logger.info(f"Model loaded from {self.model_path}")
            
        else:
            logger.warning("Model files not found. Cannot load.")
    
    def get_category_suggestions(self, description: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Get top-k category suggestions for a transaction description"""
        
        if not self.is_trained:
            raise ValueError("Model not trained. Call train_models first.")
        
        # Create dummy transaction data
        transaction_data = {
            'description': description,
            'amount': 0,  # Amount not critical for description-based categorization
            'date': datetime.now().date()
        }
        
        # Get prediction with probabilities
        result = self.predict_category(transaction_data)
        
        # Sort categories by probability
        sorted_categories = sorted(
            result['all_probabilities'].items(),
            key=lambda x: x[1],
            reverse=True
        )[:top_k]
        
        suggestions = []
        for category_name, probability in sorted_categories:
            # Find category ID
            category_id = None
            for cat_id, cat_name in self.category_mapping.items():
                if cat_name == category_name:
                    category_id = cat_id
                    break
            
            suggestions.append({
                'category_id': category_id,
                'category_name': category_name,
                'confidence': probability
            })
        
        return suggestions
    
    def retrain_with_feedback(self, transaction_id: int, correct_category_id: int, 
                             transactions_df: pd.DataFrame, categories_df: pd.DataFrame):
        """Retrain model with user feedback"""
        
        # This is a simplified approach - in production, you'd implement incremental learning
        logger.info(f"Received feedback for transaction {transaction_id}: category {correct_category_id}")
        
        # For now, we'll just log the feedback
        # In a full implementation, you would:
        # 1. Store the feedback
        # 2. Periodically retrain with accumulated feedback
        # 3. Use techniques like online learning or active learning
        
        # Placeholder for future implementation
        pass