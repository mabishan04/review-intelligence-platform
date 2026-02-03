#!/usr/bin/env python3
"""
Configuration and Constants - Central hub for the Python utilities
Demonstrates configuration management and constants organization
"""

from pathlib import Path
from typing import Dict, List
from enum import Enum


# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
SCRIPTS_DIR = PROJECT_ROOT / "scripts"


class Environment(Enum):
    """Application environment"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class Config:
    """Application configuration"""
    
    # Current environment
    ENVIRONMENT = Environment.DEVELOPMENT
    
    # Ollama configuration
    OLLAMA_HOST = "http://localhost"
    OLLAMA_PORT = 11434
    OLLAMA_MODEL = "llama3.2"
    OLLAMA_TIMEOUT = 60
    
    # Data configuration
    DATA_DIRECTORY = str(DATA_DIR)
    PRODUCTS_FILE = "fakestore.json"
    REVIEWS_FILE = "reviews.jsonl"
    BATCH_SIZE = 100
    
    # Database configuration (when PostgreSQL is available)
    DB_HOST = "localhost"
    DB_PORT = 5432
    DB_NAME = "review_intelligence"
    DB_USER = "postgres"
    DB_PASSWORD = ""  # Set from environment variable
    
    # API configuration
    API_TIMEOUT = 30
    MAX_RETRIES = 3
    RETRY_DELAY = 1
    
    # Review analysis configuration
    MIN_REVIEW_LENGTH = 10  # Minimum characters for a valid review
    MAX_REVIEW_LENGTH = 5000  # Maximum characters for processing
    SENTIMENT_THRESHOLD = 0.6  # Threshold for positive/negative classification
    
    # Model configuration
    MIN_PRODUCT_RATING = 1
    MAX_PRODUCT_RATING = 5
    REVIEW_CATEGORIES = [
        "quality",
        "delivery",
        "customer_service",
        "packaging",
        "value_for_money"
    ]
    
    @classmethod
    def is_production(cls) -> bool:
        """Check if running in production"""
        return cls.ENVIRONMENT == Environment.PRODUCTION
    
    @classmethod
    def is_development(cls) -> bool:
        """Check if running in development"""
        return cls.ENVIRONMENT == Environment.DEVELOPMENT
    
    @classmethod
    def get_db_url(cls) -> str:
        """Get database connection URL"""
        if cls.DB_PASSWORD:
            return f"postgresql://{cls.DB_USER}:{cls.DB_PASSWORD}@{cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}"
        else:
            return f"postgresql://{cls.DB_USER}@{cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}"


class SentimentKeywords:
    """Keywords for sentiment analysis"""
    
    POSITIVE_KEYWORDS: List[str] = [
        "excellent", "great", "amazing", "wonderful", "perfect",
        "love", "fantastic", "brilliant", "awesome", "outstanding",
        "good", "nice", "quality", "satisfied", "happy",
        "recommend", "worth", "impressed", "best", "highly",
        "super", "beautiful", "fast", "reliable", "durable"
    ]
    
    NEGATIVE_KEYWORDS: List[str] = [
        "terrible", "awful", "horrible", "bad", "waste",
        "disappointed", "disappointing", "poor", "worst", "useless",
        "broken", "defective", "cheap", "slow", "unreliable",
        "hate", "never", "worse", "avoid", "regret",
        "overpriced", "damaged", "faulty", "fail", "scam"
    ]
    
    NEUTRAL_KEYWORDS: List[str] = [
        "average", "okay", "acceptable", "standard", "normal",
        "decent", "alright", "fine", "mediocre", "so-so"
    ]


class APIEndpoints:
    """API endpoint configurations"""
    
    # Internal API routes
    PRODUCTS = "/api/products"
    PRODUCTS_BY_ID = "/api/products/{id}"
    CATALOG = "/api/catalog"
    REVIEWS = "/api/reviews"
    SUMMARIZE = "/api/summarize"
    SHOPPING_ASSISTANT = "/api/shopping-assistant"
    FIND_PRODUCT = "/api/find-product"
    INGEST = "/api/ingest"


class ResponseMessages:
    """Standardized response messages"""
    
    MESSAGES: Dict[str, str] = {
        "success": "Operation completed successfully",
        "error": "An error occurred",
        "not_found": "Resource not found",
        "invalid_input": "Invalid input provided",
        "server_error": "Internal server error",
        "timeout": "Request timeout",
        "no_reviews": "No reviews available for this product",
        "insufficient_data": "Insufficient data to generate analysis",
        "ollama_unavailable": "AI service unavailable, please try again later"
    }
    
    @classmethod
    def get(cls, key: str, default: str = "Unknown error") -> str:
        """Get a message by key"""
        return cls.MESSAGES.get(key, default)


class LogConfig:
    """Logging configuration"""
    
    # Log levels
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"
    
    # Default log level
    LEVEL = DEBUG if Config.is_development() else INFO
    
    # Log file path
    LOG_FILE = SCRIPTS_DIR / "app.log"
    
    # Log format
    FORMAT = "[%(asctime)s] %(levelname)s - %(name)s - %(message)s"
    DATE_FORMAT = "%Y-%m-%d %H:%M:%S"
    
    # Maximum log file size (in bytes)
    MAX_SIZE = 10 * 1024 * 1024  # 10 MB
    
    # Number of backup files to keep
    BACKUP_COUNT = 5


class PerformanceConfig:
    """Performance optimization settings"""
    
    # Cache configuration
    CACHE_ENABLED = True
    CACHE_TTL = 3600  # seconds
    
    # Batch processing
    BATCH_SIZE = 100
    BATCH_TIMEOUT = 30
    
    # Connection pool
    POOL_SIZE = 10
    POOL_MAX_OVERFLOW = 20
    POOL_TIMEOUT = 30
    
    # Request settings
    REQUEST_TIMEOUT = 30
    KEEPALIVE_TIMEOUT = 60


class SecurityConfig:
    """Security settings"""
    
    # Input validation
    MAX_INPUT_LENGTH = 10000
    ALLOWED_FILE_EXTENSIONS = ['.json', '.jsonl', '.csv']
    
    # Rate limiting
    RATE_LIMIT_ENABLED = True
    REQUESTS_PER_MINUTE = 60
    
    # CORS
    CORS_ORIGINS = ["http://localhost:3000", "http://localhost:3001"]
    
    # API Key (for future authentication)
    API_KEY_REQUIRED = False


# Export commonly used items
__all__ = [
    'Config',
    'Environment',
    'SentimentKeywords',
    'APIEndpoints',
    'ResponseMessages',
    'LogConfig',
    'PerformanceConfig',
    'SecurityConfig',
    'PROJECT_ROOT',
    'DATA_DIR',
    'SCRIPTS_DIR'
]


if __name__ == "__main__":
    print("⚙️  Configuration Module\n")
    
    print(f"Environment: {Config.ENVIRONMENT.value}")
    print(f"Data Directory: {Config.DATA_DIRECTORY}")
    print(f"Ollama Model: {Config.OLLAMA_MODEL}")
    print(f"Database: {Config.get_db_url()}\n")
    
    print("Positive Sentiment Keywords:")
    print(f"  {', '.join(SentimentKeywords.POSITIVE_KEYWORDS[:10])}...")
    
    print("\nNegative Sentiment Keywords:")
    print(f"  {', '.join(SentimentKeywords.NEGATIVE_KEYWORDS[:10])}...")
    
    print("\nAPI Endpoints:")
    for key, value in APIEndpoints.__dict__.items():
        if not key.startswith('_'):
            print(f"  {key}: {value}")
