import asyncio
import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Any
import re
from urllib.parse import urljoin, urlparse
import os
import json
from datetime import datetime

from models.schemas import DocumentationPage, SearchResult, SourceType

class DocumentationService:
    def __init__(self):
        self.base_url = "https://inference.readthedocs.io/en/latest/"
        self.pages = []
        self.client = None
        
    async def initialize(self):
        """Initialize the documentation service"""
        print("Initializing documentation service...")
        self.client = httpx.AsyncClient(timeout=30.0)
        
        # Load cached pages or scrape new ones
        await self._load_or_scrape_pages()
        print(f"Documentation service initialized with {len(self.pages)} pages")
    
    async def _load_or_scrape_pages(self):
        """Load cached pages or scrape from documentation"""
        cache_file = "data/documentation_cache.json"
        
        if os.path.exists(cache_file):
            # Load from cache
            with open(cache_file, 'r', encoding='utf-8') as f:
                cached_data = json.load(f)
                self.pages = [DocumentationPage(**page) for page in cached_data]
            print(f"Loaded {len(self.pages)} pages from cache")
        else:
            # Scrape documentation
            await self._scrape_documentation()
    
    async def _scrape_documentation(self):
        """Scrape Xinference documentation"""
        print("Scraping Xinference documentation...")
        
        # Key documentation URLs to scrape
        urls_to_scrape = [
            "",  # Main page
            "getting_started/index.html",
            "getting_started/installation.html",
            "getting_started/using_xinference.html",
            "getting_started/troubleshooting.html",
            "getting_started/using_docker_image.html",
            "getting_started/using_kubernetes.html",
            "getting_started/environments.html",
            "user_guide/index.html",
            "user_guide/backends.html",
            "user_guide/client_api.html",
            "models/index.html",
            "models/builtin/index.html",
            "models/custom.html",
            "examples/index.html"
        ]
        
        scraped_pages = []
        
        for url_path in urls_to_scrape:
            try:
                full_url = urljoin(self.base_url, url_path)
                response = await self.client.get(full_url)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract title
                title_elem = soup.find('h1') or soup.find('title')
                title = title_elem.get_text().strip() if title_elem else "Untitled"
                
                # Extract main content
                content_elem = soup.find('main') or soup.find('div', class_='document') or soup.find('body')
                if content_elem:
                    # Remove navigation and other non-content elements
                    for elem in content_elem.find_all(['nav', 'header', 'footer', 'aside']):
                        elem.decompose()
                    
                    content = content_elem.get_text()
                    # Clean up whitespace
                    content = re.sub(r'\s+', ' ', content).strip()
                else:
                    content = ""
                
                # Determine section
                section = self._determine_section(url_path)
                
                page = DocumentationPage(
                    title=title,
                    url=full_url,
                    content=content,
                    section=section,
                    last_updated=datetime.now()
                )
                
                scraped_pages.append(page)
                print(f"Scraped: {title}")
                
                # Be respectful with requests
                await asyncio.sleep(0.5)
                
            except Exception as e:
                print(f"Error scraping {url_path}: {e}")
                continue
        
        self.pages = scraped_pages
        
        # Cache the scraped pages
        await self._cache_pages()
        print(f"Scraped {len(scraped_pages)} documentation pages")
    
    def _determine_section(self, url_path: str) -> str:
        """Determine the section based on URL path"""
        if url_path.startswith("getting_started"):
            return "Getting Started"
        elif url_path.startswith("user_guide"):
            return "User Guide"
        elif url_path.startswith("models"):
            return "Models"
        elif url_path.startswith("examples"):
            return "Examples"
        elif url_path.startswith("reference"):
            return "API Reference"
        elif url_path.startswith("development"):
            return "Development"
        else:
            return "General"
    
    async def _cache_pages(self):
        """Cache scraped pages to file"""
        os.makedirs("data", exist_ok=True)
        cache_file = "data/documentation_cache.json"
        
        # Convert to dict for JSON serialization
        pages_data = []
        for page in self.pages:
            page_dict = page.dict()
            if page_dict['last_updated']:
                page_dict['last_updated'] = page_dict['last_updated'].isoformat()
            pages_data.append(page_dict)
        
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(pages_data, f, ensure_ascii=False, indent=2)
    
    async def search(self, query: str, limit: int = 5) -> List[SearchResult]:
        """Search documentation pages"""
        query_lower = query.lower()
        results = []
        
        for page in self.pages:
            # Simple text matching (can be enhanced with better scoring)
            title_match = query_lower in page.title.lower()
            content_match = query_lower in page.content.lower()
            
            if title_match or content_match:
                # Calculate simple relevance score
                score = 0.0
                if title_match:
                    score += 0.7
                if content_match:
                    score += 0.3
                
                # Boost score for troubleshooting pages
                if "troubleshoot" in page.title.lower() or "error" in page.title.lower():
                    score += 0.2
                
                result = SearchResult(
                    title=page.title,
                    content=page.content[:300] + "..." if len(page.content) > 300 else page.content,
                    url=page.url,
                    source_type=SourceType.DOCUMENTATION,
                    relevance_score=min(score, 1.0),
                    metadata={"section": page.section}
                )
                results.append(result)
        
        # Sort by relevance and return top results
        results.sort(key=lambda x: x.relevance_score, reverse=True)
        return results[:limit]
    
    async def get_all_pages(self) -> List[DocumentationPage]:
        """Get all documentation pages"""
        return self.pages
    
    async def refresh_documentation(self):
        """Refresh documentation by re-scraping"""
        await self._scrape_documentation()
        print("Documentation refreshed successfully")
    
    async def close(self):
        """Close the HTTP client"""
        if self.client:
            await self.client.aclose()
