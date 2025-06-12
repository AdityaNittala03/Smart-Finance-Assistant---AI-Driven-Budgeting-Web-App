"""
Data Preprocessing Pipeline for Smart Finance Assistant ML Models

This module handles all data preprocessing tasks including:
- Text cleaning and normalization
- Feature engineering
- Data validation and quality checks
- Feature extraction for ML models
"""

import pandas as pd
import numpy as np
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, date
import logging
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
import joblib
import os

logger = logging.getLogger(__name__)

class DataPreprocessor:
    """Main data preprocessing class for ML pipeline"""
    
    def __init__(self, model_path: str = None):
        self.model_path = model_path or os.path.join(os.path.dirname(__file__), 'trained_models')
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=2
        )
        self.is_fitted = False
        
        # Ensure model directory exists
        os.makedirs(self.model_path, exist_ok=True)
    
    def clean_description(self, description: str) -> str:
        """Clean and normalize transaction descriptions"""
        if not description or pd.isna(description):
            return ""
        
        # Convert to lowercase
        text = description.lower().strip()
        
        # Remove special characters but keep spaces and basic punctuation
        text = re.sub(r'[^\w\s\-\.]', ' ', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove common prefixes/suffixes
        prefixes = ['pos', 'debit', 'credit', 'purchase', 'payment', 'transfer']
        for prefix in prefixes:
            if text.startswith(prefix + ' '):
                text = text[len(prefix):].strip()
        
        # Remove transaction IDs and numbers
        text = re.sub(r'\b\d{4,}\b', '', text)
        
        # Remove dates in various formats
        text = re.sub(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b', '', text)
        text = re.sub(r'\b\d{2,4}[/-]\d{1,2}[/-]\d{1,2}\b', '', text)
        
        return text.strip()
    
    def extract_merchant_name(self, description: str) -> str:
        """Extract merchant name from transaction description"""
        cleaned = self.clean_description(description)
        
        if not cleaned:
            return "unknown"
        
        # Common patterns for merchant extraction
        words = cleaned.split()
        
        # If description is short, use the whole thing
        if len(words) <= 3:
            return cleaned
        
        # Take first few meaningful words
        merchant_words = []
        for word in words[:4]:  # Limit to first 4 words
            if len(word) > 2 and word.isalpha():  # Skip short words and numbers
                merchant_words.append(word)
        
        return ' '.join(merchant_words) if merchant_words else cleaned
    
    def extract_features_from_description(self, description: str) -> Dict[str, Any]:
        """Extract various features from transaction description"""
        features = {}
        
        if not description or pd.isna(description):
            return self._empty_description_features()
        
        cleaned = self.clean_description(description)
        
        # Basic text features
        features['description_length'] = len(description)
        features['word_count'] = len(cleaned.split())
        features['avg_word_length'] = np.mean([len(word) for word in cleaned.split()]) if cleaned else 0
        
        # Pattern-based features
        features['has_numbers'] = bool(re.search(r'\d', description))
        features['has_special_chars'] = bool(re.search(r'[^\w\s]', description))
        features['is_uppercase'] = description.isupper()
        features['merchant_name'] = self.extract_merchant_name(description)
        
        # Category-related keywords
        food_keywords = ['restaurant', 'cafe', 'coffee', 'food', 'pizza', 'burger', 'grocery', 'market', 'chips', 'cold drink', 'zomato', 'swiggy']
        transport_keywords = ['gas', 'fuel', 'uber', 'taxi', 'parking', 'metro', 'bus', 'train']
        shopping_keywords = ['store', 'shop', 'amazon', 'walmart', 'target', 'purchase', 'buy', 'cig', 'blinkint', 'zepto']
        entertainment_keywords = ['movie', 'cinema', 'netflix', 'spotify', 'game', 'entertainment']
        
        features['food_keywords'] = sum(1 for kw in food_keywords if kw in cleaned)
        features['transport_keywords'] = sum(1 for kw in transport_keywords if kw in cleaned)
        features['shopping_keywords'] = sum(1 for kw in shopping_keywords if kw in cleaned)
        features['entertainment_keywords'] = sum(1 for kw in entertainment_keywords if kw in cleaned)
        
        return features
    
    def _empty_description_features(self) -> Dict[str, Any]:
        """Return empty features for null descriptions"""
        return {
            'description_length': 0,
            'word_count': 0,
            'avg_word_length': 0,
            'has_numbers': False,
            'has_special_chars': False,
            'is_uppercase': False,
            'merchant_name': 'unknown',
            'food_keywords': 0,
            'transport_keywords': 0,
            'shopping_keywords': 0,
            'entertainment_keywords': 0
        }
    
    def extract_temporal_features(self, transaction_date: date) -> Dict[str, Any]:
        """Extract temporal features from transaction date"""
        if not transaction_date:
            return {}
        
        if isinstance(transaction_date, str):
            transaction_date = pd.to_datetime(transaction_date).date()
        
        features = {
            'day_of_week': transaction_date.weekday(),  # 0=Monday, 6=Sunday
            'day_of_month': transaction_date.day,
            'month': transaction_date.month,
            'quarter': (transaction_date.month - 1) // 3 + 1,
            'is_weekend': transaction_date.weekday() >= 5,
            'is_month_start': transaction_date.day <= 3,
            'is_month_end': transaction_date.day >= 28,
            'is_holiday_season': transaction_date.month in [11, 12]  # Nov-Dec
        }
        
        return features
    
    def extract_amount_features(self, amount: float) -> Dict[str, Any]:
        """Extract features from transaction amount"""
        if pd.isna(amount):
            amount = 0.0
        
        amount = abs(float(amount))
        
        features = {
            'amount': amount,
            'amount_log': np.log1p(amount),  # log(1 + amount) to handle zeros
            'amount_rounded': round(amount),
            'is_round_number': amount == round(amount),
            'amount_category': self._categorize_amount(amount)
        }
        
        return features
    
    def _categorize_amount(self, amount: float) -> str:
        """Categorize amount into bins"""
        if amount < 10:
            return 'small'
        elif amount < 50:
            return 'medium'
        elif amount < 200:
            return 'large'
        else:
            return 'very_large'
    
    def preprocess_transactions(self, transactions_df: pd.DataFrame) -> pd.DataFrame:
        """Preprocess transaction data for ML models"""
        logger.info(f"Preprocessing {len(transactions_df)} transactions")
        
        df = transactions_df.copy()
        
        # Ensure required columns exist
        required_columns = ['description', 'amount', 'date']
        for col in required_columns:
            if col not in df.columns:
                raise ValueError(f"Required column '{col}' not found in DataFrame")
        
        # Extract features
        logger.info("Extracting description features...")
        description_features = df['description'].apply(self.extract_features_from_description)
        description_df = pd.DataFrame(description_features.tolist())
        
        logger.info("Extracting temporal features...")
        temporal_features = df['date'].apply(self.extract_temporal_features)
        temporal_df = pd.DataFrame(temporal_features.tolist())
        
        logger.info("Extracting amount features...")
        amount_features = df['amount'].apply(self.extract_amount_features)
        amount_df = pd.DataFrame(amount_features.tolist())
        
        # Combine all features
        features_df = pd.concat([
            df[['id', 'description', 'amount', 'date']],  # Keep original columns
            description_df,
            temporal_df,
            amount_df
        ], axis=1)
        
        # Add user spending patterns (if user_id available)
        if 'user_id' in df.columns:
            features_df = self._add_user_spending_patterns(features_df, df)
        
        logger.info(f"Feature extraction complete. Shape: {features_df.shape}")
        return features_df
    
    def _add_user_spending_patterns(self, features_df: pd.DataFrame, original_df: pd.DataFrame) -> pd.DataFrame:
        """Add user-specific spending pattern features"""
        user_stats = original_df.groupby('user_id')['amount'].agg([
            'mean', 'std', 'count'
        ]).reset_index()
        user_stats.columns = ['user_id', 'user_avg_amount', 'user_std_amount', 'user_transaction_count']
        
        # Merge user stats
        features_df = features_df.merge(
            user_stats, 
            left_on=original_df['user_id'], 
            right_on='user_id', 
            how='left'
        )
        
        # Calculate relative amount features
        features_df['amount_vs_user_avg'] = features_df['amount'] / features_df['user_avg_amount']
        features_df['amount_zscore'] = (
            (features_df['amount'] - features_df['user_avg_amount']) / 
            features_df['user_std_amount'].replace(0, 1)
        )
        
        return features_df
    
    def prepare_features_for_training(self, features_df: pd.DataFrame, target_column: str = None) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare features for ML model training"""
        
        # Select numeric features for training
        numeric_features = features_df.select_dtypes(include=[np.number]).columns.tolist()
        
        # Remove ID and target columns
        exclude_columns = ['id', 'user_id', target_column] if target_column else ['id', 'user_id']
        feature_columns = [col for col in numeric_features if col not in exclude_columns]
        
        X = features_df[feature_columns].fillna(0)
        
        # Process text features using TF-IDF
        if 'description' in features_df.columns:
            text_features = self.tfidf_vectorizer.fit_transform(
                features_df['description'].fillna('')
            )
            
            # Combine numeric and text features
            from scipy.sparse import hstack
            X_numeric = X.values
            X_combined = hstack([X_numeric, text_features]).toarray()
        else:
            X_combined = X.values
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X_combined)
        
        # Prepare target variable if provided
        y = None
        if target_column and target_column in features_df.columns:
            y = features_df[target_column].values
            if y.dtype == 'object':
                y = self.label_encoder.fit_transform(y)
        
        self.is_fitted = True
        logger.info(f"Features prepared for training. Shape: {X_scaled.shape}")
        
        return X_scaled, y
    
    def transform_features(self, features_df: pd.DataFrame) -> np.ndarray:
        """Transform features using fitted preprocessors"""
        if not self.is_fitted:
            raise ValueError("Preprocessors not fitted. Call prepare_features_for_training first.")
        
        # Select same numeric features used in training
        numeric_features = features_df.select_dtypes(include=[np.number]).columns.tolist()
        exclude_columns = ['id', 'user_id']
        feature_columns = [col for col in numeric_features if col not in exclude_columns]
        
        X = features_df[feature_columns].fillna(0)
        
        # Process text features
        if 'description' in features_df.columns:
            text_features = self.tfidf_vectorizer.transform(
                features_df['description'].fillna('')
            )
            
            from scipy.sparse import hstack
            X_numeric = X.values
            X_combined = hstack([X_numeric, text_features]).toarray()
        else:
            X_combined = X.values
        
        # Scale features
        X_scaled = self.scaler.transform(X_combined)
        
        return X_scaled
    
    def save_preprocessors(self, filename_prefix: str = 'preprocessor'):
        """Save fitted preprocessors to disk"""
        if not self.is_fitted:
            raise ValueError("Preprocessors not fitted. Cannot save.")
        
        scaler_path = os.path.join(self.model_path, f'{filename_prefix}_scaler.pkl')
        tfidf_path = os.path.join(self.model_path, f'{filename_prefix}_tfidf.pkl')
        label_encoder_path = os.path.join(self.model_path, f'{filename_prefix}_label_encoder.pkl')
        
        joblib.dump(self.scaler, scaler_path)
        joblib.dump(self.tfidf_vectorizer, tfidf_path)
        joblib.dump(self.label_encoder, label_encoder_path)
        
        logger.info(f"Preprocessors saved to {self.model_path}")
    
    def load_preprocessors(self, filename_prefix: str = 'preprocessor'):
        """Load fitted preprocessors from disk"""
        scaler_path = os.path.join(self.model_path, f'{filename_prefix}_scaler.pkl')
        tfidf_path = os.path.join(self.model_path, f'{filename_prefix}_tfidf.pkl')
        label_encoder_path = os.path.join(self.model_path, f'{filename_prefix}_label_encoder.pkl')
        
        if all(os.path.exists(path) for path in [scaler_path, tfidf_path, label_encoder_path]):
            self.scaler = joblib.load(scaler_path)
            self.tfidf_vectorizer = joblib.load(tfidf_path)
            self.label_encoder = joblib.load(label_encoder_path)
            self.is_fitted = True
            
            logger.info(f"Preprocessors loaded from {self.model_path}")
        else:
            logger.warning("Some preprocessor files not found. Cannot load.")
    
    def validate_data_quality(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Validate data quality and return quality metrics"""
        quality_report = {
            'total_rows': len(df),
            'missing_descriptions': df['description'].isna().sum(),
            'missing_amounts': df['amount'].isna().sum(),
            'missing_dates': df['date'].isna().sum(),
            'duplicate_transactions': df.duplicated().sum(),
            'negative_amounts': (df['amount'] < 0).sum() if 'amount' in df.columns else 0,
            'zero_amounts': (df['amount'] == 0).sum() if 'amount' in df.columns else 0,
            'future_dates': 0,
            'quality_score': 0.0
        }
        
        # Check for future dates
        if 'date' in df.columns:
            today = pd.Timestamp.now().date()
            future_dates = pd.to_datetime(df['date']).dt.date > today
            quality_report['future_dates'] = future_dates.sum()
        
        # Calculate overall quality score (0-1)
        total_issues = (
            quality_report['missing_descriptions'] +
            quality_report['missing_amounts'] +
            quality_report['missing_dates'] +
            quality_report['duplicate_transactions'] +
            quality_report['future_dates']
        )
        
        quality_report['quality_score'] = max(0, 1 - (total_issues / len(df)))
        
        logger.info(f"Data quality score: {quality_report['quality_score']:.2f}")
        
        return quality_report