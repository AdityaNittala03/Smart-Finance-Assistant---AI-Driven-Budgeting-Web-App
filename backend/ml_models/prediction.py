"""
Spending Prediction ML Models

This module implements machine learning models for predicting future spending
patterns, trends, and budget requirements based on historical transaction data.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import logging
from datetime import datetime, date, timedelta
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split, cross_val_score
import joblib
import os
from scipy import stats

from .preprocessing import DataPreprocessor

logger = logging.getLogger(__name__)

class SpendingPredictor:
    """ML model for spending prediction and forecasting"""
    
    def __init__(self, model_path: str = None):
        self.model_path = model_path or os.path.join(os.path.dirname(__file__), 'trained_models')
        self.preprocessor = DataPreprocessor(model_path)
        
        # Initialize models
        self.models = {
            'random_forest': RandomForestRegressor(
                n_estimators=100,
                max_depth=15,
                min_samples_split=5,
                random_state=42
            ),
            'gradient_boosting': GradientBoostingRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42
            ),
            'linear_regression': LinearRegression(),
            'ridge_regression': Ridge(alpha=1.0)
        }
        
        self.best_model = None
        self.best_model_name = None
        self.model_performance = {}
        self.is_trained = False
        
        # Ensure model directory exists
        os.makedirs(self.model_path, exist_ok=True)
    
    def prepare_time_series_features(self, transactions_df: pd.DataFrame, 
                                   user_id: int = None, 
                                   period: str = 'week') -> pd.DataFrame:
        """Prepare time series features for spending prediction"""
        
        df = transactions_df.copy()
        
        # Filter by user if specified
        if user_id:
            df = df[df['user_id'] == user_id]
        
        # Convert date column
        df['date'] = pd.to_datetime(df['date'])
        
        # Filter expense transactions only
        df = df[df['type'] == 'expense']
        
        # Group by time period
        if period == 'day':
            df['period'] = df['date'].dt.date
        elif period == 'week':
            df['period'] = df['date'].dt.to_period('W').dt.start_time.dt.date
        elif period == 'month':
            df['period'] = df['date'].dt.to_period('M').dt.start_time.dt.date
        else:
            raise ValueError("Period must be 'day', 'week', or 'month'")
        
        # Aggregate spending by period
        period_spending = df.groupby('period').agg({
            'amount': ['sum', 'mean', 'count', 'std'],
            'category_id': lambda x: x.nunique()
        }).reset_index()
        
        # Flatten column names
        period_spending.columns = [
            'period', 'total_spending', 'avg_transaction', 'transaction_count', 
            'spending_std', 'unique_categories'
        ]
        
        # Fill missing values
        period_spending['spending_std'] = period_spending['spending_std'].fillna(0)
        
        # Sort by period
        period_spending = period_spending.sort_values('period').reset_index(drop=True)
        
        return period_spending
    
    def create_lagged_features(self, spending_df: pd.DataFrame, max_lags: int = 4) -> pd.DataFrame:
        """Create lagged features for time series prediction"""
        
        df = spending_df.copy()
        
        # Create lagged features
        for lag in range(1, max_lags + 1):
            df[f'total_spending_lag_{lag}'] = df['total_spending'].shift(lag)
            df[f'avg_transaction_lag_{lag}'] = df['avg_transaction'].shift(lag)
            df[f'transaction_count_lag_{lag}'] = df['transaction_count'].shift(lag)
        
        # Create rolling statistics
        for window in [2, 3, 4]:
            df[f'total_spending_roll_mean_{window}'] = df['total_spending'].rolling(window=window).mean()
            df[f'total_spending_roll_std_{window}'] = df['total_spending'].rolling(window=window).std()
        
        # Create trend features
        df['spending_trend'] = df['total_spending'].pct_change()
        df['spending_trend_3period'] = df['total_spending'].pct_change(periods=3)
        
        # Fill NaN values
        df = df.fillna(0)
        
        return df
    
    def add_temporal_features(self, spending_df: pd.DataFrame) -> pd.DataFrame:
        """Add temporal features to spending data"""
        
        df = spending_df.copy()
        df['period'] = pd.to_datetime(df['period'])
        
        # Add temporal features
        df['day_of_week'] = df['period'].dt.dayofweek
        df['day_of_month'] = df['period'].dt.day
        df['month'] = df['period'].dt.month
        df['quarter'] = df['period'].dt.quarter
        df['is_weekend'] = df['day_of_week'].isin([5, 6])
        df['is_month_start'] = df['day_of_month'] <= 3
        df['is_month_end'] = df['day_of_month'] >= 28
        df['is_holiday_season'] = df['month'].isin([11, 12])
        
        # Add cyclical encoding for temporal features
        df['day_of_week_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['day_of_week_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        
        return df
    
    def prepare_prediction_dataset(self, transactions_df: pd.DataFrame, 
                                 user_id: int = None, 
                                 period: str = 'week') -> pd.DataFrame:
        """Prepare complete dataset for prediction model training"""
        
        logger.info(f"Preparing prediction dataset for user {user_id}, period: {period}")
        
        # Create time series features
        spending_df = self.prepare_time_series_features(transactions_df, user_id, period)
        
        if len(spending_df) < 10:
            raise ValueError(f"Need at least 10 periods of data, got {len(spending_df)}")
        
        # Add lagged features
        spending_df = self.create_lagged_features(spending_df)
        
        # Add temporal features
        spending_df = self.add_temporal_features(spending_df)
        
        # Remove rows with NaN values (from lagging)
        spending_df = spending_df.dropna()
        
        logger.info(f"Dataset prepared: {len(spending_df)} periods, {spending_df.shape[1]} features")
        
        return spending_df
    
    def train_prediction_models(self, transactions_df: pd.DataFrame, 
                               user_id: int = None, 
                               period: str = 'week') -> Dict[str, float]:
        """Train spending prediction models"""
        
        # Prepare dataset
        dataset = self.prepare_prediction_dataset(transactions_df, user_id, period)
        
        # Select features for training
        feature_columns = [col for col in dataset.columns if col not in ['period', 'total_spending']]
        X = dataset[feature_columns].values
        y = dataset['total_spending'].values
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, shuffle=False  # Don't shuffle time series
        )
        
        logger.info(f"Training set: {X_train.shape}, Test set: {X_test.shape}")
        
        # Train and evaluate models
        model_scores = {}
        
        for model_name, model in self.models.items():
            logger.info(f"Training {model_name}...")
            
            try:
                # Train model
                model.fit(X_train, y_train)
                
                # Make predictions
                y_pred = model.predict(X_test)
                
                # Calculate metrics
                mae = mean_absolute_error(y_test, y_pred)
                mse = mean_squared_error(y_test, y_pred)
                rmse = np.sqrt(mse)
                r2 = r2_score(y_test, y_pred)
                
                # Cross-validation (with time series split)
                cv_scores = cross_val_score(model, X_train, y_train, cv=3, scoring='neg_mean_absolute_error')
                cv_mae = -cv_scores.mean()
                
                model_scores[model_name] = {
                    'mae': mae,
                    'mse': mse,
                    'rmse': rmse,
                    'r2': r2,
                    'cv_mae': cv_mae
                }
                
                logger.info(f"{model_name} - MAE: {mae:.2f}, RMSE: {rmse:.2f}, R²: {r2:.3f}")
                
            except Exception as e:
                logger.error(f"Error training {model_name}: {str(e)}")
                model_scores[model_name] = {'mae': float('inf'), 'mse': float('inf'), 'rmse': float('inf'), 'r2': -float('inf'), 'cv_mae': float('inf')}
        
        # Select best model based on cross-validation MAE
        self.best_model_name = min(model_scores.keys(), key=lambda k: model_scores[k]['cv_mae'])
        self.best_model = self.models[self.best_model_name]
        self.model_performance = model_scores
        
        # Retrain best model on full dataset
        self.best_model.fit(X, y)
        self.feature_columns = feature_columns
        self.is_trained = True
        
        logger.info(f"Best model: {self.best_model_name} with CV MAE: {model_scores[self.best_model_name]['cv_mae']:.2f}")
        
        return {name: scores['cv_mae'] for name, scores in model_scores.items()}
    
    def predict_future_spending(self, transactions_df: pd.DataFrame, 
                               user_id: int, 
                               periods_ahead: int = 4, 
                               period: str = 'week') -> Dict[str, Any]:
        """Predict future spending for specified periods"""
        
        if not self.is_trained:
            raise ValueError("Model not trained. Call train_prediction_models first.")
        
        # Prepare current dataset
        dataset = self.prepare_prediction_dataset(transactions_df, user_id, period)
        
        predictions = []
        prediction_dates = []
        
        # Get the last period date
        last_period = pd.to_datetime(dataset['period'].max())
        
        # Make predictions for future periods
        for i in range(1, periods_ahead + 1):
            # Calculate future period date
            if period == 'day':
                future_date = last_period + timedelta(days=i)
            elif period == 'week':
                future_date = last_period + timedelta(weeks=i)
            elif period == 'month':
                future_date = last_period + timedelta(days=30*i)  # Approximate
            
            # Create features for future period
            future_features = self._create_future_features(dataset, i, future_date)
            
            # Make prediction
            prediction = self.best_model.predict([future_features])[0]
            predictions.append(max(0, prediction))  # Ensure non-negative
            prediction_dates.append(future_date.date())
        
        # Calculate confidence intervals (simplified approach)
        historical_errors = self._calculate_historical_errors(dataset)
        confidence_intervals = self._calculate_confidence_intervals(predictions, historical_errors)
        
        return {
            'predictions': predictions,
            'dates': prediction_dates,
            'confidence_intervals': confidence_intervals,
            'model_used': self.best_model_name,
            'period_type': period
        }
    
    def _create_future_features(self, dataset: pd.DataFrame, periods_ahead: int, future_date: datetime) -> np.ndarray:
        """Create features for future period prediction"""
        
        # Get last few rows for lagged features
        last_rows = dataset.tail(4)
        
        # Initialize feature vector
        features = {}
        
        # Lagged features (use recent values)
        for lag in range(1, 5):
            if len(last_rows) >= lag:
                features[f'total_spending_lag_{lag}'] = last_rows.iloc[-lag]['total_spending']
                features[f'avg_transaction_lag_{lag}'] = last_rows.iloc[-lag]['avg_transaction']
                features[f'transaction_count_lag_{lag}'] = last_rows.iloc[-lag]['transaction_count']
            else:
                features[f'total_spending_lag_{lag}'] = 0
                features[f'avg_transaction_lag_{lag}'] = 0
                features[f'transaction_count_lag_{lag}'] = 0
        
        # Rolling statistics (use recent values)
        for window in [2, 3, 4]:
            if len(last_rows) >= window:
                features[f'total_spending_roll_mean_{window}'] = last_rows.tail(window)['total_spending'].mean()
                features[f'total_spending_roll_std_{window}'] = last_rows.tail(window)['total_spending'].std()
            else:
                features[f'total_spending_roll_mean_{window}'] = 0
                features[f'total_spending_roll_std_{window}'] = 0
        
        # Trend features
        if len(last_rows) >= 2:
            features['spending_trend'] = (last_rows.iloc[-1]['total_spending'] - last_rows.iloc[-2]['total_spending']) / last_rows.iloc[-2]['total_spending']
        else:
            features['spending_trend'] = 0
        
        if len(last_rows) >= 4:
            features['spending_trend_3period'] = (last_rows.iloc[-1]['total_spending'] - last_rows.iloc[-4]['total_spending']) / last_rows.iloc[-4]['total_spending']
        else:
            features['spending_trend_3period'] = 0
        
        # Temporal features
        features['day_of_week'] = future_date.weekday()
        features['day_of_month'] = future_date.day
        features['month'] = future_date.month
        features['quarter'] = (future_date.month - 1) // 3 + 1
        features['is_weekend'] = future_date.weekday() >= 5
        features['is_month_start'] = future_date.day <= 3
        features['is_month_end'] = future_date.day >= 28
        features['is_holiday_season'] = future_date.month in [11, 12]
        
        # Cyclical encoding
        features['day_of_week_sin'] = np.sin(2 * np.pi * future_date.weekday() / 7)
        features['day_of_week_cos'] = np.cos(2 * np.pi * future_date.weekday() / 7)
        features['month_sin'] = np.sin(2 * np.pi * future_date.month / 12)
        features['month_cos'] = np.cos(2 * np.pi * future_date.month / 12)
        
        # Historical averages for missing features
        for col in ['unique_categories']:
            if col in dataset.columns:
                features[col] = dataset[col].mean()
            else:
                features[col] = 0
        
        # Convert to array in the same order as training
        feature_vector = [features.get(col, 0) for col in self.feature_columns]
        
        return np.array(feature_vector)
    
    def _calculate_historical_errors(self, dataset: pd.DataFrame) -> float:
        """Calculate historical prediction errors for confidence intervals"""
        
        if len(dataset) < 5:
            return dataset['total_spending'].std()
        
        # Use simple approach: predict last few periods and calculate errors
        X = dataset[self.feature_columns].values
        y = dataset['total_spending'].values
        
        errors = []
        for i in range(min(5, len(dataset) - 1)):
            train_X = X[:-i-1]
            train_y = y[:-i-1]
            test_X = X[-i-1:-i] if i > 0 else X[-1:]
            test_y = y[-i-1:-i] if i > 0 else y[-1:]
            
            # Train on subset and predict
            temp_model = self.models[self.best_model_name]
            temp_model.fit(train_X, train_y)
            pred = temp_model.predict(test_X)[0]
            
            errors.append(abs(pred - test_y[0]))
        
        return np.mean(errors) if errors else dataset['total_spending'].std()
    
    def _calculate_confidence_intervals(self, predictions: List[float], error_estimate: float) -> List[Tuple[float, float]]:
        """Calculate confidence intervals for predictions"""
        
        confidence_intervals = []
        
        for pred in predictions:
            # Simple approach: use historical error as basis for confidence interval
            lower_bound = max(0, pred - 1.96 * error_estimate)  # 95% confidence interval
            upper_bound = pred + 1.96 * error_estimate
            
            confidence_intervals.append((lower_bound, upper_bound))
        
        return confidence_intervals
    
    def detect_spending_anomalies(self, transactions_df: pd.DataFrame, 
                                 user_id: int, 
                                 period: str = 'week',
                                 threshold: float = 2.0) -> List[Dict[str, Any]]:
        """Detect anomalous spending patterns"""
        
        # Prepare dataset
        dataset = self.prepare_prediction_dataset(transactions_df, user_id, period)
        
        # Calculate spending statistics
        spending_mean = dataset['total_spending'].mean()
        spending_std = dataset['total_spending'].std()
        
        # Identify anomalies using z-score
        dataset['z_score'] = np.abs((dataset['total_spending'] - spending_mean) / spending_std)
        anomalies = dataset[dataset['z_score'] > threshold]
        
        anomaly_list = []
        for _, row in anomalies.iterrows():
            anomaly_list.append({
                'period': row['period'].strftime('%Y-%m-%d'),
                'spending': row['total_spending'],
                'z_score': row['z_score'],
                'anomaly_type': 'high' if row['total_spending'] > spending_mean else 'low',
                'severity': 'high' if row['z_score'] > 3.0 else 'medium'
            })
        
        return anomaly_list
    
    def get_spending_insights(self, transactions_df: pd.DataFrame, user_id: int) -> Dict[str, Any]:
        """Generate spending insights and patterns"""
        
        user_transactions = transactions_df[transactions_df['user_id'] == user_id]
        user_transactions = user_transactions[user_transactions['type'] == 'expense']
        
        if len(user_transactions) == 0:
            return {'error': 'No expense transactions found for user'}
        
        insights = {}
        
        # Basic statistics
        insights['total_spending'] = user_transactions['amount'].sum()
        insights['avg_transaction'] = user_transactions['amount'].mean()
        insights['transaction_count'] = len(user_transactions)
        
        # Spending by category
        if 'category_id' in user_transactions.columns:
            category_spending = user_transactions.groupby('category_id')['amount'].sum().sort_values(ascending=False)
            insights['top_categories'] = category_spending.head(5).to_dict()
        
        # Temporal patterns
        user_transactions['date'] = pd.to_datetime(user_transactions['date'])
        user_transactions['day_of_week'] = user_transactions['date'].dt.day_name()
        user_transactions['hour'] = user_transactions['date'].dt.hour
        
        # Spending by day of week
        daily_spending = user_transactions.groupby('day_of_week')['amount'].mean()
        insights['spending_by_day'] = daily_spending.to_dict()
        
        # Monthly trends
        user_transactions['month'] = user_transactions['date'].dt.to_period('M')
        monthly_spending = user_transactions.groupby('month')['amount'].sum()
        insights['monthly_trend'] = monthly_spending.tail(6).to_dict()
        
        # Spending patterns
        insights['weekend_vs_weekday'] = {
            'weekend': user_transactions[user_transactions['date'].dt.weekday >= 5]['amount'].mean(),
            'weekday': user_transactions[user_transactions['date'].dt.weekday < 5]['amount'].mean()
        }
        
        return insights
    
    def save_model(self, filename_prefix: str = 'spending_predictor'):
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
            'feature_columns': self.feature_columns,
            'trained_at': datetime.now().isoformat(),
            'is_trained': self.is_trained
        }
        joblib.dump(metadata, metadata_path)
        
        logger.info(f"Spending prediction model saved to {self.model_path}")
    
    def load_model(self, filename_prefix: str = 'spending_predictor'):
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
            self.feature_columns = metadata['feature_columns']
            self.is_trained = metadata['is_trained']
            
            logger.info(f"Spending prediction model loaded from {self.model_path}")
            
        else:
            logger.warning("Model files not found. Cannot load.")