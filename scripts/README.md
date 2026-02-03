# Python Utilities - Review Intelligence Platform

This directory contains Python utilities for data processing, AI integration, and analysis for the Review Intelligence Platform.

## Overview

The Python scripts demonstrate full-stack capabilities including:
- **Data Processing**: ETL pipelines for importing/exporting reviews and products
- **AI Integration**: Wrapper for Ollama LLM API for generating insights
- **NLP Analysis**: Sentiment analysis and topic extraction from reviews
- **Configuration Management**: Centralized settings and constants

## Scripts

### 1. `review_analyzer.py`
Sentiment analysis and review processing utility.

**Features:**
- Sentiment classification (positive/negative/mixed)
- Topic extraction using regex and frequency analysis
- Metrics calculation (average rating, distribution, trends)
- Review summary generation
- Batch JSONL file processing

**Usage:**
```python
from review_analyzer import ReviewAnalyzer

analyzer = ReviewAnalyzer()

# Analyze sentiment
result = analyzer.analyze_sentiment([
    "This product is amazing!",
    "Terrible quality, waste of money"
])
print(result)  # {'positive': 1, 'negative': 1, 'mixed': 0}

# Extract topics
topics = analyzer._extract_topics([
    "Great quality and fast shipping",
    "Good price but slow delivery"
])
print(topics)  # [('quality', 2), ('shipping', 2), ...]

# Calculate metrics
reviews_data = [
    {"text": "Excellent product", "rating": 5},
    {"text": "Not bad", "rating": 4}
]
metrics = analyzer.calculate_metrics(reviews_data)
print(metrics)  # ReviewMetrics(avg_rating=4.5, total_reviews=2, ...)
```

**Key Classes:**
- `ReviewAnalyzer`: Main analysis engine
- `ReviewMetrics`: Dataclass for storing metrics
- Sentiment keyword dictionaries for NLP

### 2. `ollama_integration.py`
Python client for Ollama LLM integration.

**Features:**
- Model listing and availability checking
- Text generation with configurable models
- Chat interface with conversation history
- Product review analysis and insights
- Streaming support for long responses
- Error handling with timeouts and fallbacks

**Usage:**
```python
from ollama_integration import OllamaClient, ProductReviewAnalyzer

# Basic text generation
client = OllamaClient()
if client.is_available():
    result = client.generate("What are the best features of a laptop?")
    print(result['response'])

# Chat interface
messages = [
    {"role": "user", "content": "What makes a good product?"}
]
response = client.chat(messages)
print(response['message']['content'])

# Product insights
analyzer = ProductReviewAnalyzer()
insights = analyzer.generate_insights(
    product_name="USB-C Cable",
    reviews=["Fast charging", "Good quality", "Durable"],
    avg_rating=4.5,
    review_count=250
)
print(insights)

# Answer questions
answer = analyzer.answer_question(
    product_name="Laptop",
    question="Is this laptop good for gaming?",
    reviews=[...]
)
```

**Key Classes:**
- `OllamaClient`: Low-level API wrapper
- `OllamaConfig`: Configuration dataclass
- `ProductReviewAnalyzer`: High-level analysis interface

**Requirements:**
- Ollama running at `http://localhost:11434`
- `llama3.2` model (or configure differently in Config)

### 3. `data_import.py`
ETL (Extract, Transform, Load) utility for data processing.

**Features:**
- Import from JSON, JSONL, and CSV formats
- Export to JSON, JSONL, and CSV formats
- Data merging with duplicate detection
- Statistics calculation
- Dataclass models for type safety
- Batch processing support

**Usage:**
```python
from data_import import DataImporter, Product, Review

importer = DataImporter(data_dir="data")

# Import products
products = importer.import_json_products("data/fakestore.json")
print(f"Loaded {len(products)} products")

# Import reviews
reviews = importer.import_jsonl_reviews("data/reviews.jsonl")
print(f"Loaded {len(reviews)} reviews")

# Calculate statistics
stats = importer.get_statistics(reviews)
print(f"Average rating: {stats['average_rating']:.2f}/5")
print(f"Rating distribution: {stats['rating_distribution']}")

# Export data
importer.export_products_json(products, "products_export.json")
importer.export_reviews_jsonl(reviews, "reviews_export.jsonl")

# Merge multiple review files
merged = importer.merge_reviews(
    "data/reviews.jsonl",
    "data/additional_reviews.jsonl"
)
```

**Key Classes:**
- `DataImporter`: Main ETL engine
- `Product`: Dataclass for product data
- `Review`: Dataclass for review data

**Supported Formats:**
- **JSON**: Array of product objects
- **JSONL**: One JSON object per line (reviews)
- **CSV**: Comma-separated values with headers

### 4. `config.py`
Centralized configuration and constants.

**Features:**
- Environment configuration (dev/staging/production)
- Ollama settings
- Database connection details
- API endpoint definitions
- Sentiment analysis keywords
- Logging configuration
- Performance tuning options
- Security settings

**Usage:**
```python
from config import Config, SentimentKeywords, APIEndpoints

# Check environment
if Config.is_development():
    print("Running in development mode")

# Get database URL
db_url = Config.get_db_url()

# Access sentiment keywords
positive_words = SentimentKeywords.POSITIVE_KEYWORDS
negative_words = SentimentKeywords.NEGATIVE_KEYWORDS

# Get API endpoints
products_endpoint = APIEndpoints.PRODUCTS
```

**Configuration Classes:**
- `Config`: Main configuration
- `Environment`: Enum for deployment environment
- `SentimentKeywords`: NLP word lists
- `APIEndpoints`: API route constants
- `ResponseMessages`: Standard response texts
- `LogConfig`: Logging settings
- `PerformanceConfig`: Optimization settings
- `SecurityConfig`: Security policies

## Architecture

```
scripts/
├── config.py              # Centralized configuration
├── review_analyzer.py     # NLP and sentiment analysis
├── ollama_integration.py  # AI/LLM integration
├── data_import.py         # ETL and data processing
├── bulk_import_jsonl.mjs  # Node.js bulk import (existing)
└── README.md              # This file
```

### Data Flow

```
Raw Data (JSON/JSONL/CSV)
    ↓
Data Import (data_import.py)
    ↓
Data Processing (review_analyzer.py)
    ↓
Analysis & Insights (ollama_integration.py)
    ↓
API Response (Next.js Routes)
```

## Setup

### Requirements
- Python 3.9+
- Ollama (for AI features)
- Existing project data files

### Installation

1. **Python Dependencies** (minimal):
```bash
# Most modules use only standard library
# Optional: requests (for Ollama integration)
pip install requests
```

2. **Ollama Setup**:
```bash
# Install Ollama from https://ollama.ai
# Pull the model
ollama pull llama3.2

# Start Ollama server (runs on localhost:11434)
ollama serve
```

3. **Project Data**:
Ensure these files exist in the `data/` directory:
- `fakestore.json` - Product catalog
- `reviews.jsonl` - Review data

## Usage Examples

### Example 1: Analyze Reviews and Generate Insights
```python
from review_analyzer import ReviewAnalyzer
from data_import import DataImporter

# Load reviews
importer = DataImporter()
reviews_data = importer.import_jsonl_reviews("data/reviews.jsonl")

# Analyze
analyzer = ReviewAnalyzer()
metrics = analyzer.calculate_metrics([
    {"text": r.text, "rating": r.rating} 
    for r in reviews_data
])

print(f"Average Rating: {metrics.avg_rating:.2f}/5")
print(f"Sentiment: {metrics.sentiment_summary}")
```

### Example 2: Generate AI-Powered Product Insights
```python
from ollama_integration import ProductReviewAnalyzer
from data_import import DataImporter

importer = DataImporter()
reviews = importer.import_jsonl_reviews("data/reviews.jsonl")

analyzer = ProductReviewAnalyzer()
insights = analyzer.generate_insights(
    product_name="Test Product",
    reviews=[r.text for r in reviews],
    avg_rating=4.2,
    review_count=len(reviews)
)

print(insights)
```

### Example 3: Data Migration and Export
```python
from data_import import DataImporter

importer = DataImporter()

# Load from multiple sources
products = importer.import_json_products("data/fakestore.json")
reviews = importer.import_jsonl_reviews("data/reviews.jsonl")

# Export in different format
importer.export_reviews_csv(reviews, "reviews_backup.csv")

# Get statistics
stats = importer.get_statistics(reviews)
```

## Integration with Next.js API Routes

These Python utilities can be integrated with Next.js API routes:

```typescript
// app/api/summarize/route.ts
import { exec } from 'child_process';

export async function POST(request: Request) {
    const { productId, reviews } = await request.json();
    
    // Call Python utility
    exec(`python scripts/review_analyzer.py`, (error, stdout) => {
        if (error) return { error };
        return { summary: stdout };
    });
}
```

## Performance Considerations

- **Batch Processing**: Process reviews in batches of 100+ for efficiency
- **Caching**: Cache Ollama responses for repeated queries
- **Async Operations**: Use async/await when calling from Node.js
- **Memory**: Load full JSONL files into memory efficiently

## Troubleshooting

**Ollama Connection Issues:**
```python
from ollama_integration import OllamaClient

client = OllamaClient()
if not client.is_available():
    print("Ollama not running. Start with: ollama serve")
```

**File Not Found:**
```python
from pathlib import Path
from config import DATA_DIR

# Verify data directory
print(f"Data directory: {DATA_DIR}")
print(f"Contents: {list(DATA_DIR.glob('*'))}")
```

**Import Errors:**
```bash
# Ensure Python 3.9+ and requests library
python --version
pip install requests
```

## Portfolio Value

These utilities demonstrate:
- ✅ **Python Proficiency**: Type hints, dataclasses, enum patterns
- ✅ **Data Engineering**: ETL pipelines, multiple format support
- ✅ **NLP/ML**: Sentiment analysis, text processing
- ✅ **API Integration**: REST client design, error handling
- ✅ **Configuration Management**: Environment-based settings
- ✅ **Full-Stack Development**: Python backend + Next.js frontend
- ✅ **Production Practices**: Logging, error handling, documentation

## Future Enhancements

- Database integration (PostgreSQL)
- Async I/O with asyncio
- Data validation and sanitization
- Caching layer for performance
- Webhook integration for real-time updates
- Advanced NLP with spaCy/NLTK
- Rate limiting and authentication
- Comprehensive logging
- Unit tests and CI/CD

## License

Same as Review Intelligence Platform
