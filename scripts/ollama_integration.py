#!/usr/bin/env python3
"""
Ollama Integration Utility - Python wrapper for Ollama LLM API
Demonstrates API integration and AI/ML capabilities
"""

import requests
import json
from typing import Optional, Dict, Any
from dataclasses import dataclass


@dataclass
class OllamaConfig:
    """Configuration for Ollama connection"""
    host: str = "http://localhost"
    port: int = 11434
    model: str = "llama3.2"
    
    @property
    def base_url(self) -> str:
        """Get the base URL for Ollama API"""
        return f"{self.host}:{self.port}"


class OllamaClient:
    """Client for interacting with Ollama LLM"""

    def __init__(self, config: Optional[OllamaConfig] = None):
        """Initialize Ollama client with configuration"""
        self.config = config or OllamaConfig()
        self.base_url = self.config.base_url

    def is_available(self) -> bool:
        """Check if Ollama server is available"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=2)
            return response.status_code == 200
        except (requests.ConnectionError, requests.Timeout):
            return False

    def list_models(self) -> list[str]:
        """List all available models in Ollama"""
        try:
            response = requests.get(f"{self.base_url}/api/tags")
            if response.status_code == 200:
                data = response.json()
                return [model['name'] for model in data.get('models', [])]
            return []
        except Exception as e:
            print(f"Error listing models: {e}")
            return []

    def generate(
        self, 
        prompt: str, 
        model: Optional[str] = None,
        stream: bool = False
    ) -> Dict[str, Any]:
        """
        Generate text using Ollama
        
        Args:
            prompt: Input prompt for the model
            model: Model name (uses default if not specified)
            stream: Whether to stream the response
            
        Returns:
            Dictionary with model response
        """
        model = model or self.config.model
        
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": stream
                },
                timeout=60
            )
            
            if response.status_code == 200:
                if stream:
                    return self._parse_stream(response)
                else:
                    return response.json()
            else:
                return {"error": f"API returned status {response.status_code}"}
                
        except requests.Timeout:
            return {"error": "Request timeout - Ollama may be overloaded"}
        except requests.ConnectionError:
            return {"error": "Cannot connect to Ollama server"}
        except Exception as e:
            return {"error": f"Unexpected error: {str(e)}"}

    def chat(
        self,
        messages: list[Dict[str, str]],
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Chat with Ollama using conversation history
        
        Args:
            messages: List of messages with 'role' and 'content'
            model: Model name (uses default if not specified)
            
        Returns:
            Dictionary with model response
        """
        model = model or self.config.model
        
        try:
            response = requests.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": model,
                    "messages": messages,
                    "stream": False
                },
                timeout=60
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"API returned status {response.status_code}"}
                
        except Exception as e:
            return {"error": str(e)}

    def analyze_product_reviews(
        self,
        product_name: str,
        reviews: list[str],
        context: Optional[str] = None
    ) -> str:
        """
        Use Ollama to analyze product reviews and generate insights
        
        Args:
            product_name: Name of the product
            reviews: List of review texts
            context: Additional context about the product
            
        Returns:
            AI-generated analysis of reviews
        """
        reviews_text = "\n".join([f"- {review}" for review in reviews[:5]])
        
        prompt = f"""Analyze the following reviews for {product_name} and provide:
1. Overall sentiment summary
2. Top 3 positive aspects mentioned
3. Top 3 negative aspects mentioned
4. Final recommendation

Reviews:
{reviews_text}

{f"Context: {context}" if context else ""}

Provide a concise, professional analysis."""

        result = self.generate(prompt)
        
        if "response" in result:
            return result["response"]
        else:
            return result.get("error", "Failed to generate analysis")

    def _parse_stream(self, response) -> Dict[str, Any]:
        """Parse streamed response from Ollama"""
        full_response = ""
        for line in response.iter_lines():
            if line:
                data = json.loads(line)
                if "response" in data:
                    full_response += data["response"]
        
        return {"response": full_response}


class ProductReviewAnalyzer:
    """High-level interface for analyzing product reviews with Ollama"""

    def __init__(self, client: Optional[OllamaClient] = None):
        """Initialize analyzer with Ollama client"""
        self.client = client or OllamaClient()

    def generate_insights(
        self,
        product_name: str,
        reviews: list[str],
        avg_rating: float,
        review_count: int
    ) -> str:
        """
        Generate comprehensive insights for a product based on reviews
        
        Args:
            product_name: Product name
            reviews: List of review texts
            avg_rating: Average product rating
            review_count: Total number of reviews
            
        Returns:
            AI-generated insights
        """
        context = f"Product: {product_name}, Avg Rating: {avg_rating}/5, Total Reviews: {review_count}"
        
        return self.client.analyze_product_reviews(
            product_name,
            reviews,
            context
        )

    def answer_question(
        self,
        product_name: str,
        question: str,
        reviews: list[str]
    ) -> str:
        """
        Answer a user question about a product based on reviews
        
        Args:
            product_name: Product name
            question: User question
            reviews: List of review texts
            
        Returns:
            AI-generated answer
        """
        reviews_text = "\n".join([f"- {review}" for review in reviews[:10]])
        
        prompt = f"""Based on the following reviews for {product_name}, answer this question: {question}

Reviews:
{reviews_text}

Provide a helpful, concise answer based on the reviews."""

        result = self.client.generate(prompt)
        
        if "response" in result:
            return result["response"]
        else:
            return result.get("error", "Failed to generate answer")


if __name__ == "__main__":
    # Example usage
    print("🤖 Ollama Integration Utility\n")
    
    # Initialize client
    client = OllamaClient()
    
    # Check server availability
    if client.is_available():
        print("✓ Ollama server is available")
        
        # List available models
        models = client.list_models()
        print(f"✓ Available models: {', '.join(models)}")
        
        # Example: Generate text
        print("\nGenerating text...")
        prompt = "What are the key features of a high-quality laptop?"
        result = client.generate(prompt)
        
        if "response" in result:
            print(f"\nResponse:\n{result['response'][:200]}...")
        else:
            print(f"Error: {result.get('error', 'Unknown error')}")
    else:
        print("✗ Cannot connect to Ollama server")
        print(f"  Make sure Ollama is running at {client.base_url}")
