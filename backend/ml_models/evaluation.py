"""
Model Evaluation and Validation

This module provides comprehensive evaluation and validation tools
for all ML models in the Smart Finance Assistant system.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import logging
from datetime import datetime, date
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report,
    mean_absolute_error, mean_squared_error, r2_score
)
import matplotlib.pyplot as plt
import seaborn as sns
import os
import json

logger = logging.getLogger(__name__)

class ModelEvaluator:
    """Comprehensive model evaluation and validation class"""
    
    def __init__(self, save_plots: bool = True, plots_dir: str = None):
        self.save_plots = save_plots
        self.plots_dir = plots_dir or os.path.join(os.path.dirname(__file__), 'evaluation_plots')
        
        if save_plots:
            os.makedirs(self.plots_dir, exist_ok=True)
    
    def evaluate_categorization_model(self, categorizer, test_data: pd.DataFrame, 
                                    categories_df: pd.DataFrame) -> Dict[str, Any]:
        """Evaluate transaction categorization model"""
        
        logger.info("Evaluating categorization model...")
        
        if not categorizer.is_trained:
            return {'error': 'Model not trained'}
        
        # Prepare test data
        test_transactions = test_data[test_data['category_id'].notna()].copy()
        
        if len(test_transactions) == 0:
            return {'error': 'No categorized test data available'}
        
        # Get predictions
        predictions_df = categorizer.predict_batch(test_transactions)
        
        # Merge with actual categories
        actual_categories = test_transactions.merge(
            categories_df[['id', 'name']], 
            left_on='category_id', 
            right_on='id',
            how='left'
        )
        
        y_true = actual_categories['name'].values
        y_pred = predictions_df['predicted_category_name'].values
        
        # Calculate metrics
        accuracy = accuracy_score(y_true, y_pred)
        
        # Per-class metrics
        precision = precision_score(y_true, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_true, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_true, y_pred, average='weighted', zero_division=0)
        
        # Detailed classification report
        class_report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)
        
        # Confusion matrix
        conf_matrix = confusion_matrix(y_true, y_pred)
        
        # Calculate per-category accuracy
        category_accuracy = {}
        for category in np.unique(y_true):
            mask = y_true == category
            if np.sum(mask) > 0:
                category_accuracy[category] = accuracy_score(y_true[mask], y_pred[mask])
        
        # Confidence analysis
        confidence_analysis = self._analyze_prediction_confidence(predictions_df)
        
        # Error analysis
        error_analysis = self._analyze_categorization_errors(
            test_transactions, predictions_df, actual_categories
        )
        
        evaluation_results = {
            'overall_metrics': {
                'accuracy': float(accuracy),
                'precision': float(precision),
                'recall': float(recall),
                'f1_score': float(f1)
            },
            'per_category_accuracy': {k: float(v) for k, v in category_accuracy.items()},
            'classification_report': class_report,
            'confusion_matrix': conf_matrix.tolist(),
            'confidence_analysis': confidence_analysis,
            'error_analysis': error_analysis,
            'test_data_size': len(test_transactions),
            'unique_categories': len(np.unique(y_true)),
            'evaluation_timestamp': datetime.now().isoformat()
        }
        
        # Generate plots if enabled
        if self.save_plots:
            self._plot_categorization_results(evaluation_results, y_true, y_pred)
        
        logger.info(f"Categorization model evaluation complete. Accuracy: {accuracy:.3f}")
        
        return evaluation_results
    
    def _analyze_prediction_confidence(self, predictions_df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze prediction confidence distribution"""
        
        confidences = predictions_df['prediction_confidence'].values
        
        return {
            'mean_confidence': float(np.mean(confidences)),
            'median_confidence': float(np.median(confidences)),
            'std_confidence': float(np.std(confidences)),
            'min_confidence': float(np.min(confidences)),
            'max_confidence': float(np.max(confidences)),
            'confidence_quartiles': {
                'q25': float(np.percentile(confidences, 25)),
                'q50': float(np.percentile(confidences, 50)),
                'q75': float(np.percentile(confidences, 75))
            },
            'low_confidence_count': int(np.sum(confidences < 0.5)),
            'high_confidence_count': int(np.sum(confidences > 0.8))
        }
    
    def _analyze_categorization_errors(self, test_transactions: pd.DataFrame,
                                     predictions_df: pd.DataFrame,
                                     actual_categories: pd.DataFrame) -> Dict[str, Any]:
        """Analyze categorization errors in detail"""
        
        # Merge predictions with actual data
        error_analysis_df = test_transactions.merge(
            predictions_df[['id', 'predicted_category_name', 'prediction_confidence']],
            on='id',
            how='left'
        ).merge(
            actual_categories[['id', 'name']],
            on='id',
            how='left'
        )
        
        # Find misclassified transactions
        errors = error_analysis_df[
            error_analysis_df['predicted_category_name'] != error_analysis_df['name']
        ].copy()
        
        if len(errors) == 0:
            return {'error_count': 0, 'error_rate': 0.0}
        
        # Analyze error patterns
        error_patterns = errors.groupby(['name', 'predicted_category_name']).size().reset_index()
        error_patterns.columns = ['actual_category', 'predicted_category', 'count']
        error_patterns = error_patterns.sort_values('count', ascending=False)
        
        # Most confused categories
        confused_categories = error_patterns.head(10).to_dict('records')
        
        # Errors by confidence level
        confidence_bins = ['very_low', 'low', 'medium', 'high']
        confidence_ranges = [(0, 0.3), (0.3, 0.5), (0.5, 0.8), (0.8, 1.0)]
        
        errors_by_confidence = {}
        for bin_name, (low, high) in zip(confidence_bins, confidence_ranges):
            mask = (errors['prediction_confidence'] >= low) & (errors['prediction_confidence'] < high)
            errors_by_confidence[bin_name] = int(np.sum(mask))
        
        return {
            'error_count': len(errors),
            'error_rate': len(errors) / len(test_transactions),
            'confused_categories': confused_categories,
            'errors_by_confidence': errors_by_confidence,
            'avg_error_confidence': float(errors['prediction_confidence'].mean()),
            'sample_errors': errors[['description', 'amount', 'name', 'predicted_category_name', 'prediction_confidence']].head(5).to_dict('records')
        }
    
    def evaluate_prediction_model(self, predictor, test_data: pd.DataFrame, 
                                user_id: int, period: str = 'week') -> Dict[str, Any]:
        """Evaluate spending prediction model"""
        
        logger.info(f"Evaluating prediction model for user {user_id}...")
        
        if not predictor.is_trained:
            return {'error': 'Model not trained'}
        
        try:
            # Prepare test dataset
            test_dataset = predictor.prepare_prediction_dataset(test_data, user_id, period)
            
            if len(test_dataset) < 10:
                return {'error': 'Insufficient test data'}
            
            # Split data for evaluation (use last 20% as test)
            split_point = int(len(test_dataset) * 0.8)
            train_data = test_dataset.iloc[:split_point]
            test_data_subset = test_dataset.iloc[split_point:]
            
            # Retrain on subset for evaluation
            feature_columns = [col for col in test_dataset.columns if col not in ['period', 'total_spending']]
            X_train = train_data[feature_columns].values
            y_train = train_data['total_spending'].values
            X_test = test_data_subset[feature_columns].values
            y_test = test_data_subset['total_spending'].values
            
            # Use the best model for prediction
            predictor.best_model.fit(X_train, y_train)
            y_pred = predictor.best_model.predict(X_test)
            
            # Calculate metrics
            mae = mean_absolute_error(y_test, y_pred)
            mse = mean_squared_error(y_test, y_pred)
            rmse = np.sqrt(mse)
            r2 = r2_score(y_test, y_pred)
            
            # Calculate percentage errors
            mape = np.mean(np.abs((y_test - y_pred) / np.maximum(y_test, 1))) * 100
            
            # Analyze residuals
            residuals = y_test - y_pred
            residual_analysis = {
                'mean_residual': float(np.mean(residuals)),
                'std_residual': float(np.std(residuals)),
                'max_residual': float(np.max(np.abs(residuals))),
                'residual_skewness': float(pd.Series(residuals).skew()),
                'residual_kurtosis': float(pd.Series(residuals).kurtosis())
            }
            
            # Future predictions for validation
            future_predictions = predictor.predict_future_spending(
                test_data, user_id, periods_ahead=3, period=period
            )
            
            evaluation_results = {
                'user_id': user_id,
                'period': period,
                'metrics': {
                    'mae': float(mae),
                    'mse': float(mse),
                    'rmse': float(rmse),
                    'r2_score': float(r2),
                    'mape': float(mape)
                },
                'residual_analysis': residual_analysis,
                'test_predictions': {
                    'actual': y_test.tolist(),
                    'predicted': y_pred.tolist(),
                    'dates': test_data_subset['period'].dt.strftime('%Y-%m-%d').tolist()
                },
                'future_predictions': future_predictions,
                'test_data_size': len(test_data_subset),
                'model_used': predictor.best_model_name,
                'evaluation_timestamp': datetime.now().isoformat()
            }
            
            # Generate plots if enabled
            if self.save_plots:
                self._plot_prediction_results(evaluation_results)
            
            logger.info(f"Prediction model evaluation complete. RMSE: {rmse:.2f}, R²: {r2:.3f}")
            
            return evaluation_results
            
        except Exception as e:
            logger.error(f"Error evaluating prediction model: {str(e)}")
            return {'error': str(e)}
    
    def evaluate_recommendation_engine(self, recommender, test_data: pd.DataFrame,
                                     categories_df: pd.DataFrame,
                                     sample_users: List[int] = None) -> Dict[str, Any]:
        """Evaluate budget recommendation engine"""
        
        logger.info("Evaluating budget recommendation engine...")
        
        if not recommender.is_fitted:
            return {'error': 'Recommendation engine not fitted'}
        
        if sample_users is None:
            sample_users = test_data['user_id'].unique()[:5]
        
        evaluation_results = {
            'sample_users': sample_users,
            'user_recommendations': {},
            'cluster_analysis': {},
            'recommendation_quality': {},
            'evaluation_timestamp': datetime.now().isoformat()
        }
        
        successful_recommendations = 0
        
        for user_id in sample_users:
            try:
                # Generate recommendation
                recommendation = recommender.generate_budget_recommendations(
                    test_data, categories_df, user_id
                )
                
                if 'error' not in recommendation:
                    evaluation_results['user_recommendations'][user_id] = recommendation
                    successful_recommendations += 1
                    
                    # Analyze recommendation quality
                    quality_metrics = self._analyze_recommendation_quality(recommendation)
                    evaluation_results['recommendation_quality'][user_id] = quality_metrics
                
            except Exception as e:
                logger.warning(f"Could not generate recommendation for user {user_id}: {str(e)}")
                evaluation_results['user_recommendations'][user_id] = {'error': str(e)}
        
        # Analyze cluster quality
        if hasattr(recommender, 'cluster_profiles') and recommender.cluster_profiles:
            evaluation_results['cluster_analysis'] = self._analyze_cluster_quality(recommender)
        
        # Overall evaluation metrics
        evaluation_results['overall_metrics'] = {
            'success_rate': successful_recommendations / len(sample_users),
            'total_users_evaluated': len(sample_users),
            'successful_recommendations': successful_recommendations,
            'clusters_created': len(recommender.cluster_profiles) if recommender.cluster_profiles else 0
        }
        
        logger.info(f"Recommendation engine evaluation complete. Success rate: {evaluation_results['overall_metrics']['success_rate']:.2f}")
        
        return evaluation_results
    
    def _analyze_recommendation_quality(self, recommendation: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze quality of budget recommendation"""
        
        quality_metrics = {
            'has_category_recommendations': bool(recommendation.get('category_recommendations')),
            'category_count': len(recommendation.get('category_recommendations', [])),
            'has_financial_recommendations': bool(recommendation.get('financial_recommendations')),
            'has_insights': bool(recommendation.get('insights')),
            'insight_count': len(recommendation.get('insights', [])),
            'budget_coverage': 0.0
        }
        
        # Calculate budget coverage
        if recommendation.get('category_recommendations'):
            total_recommended = sum(
                cat['recommended_amount'] 
                for cat in recommendation['category_recommendations']
            )
            target_budget = recommendation.get('target_budget', 0)
            
            if target_budget > 0:
                quality_metrics['budget_coverage'] = total_recommended / target_budget
        
        return quality_metrics
    
    def _analyze_cluster_quality(self, recommender) -> Dict[str, Any]:
        """Analyze quality of user clustering"""
        
        cluster_analysis = {
            'cluster_count': len(recommender.cluster_profiles),
            'cluster_sizes': {},
            'cluster_characteristics': {}
        }
        
        for cluster_id, profile in recommender.cluster_profiles.items():
            cluster_analysis['cluster_sizes'][cluster_id] = profile['user_count']
            cluster_analysis['cluster_characteristics'][cluster_id] = {
                'spending_level': profile['spending_level'],
                'behavior_type': profile['behavior_type'],
                'avg_monthly_spending': profile['avg_monthly_spending']
            }
        
        return cluster_analysis
    
    def _plot_categorization_results(self, evaluation_results: Dict[str, Any],
                                   y_true: np.ndarray, y_pred: np.ndarray):
        """Generate plots for categorization model evaluation"""
        
        try:
            # Confusion matrix heatmap
            plt.figure(figsize=(12, 8))
            conf_matrix = np.array(evaluation_results['confusion_matrix'])
            
            # Get unique labels
            labels = sorted(list(set(y_true) | set(y_pred)))
            
            sns.heatmap(conf_matrix, annot=True, fmt='d', cmap='Blues',
                       xticklabels=labels, yticklabels=labels)
            plt.title('Transaction Categorization - Confusion Matrix')
            plt.ylabel('Actual Category')
            plt.xlabel('Predicted Category')
            plt.xticks(rotation=45)
            plt.yticks(rotation=45)
            plt.tight_layout()
            
            plot_path = os.path.join(self.plots_dir, 'categorization_confusion_matrix.png')
            plt.savefig(plot_path, dpi=300, bbox_inches='tight')
            plt.close()
            
            # Confidence distribution
            plt.figure(figsize=(10, 6))
            confidence_data = evaluation_results['confidence_analysis']
            
            plt.hist([confidence_data['mean_confidence']], bins=30, alpha=0.7, edgecolor='black')
            plt.axvline(confidence_data['mean_confidence'], color='red', linestyle='--', 
                       label=f'Mean: {confidence_data["mean_confidence"]:.3f}')
            plt.xlabel('Prediction Confidence')
            plt.ylabel('Frequency')
            plt.title('Distribution of Prediction Confidence')
            plt.legend()
            plt.grid(True, alpha=0.3)
            
            plot_path = os.path.join(self.plots_dir, 'categorization_confidence_dist.png')
            plt.savefig(plot_path, dpi=300, bbox_inches='tight')
            plt.close()
            
            logger.info("Categorization evaluation plots saved")
            
        except Exception as e:
            logger.warning(f"Could not generate categorization plots: {str(e)}")
    
    def _plot_prediction_results(self, evaluation_results: Dict[str, Any]):
        """Generate plots for prediction model evaluation"""
        
        try:
            # Actual vs Predicted scatter plot
            actual = evaluation_results['test_predictions']['actual']
            predicted = evaluation_results['test_predictions']['predicted']
            
            plt.figure(figsize=(10, 8))
            plt.scatter(actual, predicted, alpha=0.6)
            
            # Perfect prediction line
            min_val = min(min(actual), min(predicted))
            max_val = max(max(actual), max(predicted))
            plt.plot([min_val, max_val], [min_val, max_val], 'r--', label='Perfect Prediction')
            
            plt.xlabel('Actual Spending')
            plt.ylabel('Predicted Spending')
            plt.title(f'Spending Prediction: Actual vs Predicted (R² = {evaluation_results["metrics"]["r2_score"]:.3f})')
            plt.legend()
            plt.grid(True, alpha=0.3)
            
            plot_path = os.path.join(self.plots_dir, 'prediction_actual_vs_predicted.png')
            plt.savefig(plot_path, dpi=300, bbox_inches='tight')
            plt.close()
            
            # Time series plot
            if evaluation_results['test_predictions']['dates']:
                plt.figure(figsize=(12, 6))
                dates = pd.to_datetime(evaluation_results['test_predictions']['dates'])
                
                plt.plot(dates, actual, 'o-', label='Actual', linewidth=2)
                plt.plot(dates, predicted, 's-', label='Predicted', linewidth=2)
                
                plt.xlabel('Date')
                plt.ylabel('Spending Amount')
                plt.title('Spending Prediction Time Series')
                plt.legend()
                plt.grid(True, alpha=0.3)
                plt.xticks(rotation=45)
                
                plot_path = os.path.join(self.plots_dir, 'prediction_time_series.png')
                plt.savefig(plot_path, dpi=300, bbox_inches='tight')
                plt.close()
            
            logger.info("Prediction evaluation plots saved")
            
        except Exception as e:
            logger.warning(f"Could not generate prediction plots: {str(e)}")
    
    def generate_evaluation_report(self, all_evaluations: Dict[str, Any]) -> str:
        """Generate comprehensive evaluation report"""
        
        report = []
        report.append("# Smart Finance Assistant - Model Evaluation Report")
        report.append(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("")
        
        # Categorization model
        if 'categorization' in all_evaluations:
            cat_eval = all_evaluations['categorization']
            if 'error' not in cat_eval:
                report.append("## Transaction Categorization Model")
                report.append(f"- **Accuracy**: {cat_eval['overall_metrics']['accuracy']:.3f}")
                report.append(f"- **Precision**: {cat_eval['overall_metrics']['precision']:.3f}")
                report.append(f"- **Recall**: {cat_eval['overall_metrics']['recall']:.3f}")
                report.append(f"- **F1 Score**: {cat_eval['overall_metrics']['f1_score']:.3f}")
                report.append(f"- **Test Data Size**: {cat_eval['test_data_size']} transactions")
                report.append(f"- **Categories**: {cat_eval['unique_categories']}")
                report.append("")
        
        # Prediction model
        if 'prediction' in all_evaluations:
            pred_eval = all_evaluations['prediction']
            if isinstance(pred_eval, dict) and 'error' not in pred_eval:
                report.append("## Spending Prediction Model")
                if 'metrics' in pred_eval:
                    report.append(f"- **RMSE**: {pred_eval['metrics']['rmse']:.2f}")
                    report.append(f"- **MAE**: {pred_eval['metrics']['mae']:.2f}")
                    report.append(f"- **R² Score**: {pred_eval['metrics']['r2_score']:.3f}")
                    report.append(f"- **MAPE**: {pred_eval['metrics']['mape']:.1f}%")
                report.append("")
        
        # Recommendation engine
        if 'recommendation' in all_evaluations:
            rec_eval = all_evaluations['recommendation']
            if 'error' not in rec_eval:
                report.append("## Budget Recommendation Engine")
                if 'overall_metrics' in rec_eval:
                    report.append(f"- **Success Rate**: {rec_eval['overall_metrics']['success_rate']:.2f}")
                    report.append(f"- **Users Evaluated**: {rec_eval['overall_metrics']['total_users_evaluated']}")
                    report.append(f"- **Clusters Created**: {rec_eval['overall_metrics']['clusters_created']}")
                report.append("")
        
        return "\n".join(report)