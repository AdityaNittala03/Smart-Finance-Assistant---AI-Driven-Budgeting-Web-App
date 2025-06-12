"""
Machine Learning Models Package for Smart Finance Assistant

This package contains all ML-related functionality including:
- Data preprocessing and feature engineering
- Transaction categorization models
- Spending prediction algorithms
- Budget recommendation systems
- Model training and evaluation utilities
"""

from .categorization import TransactionCategorizer
from .prediction import SpendingPredictor
from .recommendation import BudgetRecommendationEngine
from .preprocessing import DataPreprocessor
from .training import ModelTrainer
from .evaluation import ModelEvaluator

__version__ = "1.0.0"

__all__ = [
    'TransactionCategorizer',
    'SpendingPredictor', 
    'BudgetRecommendationEngine',
    'DataPreprocessor',
    'ModelTrainer',
    'ModelEvaluator'
]