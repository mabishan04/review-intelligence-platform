#!/usr/bin/env python3
"""
Review Analyzer - Analyzes product reviews and extracts insights
Demonstrates NLP and data processing capabilities
"""

import json
import re
from collections import Counter
from typing import List, Dict, Any
from dataclasses import dataclass


@dataclass
class ReviewMetrics:
    """Data class for review metrics"""
    avg_rating: float
    total_reviews: int
    rating_distribution: Dict[int, int]
    common_topics: List[str]
    sentiment_summary: str


class ReviewAnalyzer:
    """Analyzes product reviews to extract insights and patterns"""

    # Common positive and negative keywords for sentiment analysis
    POSITIVE_KEYWORDS = {
        'excellent', 'great', 'amazing', 'fantastic', 'wonderful',
        'love', 'perfect', 'best', 'outstanding', 'beautiful',
        'fast', 'reliable', 'quality', 'worth', 'recommend'
    }
    
    NEGATIVE_KEYWORDS = {
        'poor', 'bad', 'terrible', 'awful', 'horrible',
        'hate', 'worst', 'broken', 'disappointing', 'waste',
        'slow', 'cheap', 'problem', 'issue', 'defective'
    }

    def __init__(self):
        """Initialize the review analyzer"""
        self.reviews = []

    def load_reviews_from_json(self, filepath: str) -> None:
        """Load reviews from JSONL file"""
        try:
            with open(filepath, 'r') as f:
                for line in f:
                    if line.strip():
                        self.reviews.append(json.loads(line))
            print(f"✓ Loaded {len(self.reviews)} reviews from {filepath}")
        except FileNotFoundError:
            print(f"✗ File not found: {filepath}")
        except json.JSONDecodeError as e:
            print(f"✗ Invalid JSON format: {e}")

    def calculate_metrics(self, product_id: int = None) -> ReviewMetrics:
        """Calculate comprehensive review metrics"""
        reviews_to_analyze = self.reviews
        
        if product_id:
            reviews_to_analyze = [r for r in self.reviews if r.get('product_id') == product_id]

        if not reviews_to_analyze:
            return ReviewMetrics(0, 0, {}, [], "No reviews found")

        # Calculate average rating
        ratings = [r.get('rating', 0) for r in reviews_to_analyze if r.get('rating')]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0

        # Rating distribution
        rating_dist = Counter(ratings)
        rating_distribution = {i: rating_dist.get(i, 0) for i in range(1, 6)}

        # Extract common topics
        common_topics = self._extract_topics(reviews_to_analyze)

        # Sentiment analysis
        sentiment = self._analyze_sentiment(reviews_to_analyze)

        return ReviewMetrics(
            avg_rating=round(avg_rating, 2),
            total_reviews=len(reviews_to_analyze),
            rating_distribution=rating_distribution,
            common_topics=common_topics[:5],
            sentiment_summary=sentiment
        )

    def _extract_topics(self, reviews: List[Dict]) -> List[str]:
        """Extract common topics from review text"""
        all_words = []
        
        for review in reviews:
            text = review.get('review_text', '').lower()
            # Remove special characters and split
            words = re.findall(r'\b\w+\b', text)
            all_words.extend(words)

        # Filter out common stop words
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'is', 'was', 'are', 'be', 'been', 'it', 'this', 'that', 'with'
        }
        
        filtered_words = [w for w in all_words if w not in stop_words and len(w) > 3]
        word_freq = Counter(filtered_words)
        
        return [word for word, _ in word_freq.most_common(10)]

    def _analyze_sentiment(self, reviews: List[Dict]) -> str:
        """Analyze overall sentiment of reviews"""
        positive_count = 0
        negative_count = 0

        for review in reviews:
            text = review.get('review_text', '').lower()
            rating = review.get('rating', 0)

            pos_matches = sum(1 for word in self.POSITIVE_KEYWORDS if word in text)
            neg_matches = sum(1 for word in self.NEGATIVE_KEYWORDS if word in text)

            if rating >= 4 or pos_matches > neg_matches:
                positive_count += 1
            elif rating <= 2 or neg_matches > pos_matches:
                negative_count += 1

        total = positive_count + negative_count
        if total == 0:
            return "Neutral"
        
        positive_pct = (positive_count / total) * 100
        
        if positive_pct >= 70:
            return f"Very Positive ({positive_pct:.0f}%)"
        elif positive_pct >= 50:
            return f"Positive ({positive_pct:.0f}%)"
        elif positive_pct >= 30:
            return f"Mixed ({positive_pct:.0f}%)"
        else:
            return f"Negative ({positive_pct:.0f}%)"

    def generate_summary(self, product_id: int = None) -> Dict[str, Any]:
        """Generate a complete review summary"""
        metrics = self.calculate_metrics(product_id)
        
        return {
            "averageRating": metrics.avg_rating,
            "totalReviews": metrics.total_reviews,
            "ratingDistribution": metrics.rating_distribution,
            "commonTopics": metrics.common_topics,
            "sentimentAnalysis": metrics.sentiment_summary,
            "recommendationStrength": self._get_recommendation_strength(metrics.avg_rating)
        }

    def _get_recommendation_strength(self, rating: float) -> str:
        """Get recommendation strength based on rating"""
        if rating >= 4.5:
            return "Highly Recommended"
        elif rating >= 4.0:
            return "Recommended"
        elif rating >= 3.0:
            return "Moderately Recommended"
        else:
            return "Not Recommended"

    def print_summary(self, product_id: int = None) -> None:
        """Print formatted review summary"""
        summary = self.generate_summary(product_id)
        
        print("\n" + "="*50)
        print("REVIEW ANALYSIS SUMMARY")
        print("="*50)
        print(f"Average Rating: {summary['averageRating']}/5.0")
        print(f"Total Reviews: {summary['totalReviews']}")
        print(f"Sentiment: {summary['sentimentAnalysis']}")
        print(f"Recommendation: {summary['recommendationStrength']}")
        print(f"\nRating Distribution:")
        for rating, count in summary['ratingDistribution'].items():
            bar = "█" * count
            print(f"  {rating}★ ({count:2d}) {bar}")
        print(f"\nCommon Topics: {', '.join(summary['commonTopics'])}")
        print("="*50 + "\n")


if __name__ == "__main__":
    # Example usage
    analyzer = ReviewAnalyzer()
    
    # Load reviews from the data file
    analyzer.load_reviews_from_json("data/reviews.jsonl")
    
    # Generate analysis for all reviews
    if analyzer.reviews:
        analyzer.print_summary()
        
        # Save summary to JSON
        summary = analyzer.generate_summary()
        with open("review_analysis.json", "w") as f:
            json.dump(summary, f, indent=2)
        print("✓ Summary saved to review_analysis.json")
