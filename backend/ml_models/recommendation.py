"""
Budget Recommendation Engine

This module implements ML-based budget recommendation system that analyzes
spending patterns and suggests personalized budget allocations.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import logging
from datetime import datetime, date, timedelta
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import joblib
import os

from .preprocessing import DataPreprocessor
from .prediction import SpendingPredictor

logger = logging.getLogger(__name__)

class BudgetRecommendationEngine:
    """ML-based budget recommendation system"""
    
    def __init__(self, model_path: str = None):
        self.model_path = model_path or os.path.join(os.path.dirname(__file__), 'trained_models')
        self.spending_predictor = SpendingPredictor(model_path)
        self.scaler = StandardScaler()
        self.clustering_model = None
        self.user_clusters = {}
        self.cluster_profiles = {}
        self.is_fitted = False
        
        # Budget recommendation rules and weights
        self.budget_rules = {
            'conservative': {
                'emergency_fund_months': 6,
                'savings_rate': 0.20,
                'discretionary_spending': 0.30
            },
            'balanced': {
                'emergency_fund_months': 4,
                'savings_rate': 0.15,
                'discretionary_spending': 0.40
            },
            'aggressive': {
                'emergency_fund_months': 3,
                'savings_rate': 0.10,
                'discretionary_spending': 0.50
            }
        }
        
        # Ensure model directory exists
        os.makedirs(self.model_path, exist_ok=True)
    
    def analyze_user_spending_profile(self, transactions_df: pd.DataFrame, 
                                    categories_df: pd.DataFrame,
                                    user_id: int) -> Dict[str, Any]:
        """Analyze user's spending profile for budget recommendations"""
        
        user_transactions = transactions_df[
            (transactions_df['user_id'] == user_id) & 
            (transactions_df['type'] == 'expense')
        ].copy()
        
        if len(user_transactions) == 0:
            return {'error': 'No expense transactions found for user'}
        
        # Calculate time period for analysis
        user_transactions['date'] = pd.to_datetime(user_transactions['date'])
        date_range = (user_transactions['date'].max() - user_transactions['date'].min()).days
        months_of_data = max(1, date_range / 30)
        
        profile = {
            'user_id': user_id,
            'analysis_period_months': months_of_data,
            'total_transactions': len(user_transactions),
            'date_range': {
                'start': user_transactions['date'].min().date(),
                'end': user_transactions['date'].max().date()
            }
        }
        
        # Basic spending statistics
        profile['spending_stats'] = {
            'total_spending': float(user_transactions['amount'].sum()),
            'avg_monthly_spending': float(user_transactions['amount'].sum() / months_of_data),
            'avg_transaction_amount': float(user_transactions['amount'].mean()),
            'median_transaction_amount': float(user_transactions['amount'].median()),
            'spending_variance': float(user_transactions['amount'].var()),
            'max_transaction': float(user_transactions['amount'].max()),
            'transaction_frequency': len(user_transactions) / months_of_data
        }
        
        # Category-wise spending analysis
        if 'category_id' in user_transactions.columns:
            category_spending = user_transactions.merge(
                categories_df[['id', 'name', 'type']], 
                left_on='category_id', 
                right_on='id',
                how='left'
            )
            
            category_summary = category_spending.groupby('name')['amount'].agg([
                'sum', 'mean', 'count'
            ]).reset_index()
            
            category_summary['percentage'] = (category_summary['sum'] / 
                                            category_summary['sum'].sum() * 100)
            
            profile['category_breakdown'] = category_summary.sort_values(
                'sum', ascending=False
            ).head(10).to_dict('records')
        
        # Temporal spending patterns
        profile['temporal_patterns'] = self._analyze_temporal_patterns(user_transactions)
        
        # Spending behavior indicators
        profile['behavior_indicators'] = self._calculate_behavior_indicators(user_transactions)
        
        # Income estimation (if income transactions available)
        income_transactions = transactions_df[
            (transactions_df['user_id'] == user_id) & 
            (transactions_df['type'] == 'income')
        ]
        
        if len(income_transactions) > 0:
            profile['income_stats'] = {
                'total_income': float(income_transactions['amount'].sum()),
                'avg_monthly_income': float(income_transactions['amount'].sum() / months_of_data),
                'income_frequency': len(income_transactions) / months_of_data
            }
        
        return profile
    
    def _analyze_temporal_patterns(self, transactions_df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze temporal spending patterns"""
        
        df = transactions_df.copy()
        df['day_of_week'] = df['date'].dt.day_name()
        df['day_of_month'] = df['date'].dt.day
        df['month'] = df['date'].dt.month
        df['is_weekend'] = df['date'].dt.weekday >= 5
        
        patterns = {
            'weekly_pattern': df.groupby('day_of_week')['amount'].mean().to_dict(),
            'monthly_pattern': df.groupby('day_of_month')['amount'].mean().to_dict(),
            'seasonal_pattern': df.groupby('month')['amount'].mean().to_dict(),
            'weekend_vs_weekday': {
                'weekend_avg': float(df[df['is_weekend']]['amount'].mean()),
                'weekday_avg': float(df[~df['is_weekend']]['amount'].mean())
            }
        }
        
        # Calculate spending volatility
        daily_spending = df.groupby(df['date'].dt.date)['amount'].sum()
        patterns['spending_volatility'] = float(daily_spending.std() / daily_spending.mean())
        
        return patterns
    
    def _calculate_behavior_indicators(self, transactions_df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate spending behavior indicators"""
        
        df = transactions_df.copy()
        
        indicators = {}
        
        # Impulse spending indicator (high variance in transaction amounts)
        indicators['impulse_spending_score'] = float(df['amount'].std() / df['amount'].mean())
        
        # Large transaction frequency
        large_threshold = df['amount'].quantile(0.9)
        indicators['large_transaction_frequency'] = len(df[df['amount'] > large_threshold]) / len(df)
        
        # Spending consistency (coefficient of variation of monthly spending)
        df['month_year'] = df['date'].dt.to_period('M')
        monthly_spending = df.groupby('month_year')['amount'].sum()
        if len(monthly_spending) > 1:
            indicators['spending_consistency'] = float(monthly_spending.std() / monthly_spending.mean())
        else:
            indicators['spending_consistency'] = 0.0
        
        # Budget adherence proxy (how often spending exceeds typical amounts)
        typical_spending = df['amount'].quantile(0.75)
        indicators['overspending_frequency'] = len(df[df['amount'] > typical_spending * 1.5]) / len(df)
        
        return indicators
    
    def create_user_clusters(self, transactions_df: pd.DataFrame, 
                           categories_df: pd.DataFrame,
                           n_clusters: int = None) -> Dict[str, Any]:
        """Create user clusters based on spending behavior"""
        
        logger.info("Creating user clusters based on spending behavior")
        
        # Get unique users
        users = transactions_df['user_id'].unique()
        
        if len(users) < 5:
            logger.warning("Not enough users for clustering. Need at least 5 users.")
            return {'error': 'Not enough users for clustering'}
        
        # Analyze each user's profile
        user_profiles = []
        for user_id in users:
            profile = self.analyze_user_spending_profile(transactions_df, categories_df, user_id)
            if 'error' not in profile:
                user_profiles.append(profile)
        
        if len(user_profiles) < 5:
            logger.warning("Not enough valid user profiles for clustering")
            return {'error': 'Not enough valid user profiles'}
        
        # Extract features for clustering
        clustering_features = []
        for profile in user_profiles:
            features = [
                profile['spending_stats']['avg_monthly_spending'],
                profile['spending_stats']['spending_variance'],
                profile['spending_stats']['transaction_frequency'],
                profile['behavior_indicators']['impulse_spending_score'],
                profile['behavior_indicators']['spending_consistency'],
                profile['temporal_patterns']['spending_volatility']
            ]
            clustering_features.append(features)
        
        # Scale features
        X = self.scaler.fit_transform(clustering_features)
        
        # Determine optimal number of clusters if not specified
        if n_clusters is None:
            n_clusters = self._find_optimal_clusters(X, max_clusters=min(8, len(users)//2))
        
        # Perform clustering
        self.clustering_model = KMeans(n_clusters=n_clusters, random_state=42)
        cluster_labels = self.clustering_model.fit_predict(X)
        
        # Store user cluster assignments
        self.user_clusters = dict(zip([p['user_id'] for p in user_profiles], cluster_labels))
        
        # Analyze cluster profiles
        self._analyze_cluster_profiles(user_profiles, cluster_labels)
        
        self.is_fitted = True
        
        logger.info(f"Created {n_clusters} user clusters")
        
        return {
            'n_clusters': n_clusters,
            'user_clusters': self.user_clusters,
            'cluster_profiles': self.cluster_profiles
        }
    
    def _find_optimal_clusters(self, X: np.ndarray, max_clusters: int = 8) -> int:
        """Find optimal number of clusters using silhouette score"""
        
        best_score = -1
        best_k = 2
        
        for k in range(2, min(max_clusters + 1, len(X))):
            kmeans = KMeans(n_clusters=k, random_state=42)
            labels = kmeans.fit_predict(X)
            score = silhouette_score(X, labels)
            
            if score > best_score:
                best_score = score
                best_k = k
        
        return best_k
    
    def _analyze_cluster_profiles(self, user_profiles: List[Dict], cluster_labels: np.ndarray):
        """Analyze characteristics of each cluster"""
        
        cluster_data = pd.DataFrame([
            {
                'user_id': profile['user_id'],
                'cluster': label,
                'avg_monthly_spending': profile['spending_stats']['avg_monthly_spending'],
                'spending_variance': profile['spending_stats']['spending_variance'],
                'transaction_frequency': profile['spending_stats']['transaction_frequency'],
                'impulse_score': profile['behavior_indicators']['impulse_spending_score'],
                'consistency': profile['behavior_indicators']['spending_consistency']
            }
            for profile, label in zip(user_profiles, cluster_labels)
        ])
        
        self.cluster_profiles = {}
        
        for cluster_id in cluster_data['cluster'].unique():
            cluster_users = cluster_data[cluster_data['cluster'] == cluster_id]
            
            self.cluster_profiles[cluster_id] = {
                'user_count': len(cluster_users),
                'avg_monthly_spending': float(cluster_users['avg_monthly_spending'].mean()),
                'spending_variance': float(cluster_users['spending_variance'].mean()),
                'transaction_frequency': float(cluster_users['transaction_frequency'].mean()),
                'impulse_score': float(cluster_users['impulse_score'].mean()),
                'consistency': float(cluster_users['consistency'].mean()),
                'spending_level': self._categorize_spending_level(cluster_users['avg_monthly_spending'].mean()),
                'behavior_type': self._categorize_behavior_type(
                    cluster_users['impulse_score'].mean(),
                    cluster_users['consistency'].mean()
                )
            }
    
    def _categorize_spending_level(self, avg_monthly_spending: float) -> str:
        """Categorize spending level"""
        if avg_monthly_spending < 1000:
            return 'low'
        elif avg_monthly_spending < 3000:
            return 'medium'
        else:
            return 'high'
    
    def _categorize_behavior_type(self, impulse_score: float, consistency: float) -> str:
        """Categorize behavior type"""
        if impulse_score > 2.0:
            return 'impulsive'
        elif consistency < 0.3:
            return 'consistent'
        else:
            return 'moderate'
    
    def generate_budget_recommendations(self, transactions_df: pd.DataFrame,
                                      categories_df: pd.DataFrame,
                                      user_id: int,
                                      target_budget: float = None,
                                      budget_style: str = 'balanced') -> Dict[str, Any]:
        """Generate personalized budget recommendations"""
        
        logger.info(f"Generating budget recommendations for user {user_id}")
        
        # Analyze user profile
        user_profile = self.analyze_user_spending_profile(transactions_df, categories_df, user_id)
        
        if 'error' in user_profile:
            return user_profile
        
        # Get user's historical spending
        historical_spending = user_profile['spending_stats']['avg_monthly_spending']
        
        # Determine target budget
        if target_budget is None:
            target_budget = historical_spending * 1.1  # 10% buffer
        
        # Get budget rules based on style
        rules = self.budget_rules.get(budget_style, self.budget_rules['balanced'])
        
        # Generate category-wise recommendations
        category_recommendations = self._generate_category_recommendations(
            user_profile, target_budget, rules
        )
        
        # Generate overall recommendations
        overall_recommendations = self._generate_overall_recommendations(
            user_profile, target_budget, rules
        )
        
        # Calculate savings and emergency fund recommendations
        financial_recommendations = self._generate_financial_recommendations(
            user_profile, target_budget, rules
        )
        
        # Predict future spending needs
        try:
            future_predictions = self.spending_predictor.predict_future_spending(
                transactions_df, user_id, periods_ahead=3, period='month'
            )
        except:
            future_predictions = None
        
        # Generate insights and tips
        insights = self._generate_budget_insights(user_profile, category_recommendations)
        
        return {
            'user_id': user_id,
            'target_budget': target_budget,
            'budget_style': budget_style,
            'category_recommendations': category_recommendations,
            'overall_recommendations': overall_recommendations,
            'financial_recommendations': financial_recommendations,
            'future_predictions': future_predictions,
            'insights': insights,
            'generated_at': datetime.now().isoformat()
        }
    
    def _generate_category_recommendations(self, user_profile: Dict, 
                                         target_budget: float, 
                                         rules: Dict) -> List[Dict[str, Any]]:
        """Generate category-wise budget recommendations"""
        
        recommendations = []
        
        if 'category_breakdown' not in user_profile:
            return recommendations
        
        total_historical = sum(cat['sum'] for cat in user_profile['category_breakdown'])
        
        for category in user_profile['category_breakdown']:
            historical_amount = category['sum']
            historical_percentage = category['percentage']
            
            # Calculate recommended budget based on historical spending and rules
            if 'food' in category['name'].lower():
                # Food typically 25-30% of budget
                recommended_percentage = min(30, historical_percentage * 1.1)
            elif 'transport' in category['name'].lower():
                # Transportation typically 10-15%
                recommended_percentage = min(15, historical_percentage * 1.1)
            elif 'entertainment' in category['name'].lower():
                # Entertainment should be limited
                recommended_percentage = min(10, historical_percentage * 0.9)
            else:
                # Other categories - moderate adjustment
                recommended_percentage = historical_percentage
            
            recommended_amount = (recommended_percentage / 100) * target_budget
            
            recommendations.append({
                'category_name': category['name'],
                'historical_amount': historical_amount,
                'historical_percentage': historical_percentage,
                'recommended_amount': recommended_amount,
                'recommended_percentage': recommended_percentage,
                'adjustment': recommended_amount - historical_amount,
                'priority': self._determine_category_priority(category['name'])
            })
        
        return sorted(recommendations, key=lambda x: x['recommended_amount'], reverse=True)
    
    def _determine_category_priority(self, category_name: str) -> str:
        """Determine priority level for budget category"""
        
        essential_keywords = ['food', 'grocery', 'utilities', 'rent', 'mortgage', 'healthcare']
        important_keywords = ['transport', 'education', 'insurance']
        
        category_lower = category_name.lower()
        
        if any(keyword in category_lower for keyword in essential_keywords):
            return 'essential'
        elif any(keyword in category_lower for keyword in important_keywords):
            return 'important'
        else:
            return 'discretionary'
    
    def _generate_overall_recommendations(self, user_profile: Dict, 
                                        target_budget: float, 
                                        rules: Dict) -> Dict[str, Any]:
        """Generate overall budget recommendations"""
        
        historical_spending = user_profile['spending_stats']['avg_monthly_spending']
        
        return {
            'total_budget': target_budget,
            'budget_change': target_budget - historical_spending,
            'budget_change_percentage': ((target_budget - historical_spending) / historical_spending) * 100,
            'spending_variance_warning': user_profile['behavior_indicators']['spending_consistency'] > 0.5,
            'impulse_spending_warning': user_profile['behavior_indicators']['impulse_spending_score'] > 2.0,
            'recommended_adjustments': self._get_recommended_adjustments(user_profile, rules)
        }
    
    def _generate_financial_recommendations(self, user_profile: Dict, 
                                          target_budget: float, 
                                          rules: Dict) -> Dict[str, Any]:
        """Generate savings and financial recommendations"""
        
        recommendations = {
            'emergency_fund': {
                'target_months': rules['emergency_fund_months'],
                'monthly_amount': target_budget,
                'total_target': target_budget * rules['emergency_fund_months']
            },
            'savings_rate': {
                'recommended_percentage': rules['savings_rate'] * 100,
                'monthly_amount': target_budget * rules['savings_rate']
            }
        }
        
        # Add income-based recommendations if available
        if 'income_stats' in user_profile:
            monthly_income = user_profile['income_stats']['avg_monthly_income']
            
            recommendations['savings_rate']['income_based_amount'] = monthly_income * rules['savings_rate']
            recommendations['budget_vs_income'] = {
                'income': monthly_income,
                'budget': target_budget,
                'surplus_deficit': monthly_income - target_budget,
                'savings_potential': max(0, monthly_income - target_budget)
            }
        
        return recommendations
    
    def _get_recommended_adjustments(self, user_profile: Dict, rules: Dict) -> List[str]:
        """Get specific adjustment recommendations"""
        
        adjustments = []
        
        # Check spending volatility
        if user_profile['temporal_patterns']['spending_volatility'] > 1.0:
            adjustments.append("Consider setting up automatic savings to smooth spending volatility")
        
        # Check impulse spending
        if user_profile['behavior_indicators']['impulse_spending_score'] > 2.0:
            adjustments.append("Set up a separate account for discretionary spending to control impulse purchases")
        
        # Check weekend spending
        weekend_ratio = (user_profile['temporal_patterns']['weekend_vs_weekday']['weekend_avg'] / 
                        user_profile['temporal_patterns']['weekend_vs_weekday']['weekday_avg'])
        
        if weekend_ratio > 1.5:
            adjustments.append("Monitor weekend spending - consider setting a weekend budget limit")
        
        return adjustments
    
    def _generate_budget_insights(self, user_profile: Dict, 
                                category_recommendations: List[Dict]) -> List[str]:
        """Generate insights and tips for budget management"""
        
        insights = []
        
        # Spending pattern insights
        if user_profile['behavior_indicators']['spending_consistency'] < 0.3:
            insights.append("Your spending is quite consistent - this makes budgeting easier!")
        else:
            insights.append("Your spending varies significantly month-to-month. Consider tracking weekly budgets.")
        
        # Category insights
        if category_recommendations:
            top_category = category_recommendations[0]
            insights.append(f"Your largest expense category is {top_category['category_name']} "
                          f"({top_category['historical_percentage']:.1f}% of spending)")
        
        # Behavior insights
        if user_profile['behavior_indicators']['impulse_spending_score'] > 2.0:
            insights.append("You have some large, irregular purchases. Consider planning for these expenses.")
        
        return insights
    
    def save_model(self, filename_prefix: str = 'budget_recommender'):
        """Save trained model to disk"""
        
        if not self.is_fitted:
            raise ValueError("Model not fitted. Cannot save.")
        
        model_path = os.path.join(self.model_path, f'{filename_prefix}_model.pkl')
        metadata_path = os.path.join(self.model_path, f'{filename_prefix}_metadata.pkl')
        
        # Save clustering model
        joblib.dump(self.clustering_model, model_path)
        
        # Save metadata
        metadata = {
            'user_clusters': self.user_clusters,
            'cluster_profiles': self.cluster_profiles,
            'budget_rules': self.budget_rules,
            'trained_at': datetime.now().isoformat(),
            'is_fitted': self.is_fitted
        }
        joblib.dump(metadata, metadata_path)
        
        # Save scaler
        scaler_path = os.path.join(self.model_path, f'{filename_prefix}_scaler.pkl')
        joblib.dump(self.scaler, scaler_path)
        
        logger.info(f"Budget recommendation model saved to {self.model_path}")
    
    def load_model(self, filename_prefix: str = 'budget_recommender'):
        """Load trained model from disk"""
        
        model_path = os.path.join(self.model_path, f'{filename_prefix}_model.pkl')
        metadata_path = os.path.join(self.model_path, f'{filename_prefix}_metadata.pkl')
        scaler_path = os.path.join(self.model_path, f'{filename_prefix}_scaler.pkl')
        
        if all(os.path.exists(path) for path in [model_path, metadata_path, scaler_path]):
            # Load model
            self.clustering_model = joblib.load(model_path)
            
            # Load metadata
            metadata = joblib.load(metadata_path)
            self.user_clusters = metadata['user_clusters']
            self.cluster_profiles = metadata['cluster_profiles']
            self.budget_rules = metadata.get('budget_rules', self.budget_rules)
            self.is_fitted = metadata['is_fitted']
            
            # Load scaler
            self.scaler = joblib.load(scaler_path)
            
            logger.info(f"Budget recommendation model loaded from {self.model_path}")
            
        else:
            logger.warning("Model files not found. Cannot load.")