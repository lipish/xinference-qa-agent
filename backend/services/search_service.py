import asyncio
from typing import List, Dict, Any
import json
import os
from datetime import datetime, timedelta
import re

from models.schemas import SearchResult, SourceType, PopularQuestion
from services.documentation_service import DocumentationService
from services.github_service import GitHubService

class SearchService:
    def __init__(self, doc_service=None, github_service=None):
        self.documents = []
        self.doc_service = doc_service or DocumentationService()
        self.github_service = github_service or GitHubService()
        self.popular_questions = []

    async def initialize(self):
        """Initialize the search service"""
        print("Initializing search service...")

        # Load or create document index
        await self._load_or_create_index()

        # Load popular questions
        await self._load_popular_questions()

        print("Search service initialized successfully")
    
    async def _load_or_create_index(self):
        """Load existing index or create new one"""
        docs_path = "data/documents.json"

        if os.path.exists(docs_path):
            # Load existing index
            with open(docs_path, 'r', encoding='utf-8') as f:
                self.documents = json.load(f)
            print(f"Loaded existing index with {len(self.documents)} documents")

            # If index is empty, recreate it
            if len(self.documents) == 0:
                print("Index is empty, recreating...")
                await self._create_index()
        else:
            # Create new index
            await self._create_index()
    
    async def _create_index(self):
        """Create new search index from all sources"""
        print("Creating new search index...")

        # Collect documents from all sources
        all_docs = []

        # Get documentation - check if service has pages
        if hasattr(self.doc_service, 'pages') and self.doc_service.pages:
            doc_pages = self.doc_service.pages
            print(f"Found {len(doc_pages)} documentation pages")
            for page in doc_pages:
                all_docs.append({
                    'title': page.title,
                    'content': page.content,
                    'url': page.url,
                    'source_type': SourceType.DOCUMENTATION.value,
                    'metadata': {'section': page.section}
                })
        else:
            print("No documentation pages found or service not initialized")

        # Get GitHub issues - check if service has issues
        if hasattr(self.github_service, 'issues_cache') and self.github_service.issues_cache:
            issues = self.github_service.issues_cache[:100]  # Limit to first 100
            print(f"Found {len(issues)} GitHub issues")
            for issue in issues:
                all_docs.append({
                    'title': issue.title,
                    'content': issue.body,
                    'url': issue.url,
                    'source_type': SourceType.GITHUB_ISSUE.value,
                    'metadata': {
                        'number': issue.number,
                        'state': issue.state,
                        'labels': issue.labels,
                        'author': issue.author
                    }
                })
        else:
            print("No GitHub issues found or service not initialized")

        self.documents = all_docs

        # Save documents
        os.makedirs("data", exist_ok=True)
        with open("data/documents.json", 'w', encoding='utf-8') as f:
            json.dump(self.documents, f, ensure_ascii=False, indent=2)

        print(f"Created index with {len(all_docs)} documents")
    
    def _get_search_keywords(self, query: str) -> List[str]:
        """Extract and expand search keywords with Chinese-English mapping"""
        # Chinese to English keyword mapping for Xinference
        keyword_mapping = {
            # Installation related
            "安装": ["install", "installation", "setup"],
            "部署": ["deploy", "deployment", "setup"],
            "配置": ["config", "configuration", "configure"],
            "启动": ["start", "launch", "run"],
            "运行": ["run", "running", "execute"],

            # Model related
            "模型": ["model", "models"],
            "大模型": ["llm", "large language model"],
            "语言模型": ["language model", "llm"],
            "嵌入模型": ["embedding", "embedding model"],
            "图像模型": ["image", "image model"],
            "多模态": ["multimodal", "multi-modal"],

            # Technical terms
            "推理": ["inference", "infer"],
            "服务": ["service", "server", "serving"],
            "客户端": ["client"],
            "API": ["api"],
            "接口": ["interface", "api"],
            "后端": ["backend"],
            "引擎": ["engine"],

            # Common operations
            "使用": ["use", "using", "usage"],
            "如何": ["how", "how to"],
            "什么": ["what", "what is"],
            "为什么": ["why"],
            "问题": ["problem", "issue", "error"],
            "错误": ["error", "bug", "issue"],
            "故障": ["troubleshoot", "problem", "issue"],

            # Specific backends
            "vllm": ["vllm"],
            "transformers": ["transformers"],
            "llama.cpp": ["llama.cpp", "llamacpp"],
            "docker": ["docker"],
            "kubernetes": ["kubernetes", "k8s"],
        }

        # Extract keywords from query
        keywords = []
        query_lower = query.lower()

        # Add original query terms
        original_terms = re.findall(r'\w+', query_lower)
        keywords.extend(original_terms)

        # Add mapped English terms for Chinese keywords
        for chinese_term, english_terms in keyword_mapping.items():
            if chinese_term in query_lower:
                keywords.extend(english_terms)

        # Add common Xinference terms if query seems related
        xinference_terms = ["xinference", "xorbits", "inference"]
        if any(term in query_lower for term in ["xinference", "推理", "模型", "安装", "部署"]):
            keywords.extend(xinference_terms)

        return list(set(keywords))  # Remove duplicates

    async def search_all_sources(self, query: str, max_results: int = 10) -> List[SearchResult]:
        """Search across all sources using enhanced text matching with Chinese support"""
        if not self.documents:
            raise RuntimeError("Search service not initialized")

        # Get expanded keywords including Chinese-English mapping
        search_keywords = self._get_search_keywords(query)
        results = []

        print(f"Searching {len(self.documents)} documents for: {query}")
        print(f"Expanded keywords: {search_keywords}")

        for doc in self.documents:
            # Enhanced text matching with keyword expansion
            title_lower = doc['title'].lower()
            content_lower = doc['content'].lower()

            title_matches = sum(1 for keyword in search_keywords if keyword in title_lower)
            content_matches = sum(1 for keyword in search_keywords if keyword in content_lower)

            # Also check for partial matches and common patterns
            partial_matches = 0
            for keyword in search_keywords:
                if len(keyword) > 3:  # Only check partial matches for longer keywords
                    if any(keyword[:4] in text for text in [title_lower, content_lower]):
                        partial_matches += 0.5

            total_matches = title_matches + content_matches + partial_matches

            if total_matches > 0:
                # Calculate relevance score based on matches
                score = 0.0
                if title_matches > 0:
                    score += 0.7 * (title_matches / len(search_keywords))
                if content_matches > 0:
                    score += 0.3 * (content_matches / len(search_keywords))
                if partial_matches > 0:
                    score += 0.1 * (partial_matches / len(search_keywords))

                # Boost score for certain source types
                if doc['source_type'] == SourceType.DOCUMENTATION.value:
                    score += 0.2

                # Boost score for installation/setup related content
                if any(term in content_lower for term in ["install", "setup", "getting started"]):
                    score += 0.1

                result = SearchResult(
                    title=doc['title'],
                    content=doc['content'][:500] + "..." if len(doc['content']) > 500 else doc['content'],
                    url=doc['url'],
                    source_type=SourceType(doc['source_type']),
                    relevance_score=min(score, 1.0),
                    metadata=doc['metadata']
                )
                results.append(result)

        print(f"Found {len(results)} matching documents")

        # Sort by relevance and return top results
        results.sort(key=lambda x: x.relevance_score, reverse=True)
        return results[:max_results]
    
    async def search_by_source(self, query: str, source_type: SourceType, limit: int = 5) -> List[SearchResult]:
        """Search within a specific source type"""
        all_results = await self.search_all_sources(query, limit * 3)
        filtered_results = [r for r in all_results if r.source_type == source_type]
        return filtered_results[:limit]
    
    async def _load_popular_questions(self):
        """Load popular questions from storage"""
        # This would typically load from a database
        # For now, we'll use some common Xinference questions
        self.popular_questions = [
            PopularQuestion(
                question="How to install Xinference?",
                frequency=45,
                category="installation",
                last_asked=datetime.now() - timedelta(hours=2)
            ),
            PopularQuestion(
                question="How to deploy models with Docker?",
                frequency=38,
                category="deployment",
                last_asked=datetime.now() - timedelta(hours=5)
            ),
            PopularQuestion(
                question="CUDA out of memory error",
                frequency=32,
                category="troubleshooting",
                last_asked=datetime.now() - timedelta(hours=1)
            ),
            PopularQuestion(
                question="How to use vLLM backend?",
                frequency=28,
                category="configuration",
                last_asked=datetime.now() - timedelta(hours=3)
            ),
            PopularQuestion(
                question="Model loading fails",
                frequency=25,
                category="troubleshooting",
                last_asked=datetime.now() - timedelta(hours=4)
            )
        ]
    
    async def get_popular_questions(self) -> List[PopularQuestion]:
        """Get list of popular questions"""
        return sorted(self.popular_questions, key=lambda x: x.frequency, reverse=True)
    
    async def update_index(self):
        """Update the search index with new content"""
        await self._create_index()
        print("Search index updated successfully")
