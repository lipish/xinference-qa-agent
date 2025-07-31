import asyncio
import time
import json
from typing import List, Optional
import os
import httpx

from models.schemas import SearchResult, GeneratedAnswer

class ResponseService:
    def __init__(self):
        self.client = None
        self.model = "glm-4.5"  # GLM-4.5 model
        self.base_url = "https://open.bigmodel.cn/api/paas/v4"

        # Initialize GLM API client
        api_key = os.getenv("GLM_API_KEY", "400c9da1294c4b14bbe5e5db27e9a058.C2mJyUDphuVfEGgc")
        if api_key:
            self.api_key = api_key
            self.client = httpx.AsyncClient(
                base_url=self.base_url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                timeout=60.0
            )
            print("GLM-4.5 API initialized successfully")
        else:
            print("Warning: No GLM API key found. Response generation will be limited.")

    async def close(self):
        """Close the HTTP client"""
        if self.client:
            await self.client.aclose()
    
    async def generate_answer(
        self, 
        question: str, 
        search_results: List[SearchResult],
        context: Optional[str] = None
    ) -> GeneratedAnswer:
        """Generate an AI-powered answer based on search results"""
        start_time = time.time()
        
        if not self.client:
            # Fallback to simple response without AI
            return await self._generate_fallback_answer(question, search_results, start_time)
        
        try:
            # Prepare context from search results
            context_text = self._prepare_context(search_results)

            # Create the prompt
            prompt = self._create_prompt(question, context_text, context)

            # Generate response using GLM API
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": self._get_system_prompt()
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": 1000,
                "temperature": 0.3,
                "thinking": {
                    "type": "enabled"  # Enable GLM-4.5 thinking mode for better reasoning
                }
            }

            response = await self.client.post("/chat/completions", json=payload)
            response.raise_for_status()

            response_data = response.json()
            answer_content = response_data["choices"][0]["message"]["content"]
            confidence = self._calculate_confidence(search_results, answer_content)

            return GeneratedAnswer(
                content=answer_content,
                confidence=confidence,
                response_time=time.time() - start_time,
                reasoning=f"Generated from {len(search_results)} sources using GLM-4.5"
            )
            
        except Exception as e:
            print(f"Error generating AI response: {e}")
            return await self._generate_fallback_answer(question, search_results, start_time)
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for the AI assistant"""
        return """You are an expert assistant for Xinference, an open-source platform for running AI model inference.

Your role is to help users with:
- Installation and setup questions
- Configuration and deployment issues
- Troubleshooting common problems
- Understanding features and capabilities
- Best practices and recommendations

Guidelines:
1. Provide accurate, helpful answers based on the provided context
2. If you're not certain about something, say so
3. Include relevant code examples when helpful
4. Reference specific documentation or GitHub issues when applicable
5. Be concise but thorough
6. If the question is about an error, provide step-by-step troubleshooting
7. Always prioritize official documentation over other sources
8. Format your response in clear markdown with proper headings and code blocks

Remember: Xinference supports multiple backends (vLLM, llama.cpp, Transformers, SGLang, MLX) and can run various types of models (LLM, embedding, image, audio, rerank, video)."""
    
    def _create_prompt(self, question: str, context: str, user_context: Optional[str] = None) -> str:
        """Create the prompt for the AI model"""
        prompt_parts = [
            f"Question: {question}",
            "",
            "Context from Xinference documentation and issues:",
            context
        ]
        
        if user_context:
            prompt_parts.extend([
                "",
                f"Additional context from user: {user_context}"
            ])
        
        prompt_parts.extend([
            "",
            "Please provide a helpful answer based on the context above. If the context doesn't contain enough information to fully answer the question, say so and provide what guidance you can."
        ])
        
        return "\n".join(prompt_parts)
    
    def _prepare_context(self, search_results: List[SearchResult]) -> str:
        """Prepare context text from search results"""
        if not search_results:
            return "No relevant context found."
        
        context_parts = []
        
        for i, result in enumerate(search_results[:5], 1):  # Limit to top 5 results
            source_type = result.source_type.value.replace("_", " ").title()
            context_parts.append(
                f"Source {i} ({source_type}):\n"
                f"Title: {result.title}\n"
                f"Content: {result.content}\n"
                f"URL: {result.url}\n"
                f"Relevance: {result.relevance_score:.2f}\n"
            )
        
        return "\n---\n".join(context_parts)
    
    def _calculate_confidence(self, search_results: List[SearchResult], answer: str) -> float:
        """Calculate confidence score for the generated answer"""
        if not search_results:
            return 0.3
        
        # Base confidence on search result quality
        avg_relevance = sum(r.relevance_score for r in search_results) / len(search_results)
        
        # Boost confidence if we have multiple high-quality sources
        high_quality_sources = sum(1 for r in search_results if r.relevance_score > 0.7)
        quality_boost = min(high_quality_sources * 0.1, 0.3)
        
        # Boost confidence if we have documentation sources
        doc_sources = sum(1 for r in search_results if r.source_type.value == "documentation")
        doc_boost = min(doc_sources * 0.05, 0.2)
        
        # Reduce confidence if answer is very short (might indicate insufficient context)
        length_penalty = 0.1 if len(answer) < 100 else 0.0
        
        confidence = avg_relevance + quality_boost + doc_boost - length_penalty
        return max(0.1, min(1.0, confidence))
    
    async def _generate_fallback_answer(
        self, 
        question: str, 
        search_results: List[SearchResult], 
        start_time: float
    ) -> GeneratedAnswer:
        """Generate a fallback answer without AI when OpenAI is not available"""
        
        if not search_results:
            content = (
                "I couldn't find specific information about your question in the Xinference documentation or GitHub issues. "
                "Please check the official documentation at https://inference.readthedocs.io/ or search the GitHub issues at "
                "https://github.com/xorbitsai/inference/issues for more information."
            )
            confidence = 0.2
        else:
            # Create a simple answer from the best search result
            best_result = search_results[0]
            content = (
                f"Based on the available information:\n\n"
                f"{best_result.content}\n\n"
                f"For more details, please refer to: {best_result.url}"
            )
            confidence = best_result.relevance_score * 0.8  # Reduce confidence for non-AI response
        
        return GeneratedAnswer(
            content=content,
            confidence=confidence,
            response_time=time.time() - start_time,
            reasoning="Fallback response without AI generation"
        )
    
    async def generate_summary(self, search_results: List[SearchResult]) -> str:
        """Generate a summary of search results"""
        if not search_results:
            return "No relevant information found."
        
        if not self.client:
            # Simple fallback summary
            return f"Found {len(search_results)} relevant sources including documentation and GitHub issues."
        
        try:
            context = self._prepare_context(search_results[:3])
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Summarize the key points from the provided Xinference documentation and issues."
                    },
                    {
                        "role": "user",
                        "content": f"Please provide a brief summary of these sources:\n\n{context}"
                    }
                ],
                max_tokens=200,
                temperature=0.3
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"Error generating summary: {e}")
            return f"Found {len(search_results)} relevant sources from Xinference documentation and GitHub issues."
