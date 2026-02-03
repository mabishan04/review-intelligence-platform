#!/usr/bin/env python3
"""
Data Import Utility - ETL pipeline for reviews and products
Demonstrates data processing and file I/O operations
"""

import json
import csv
import os
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict
from datetime import datetime


@dataclass
class Product:
    """Product data model"""
    id: int
    title: str
    price: float
    description: str
    category: str
    image: str
    rating: float = 0.0
    review_count: int = 0


@dataclass
class Review:
    """Review data model"""
    id: str
    product_id: int
    rating: int
    text: str
    reviewer: str
    date: str
    helpful_votes: int = 0


class DataImporter:
    """Import and process product and review data"""

    def __init__(self, data_dir: str = "data"):
        """Initialize importer with data directory"""
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)

    def import_json_products(self, file_path: str) -> List[Product]:
        """
        Import products from JSON file
        
        Args:
            file_path: Path to JSON file containing products
            
        Returns:
            List of Product objects
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            products = []
            items = data if isinstance(data, list) else data.get('products', [])
            
            for item in items:
                product = Product(
                    id=item.get('id', 0),
                    title=item.get('title', ''),
                    price=float(item.get('price', 0)),
                    description=item.get('description', ''),
                    category=item.get('category', 'uncategorized'),
                    image=item.get('image', ''),
                    rating=float(item.get('rating', 0)),
                    review_count=int(item.get('review_count', 0))
                )
                products.append(product)
            
            return products
            
        except FileNotFoundError:
            print(f"Error: File not found - {file_path}")
            return []
        except json.JSONDecodeError:
            print(f"Error: Invalid JSON in {file_path}")
            return []
        except Exception as e:
            print(f"Error importing products: {e}")
            return []

    def import_jsonl_reviews(self, file_path: str) -> List[Review]:
        """
        Import reviews from JSONL file (one JSON object per line)
        
        Args:
            file_path: Path to JSONL file containing reviews
            
        Returns:
            List of Review objects
        """
        reviews = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    try:
                        if line.strip():
                            item = json.loads(line)
                            review = Review(
                                id=item.get('id', f'review_{line_num}'),
                                product_id=int(item.get('product_id', 0)),
                                rating=int(item.get('rating', 0)),
                                text=item.get('text', ''),
                                reviewer=item.get('reviewer', 'Anonymous'),
                                date=item.get('date', datetime.now().isoformat()),
                                helpful_votes=int(item.get('helpful_votes', 0))
                            )
                            reviews.append(review)
                    except json.JSONDecodeError as e:
                        print(f"Warning: Invalid JSON on line {line_num}: {e}")
                        continue
            
            return reviews
            
        except FileNotFoundError:
            print(f"Error: File not found - {file_path}")
            return []
        except Exception as e:
            print(f"Error importing reviews: {e}")
            return []

    def import_csv_reviews(self, file_path: str) -> List[Review]:
        """
        Import reviews from CSV file
        
        Expected columns: id, product_id, rating, text, reviewer, date
        
        Args:
            file_path: Path to CSV file
            
        Returns:
            List of Review objects
        """
        reviews = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                if reader.fieldnames is None:
                    print("Error: Empty CSV file")
                    return []
                
                for row in reader:
                    try:
                        review = Review(
                            id=row.get('id', ''),
                            product_id=int(row.get('product_id', 0)),
                            rating=int(row.get('rating', 0)),
                            text=row.get('text', ''),
                            reviewer=row.get('reviewer', 'Anonymous'),
                            date=row.get('date', datetime.now().isoformat()),
                            helpful_votes=int(row.get('helpful_votes', 0))
                        )
                        reviews.append(review)
                    except (ValueError, KeyError) as e:
                        print(f"Warning: Error processing row: {e}")
                        continue
            
            return reviews
            
        except FileNotFoundError:
            print(f"Error: File not found - {file_path}")
            return []
        except Exception as e:
            print(f"Error importing CSV: {e}")
            return []

    def export_products_json(self, products: List[Product], file_name: str = "products.json") -> bool:
        """
        Export products to JSON file
        
        Args:
            products: List of Product objects
            file_name: Output file name
            
        Returns:
            True if successful, False otherwise
        """
        try:
            file_path = self.data_dir / file_name
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(
                    [asdict(p) for p in products],
                    f,
                    indent=2,
                    ensure_ascii=False
                )
            
            print(f"✓ Exported {len(products)} products to {file_path}")
            return True
            
        except Exception as e:
            print(f"Error exporting products: {e}")
            return False

    def export_reviews_jsonl(self, reviews: List[Review], file_name: str = "reviews.jsonl") -> bool:
        """
        Export reviews to JSONL file
        
        Args:
            reviews: List of Review objects
            file_name: Output file name
            
        Returns:
            True if successful, False otherwise
        """
        try:
            file_path = self.data_dir / file_name
            
            with open(file_path, 'w', encoding='utf-8') as f:
                for review in reviews:
                    f.write(json.dumps(asdict(review), ensure_ascii=False) + '\n')
            
            print(f"✓ Exported {len(reviews)} reviews to {file_path}")
            return True
            
        except Exception as e:
            print(f"Error exporting reviews: {e}")
            return False

    def export_reviews_csv(self, reviews: List[Review], file_name: str = "reviews.csv") -> bool:
        """
        Export reviews to CSV file
        
        Args:
            reviews: List of Review objects
            file_name: Output file name
            
        Returns:
            True if successful, False otherwise
        """
        try:
            file_path = self.data_dir / file_name
            
            with open(file_path, 'w', newline='', encoding='utf-8') as f:
                fieldnames = ['id', 'product_id', 'rating', 'text', 'reviewer', 'date', 'helpful_votes']
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                
                writer.writeheader()
                for review in reviews:
                    writer.writerow(asdict(review))
            
            print(f"✓ Exported {len(reviews)} reviews to {file_path}")
            return True
            
        except Exception as e:
            print(f"Error exporting to CSV: {e}")
            return False

    def merge_reviews(self, *file_paths: str) -> List[Review]:
        """
        Merge reviews from multiple files
        
        Args:
            *file_paths: Variable number of file paths to merge
            
        Returns:
            Combined list of Review objects
        """
        all_reviews = []
        
        for file_path in file_paths:
            if file_path.endswith('.jsonl'):
                reviews = self.import_jsonl_reviews(file_path)
            elif file_path.endswith('.csv'):
                reviews = self.import_csv_reviews(file_path)
            else:
                print(f"Warning: Unsupported file format - {file_path}")
                continue
            
            all_reviews.extend(reviews)
        
        # Remove duplicates based on review ID
        unique_reviews = {}
        for review in all_reviews:
            if review.id not in unique_reviews:
                unique_reviews[review.id] = review
        
        return list(unique_reviews.values())

    def get_statistics(self, reviews: List[Review]) -> Dict[str, Any]:
        """
        Calculate statistics from reviews
        
        Args:
            reviews: List of Review objects
            
        Returns:
            Dictionary with review statistics
        """
        if not reviews:
            return {
                'total_reviews': 0,
                'average_rating': 0,
                'rating_distribution': {}
            }
        
        ratings = [r.rating for r in reviews]
        rating_dist = {}
        for rating in ratings:
            rating_dist[rating] = rating_dist.get(rating, 0) + 1
        
        return {
            'total_reviews': len(reviews),
            'average_rating': sum(ratings) / len(ratings),
            'min_rating': min(ratings),
            'max_rating': max(ratings),
            'rating_distribution': rating_dist,
            'total_helpful_votes': sum(r.helpful_votes for r in reviews),
            'average_text_length': sum(len(r.text) for r in reviews) / len(reviews)
        }


if __name__ == "__main__":
    print("📊 Data Import Utility\n")
    
    importer = DataImporter()
    
    # Example 1: Import products from JSON
    print("Importing products...")
    products = importer.import_json_products("data/fakestore.json")
    if products:
        print(f"✓ Imported {len(products)} products")
        print(f"  First product: {products[0].title} (${products[0].price})")
    
    # Example 2: Import reviews from JSONL
    print("\nImporting reviews...")
    reviews = importer.import_jsonl_reviews("data/reviews.jsonl")
    if reviews:
        print(f"✓ Imported {len(reviews)} reviews")
        
        # Calculate statistics
        stats = importer.get_statistics(reviews)
        print(f"  Average rating: {stats['average_rating']:.2f}/5")
        print(f"  Rating distribution: {stats['rating_distribution']}")
    
    # Example 3: Export merged data
    if products and reviews:
        print("\nExporting data...")
        importer.export_products_json(products)
        importer.export_reviews_jsonl(reviews)
