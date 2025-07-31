#!/usr/bin/env python3
"""
Test script for GLM-4.5 API integration
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from services.response_service import ResponseService
from models.schemas import SearchResult, SourceType

async def test_glm_api():
    """Test GLM-4.5 API integration"""
    print("🧪 Testing GLM-4.5 API Integration...")
    
    # Initialize response service
    response_service = ResponseService()
    
    if not response_service.client:
        print("❌ GLM API client not initialized. Check your API key.")
        return
    
    # Create mock search results
    mock_results = [
        SearchResult(
            title="Xinference Installation Guide",
            content="To install Xinference, you can use pip: pip install xinference",
            url="https://inference.readthedocs.io/en/latest/getting_started/installation.html",
            source_type=SourceType.DOCUMENTATION,
            relevance_score=0.9,
            metadata={"section": "installation"}
        ),
        SearchResult(
            title="Docker Installation",
            content="You can also run Xinference using Docker: docker run -p 9997:9997 xprobe/xinference",
            url="https://inference.readthedocs.io/en/latest/getting_started/docker.html",
            source_type=SourceType.DOCUMENTATION,
            relevance_score=0.8,
            metadata={"section": "docker"}
        )
    ]
    
    # Test questions
    test_questions = [
        "如何安装Xinference？",
        "How to install Xinference with Docker?",
        "What are the system requirements for Xinference?",
        "如何部署LLM模型？"
    ]
    
    print(f"📝 Testing {len(test_questions)} questions...\n")
    
    for i, question in enumerate(test_questions, 1):
        print(f"🔍 Question {i}: {question}")
        
        try:
            # Generate answer
            answer = await response_service.generate_answer(
                question=question,
                search_results=mock_results,
                context=None
            )
            
            print(f"✅ Answer generated successfully!")
            print(f"📊 Confidence: {answer.confidence:.2f}")
            print(f"⏱️  Response time: {answer.response_time:.2f}s")
            print(f"💭 Reasoning: {answer.reasoning}")
            print(f"📄 Content preview: {answer.content[:200]}...")
            print("-" * 80)
            
        except Exception as e:
            print(f"❌ Error generating answer: {e}")
            print("-" * 80)
    
    # Close the client
    await response_service.close()
    print("🎉 GLM API test completed!")

async def test_direct_api_call():
    """Test direct API call to GLM"""
    print("\n🔧 Testing direct GLM API call...")
    
    import httpx
    
    api_key = os.getenv("GLM_API_KEY", "400c9da1294c4b14bbe5e5db27e9a058.C2mJyUDphuVfEGgc")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://open.bigmodel.cn/api/paas/v4/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "glm-4.5",
                    "messages": [
                        {
                            "role": "user",
                            "content": "Hello, please introduce yourself briefly."
                        }
                    ],
                    "max_tokens": 100,
                    "temperature": 0.7
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                print(f"✅ Direct API call successful!")
                print(f"📄 Response: {content}")
            else:
                print(f"❌ API call failed: {response.status_code}")
                print(f"📄 Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Direct API call error: {e}")

if __name__ == "__main__":
    print("🚀 Starting GLM-4.5 API Tests...\n")
    
    # Run tests
    asyncio.run(test_direct_api_call())
    asyncio.run(test_glm_api())
