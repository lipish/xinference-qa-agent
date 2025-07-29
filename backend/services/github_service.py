import asyncio
import httpx
from typing import List, Dict, Any, Optional
import os
import json
from datetime import datetime, timedelta
import re

from models.schemas import GitHubIssue, SearchResult, SourceType, CodeSearchResult

class GitHubService:
    def __init__(self):
        self.base_url = "https://api.github.com"
        self.repo_owner = "xorbitsai"
        self.repo_name = "inference"
        self.client = None
        self.issues_cache = []
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Xinference-QA-Agent"
        }
        
        # Add GitHub token if available
        github_token = os.getenv("GITHUB_TOKEN")
        if github_token:
            self.headers["Authorization"] = f"token {github_token}"
    
    async def initialize(self):
        """Initialize the GitHub service"""
        print("Initializing GitHub service...")
        self.client = httpx.AsyncClient(timeout=30.0, headers=self.headers)
        
        # Load cached issues or fetch new ones
        await self._load_or_fetch_issues()
        print(f"GitHub service initialized with {len(self.issues_cache)} issues")
    
    async def _load_or_fetch_issues(self):
        """Load cached issues or fetch from GitHub API"""
        cache_file = "data/github_issues_cache.json"
        
        if os.path.exists(cache_file):
            # Check if cache is recent (less than 1 hour old)
            cache_age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_file))
            if cache_age < timedelta(hours=1):
                with open(cache_file, 'r', encoding='utf-8') as f:
                    cached_data = json.load(f)
                    self.issues_cache = [GitHubIssue(**issue) for issue in cached_data]
                print(f"Loaded {len(self.issues_cache)} issues from cache")
                return
        
        # Fetch fresh issues
        await self._fetch_issues()
    
    async def _fetch_issues(self):
        """Fetch issues from GitHub API"""
        print("Fetching issues from GitHub...")
        
        issues = []
        page = 1
        per_page = 100
        max_pages = 5  # Limit to avoid rate limiting
        
        while page <= max_pages:
            try:
                url = f"{self.base_url}/repos/{self.repo_owner}/{self.repo_name}/issues"
                params = {
                    "state": "all",
                    "per_page": per_page,
                    "page": page,
                    "sort": "updated",
                    "direction": "desc"
                }
                
                response = await self.client.get(url, params=params)
                response.raise_for_status()
                
                page_issues = response.json()
                if not page_issues:
                    break
                
                for issue_data in page_issues:
                    # Skip pull requests (they appear in issues API)
                    if "pull_request" in issue_data:
                        continue
                    
                    issue = GitHubIssue(
                        number=issue_data["number"],
                        title=issue_data["title"],
                        body=issue_data["body"] or "",
                        url=issue_data["html_url"],
                        state=issue_data["state"],
                        labels=[label["name"] for label in issue_data["labels"]],
                        created_at=datetime.fromisoformat(issue_data["created_at"].replace("Z", "+00:00")),
                        updated_at=datetime.fromisoformat(issue_data["updated_at"].replace("Z", "+00:00")),
                        author=issue_data["user"]["login"]
                    )
                    issues.append(issue)
                
                print(f"Fetched page {page} with {len(page_issues)} issues")
                page += 1
                
                # Be respectful with API rate limits
                await asyncio.sleep(0.5)
                
            except Exception as e:
                print(f"Error fetching issues page {page}: {e}")
                break
        
        self.issues_cache = issues
        await self._cache_issues()
        print(f"Fetched {len(issues)} issues from GitHub")
    
    async def _cache_issues(self):
        """Cache issues to file"""
        os.makedirs("data", exist_ok=True)
        cache_file = "data/github_issues_cache.json"
        
        # Convert to dict for JSON serialization
        issues_data = []
        for issue in self.issues_cache:
            issue_dict = issue.dict()
            issue_dict['created_at'] = issue_dict['created_at'].isoformat()
            issue_dict['updated_at'] = issue_dict['updated_at'].isoformat()
            issues_data.append(issue_dict)
        
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(issues_data, f, ensure_ascii=False, indent=2)
    
    async def search_issues(self, query: str, limit: int = 5) -> List[SearchResult]:
        """Search GitHub issues"""
        query_lower = query.lower()
        results = []
        
        for issue in self.issues_cache:
            # Search in title and body
            title_match = query_lower in issue.title.lower()
            body_match = query_lower in issue.body.lower()
            
            if title_match or body_match:
                # Calculate relevance score
                score = 0.0
                if title_match:
                    score += 0.8
                if body_match:
                    score += 0.4
                
                # Boost closed issues with solutions
                if issue.state == "closed":
                    score += 0.2
                
                # Boost issues with certain labels
                helpful_labels = ["bug", "question", "documentation", "help wanted"]
                if any(label in helpful_labels for label in issue.labels):
                    score += 0.1
                
                # Boost recent issues
                days_old = (datetime.now() - issue.updated_at.replace(tzinfo=None)).days
                if days_old < 30:
                    score += 0.1
                
                result = SearchResult(
                    title=issue.title,
                    content=issue.body[:400] + "..." if len(issue.body) > 400 else issue.body,
                    url=issue.url,
                    source_type=SourceType.GITHUB_ISSUE,
                    relevance_score=min(score, 1.0),
                    metadata={
                        "number": issue.number,
                        "state": issue.state,
                        "labels": issue.labels,
                        "author": issue.author,
                        "created_at": issue.created_at.isoformat(),
                        "updated_at": issue.updated_at.isoformat()
                    }
                )
                results.append(result)
        
        # Sort by relevance and return top results
        results.sort(key=lambda x: x.relevance_score, reverse=True)
        return results[:limit]
    
    async def search_code(self, query: str, limit: int = 5) -> List[SearchResult]:
        """Search source code in the repository"""
        try:
            url = f"{self.base_url}/search/code"
            params = {
                "q": f"{query} repo:{self.repo_owner}/{self.repo_name}",
                "per_page": limit
            }
            
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            results = []
            
            for item in data.get("items", []):
                result = SearchResult(
                    title=f"{item['name']} - {item['path']}",
                    content=self._extract_code_snippet(item.get("text_matches", [])),
                    url=item["html_url"],
                    source_type=SourceType.SOURCE_CODE,
                    relevance_score=item.get("score", 0.5),
                    metadata={
                        "file_path": item["path"],
                        "repository": item["repository"]["full_name"],
                        "language": item.get("language", "unknown")
                    }
                )
                results.append(result)
            
            return results
            
        except Exception as e:
            print(f"Error searching code: {e}")
            return []
    
    def _extract_code_snippet(self, text_matches: List[Dict]) -> str:
        """Extract relevant code snippets from search matches"""
        if not text_matches:
            return "Code snippet not available"
        
        snippets = []
        for match in text_matches[:3]:  # Limit to first 3 matches
            fragment = match.get("fragment", "")
            if fragment:
                snippets.append(fragment)
        
        return "\n...\n".join(snippets)
    
    async def get_recent_issues(self, limit: int = 100) -> List[GitHubIssue]:
        """Get recent issues for indexing"""
        return self.issues_cache[:limit]
    
    async def refresh_issues(self):
        """Refresh issues cache"""
        await self._fetch_issues()
        print("GitHub issues cache refreshed")
    
    async def close(self):
        """Close the HTTP client"""
        if self.client:
            await self.client.aclose()
