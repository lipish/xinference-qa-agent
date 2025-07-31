from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import timedelta
import uvicorn
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from services.search_service import SearchService
from services.documentation_service import DocumentationService
from services.github_service import GitHubService
from services.response_service import ResponseService
from models.schemas import (
    QuestionRequest, AnswerResponse, SearchResult,
    UserCreate, UserLogin, UserResponse, Token, UserStats,
    QuestionHistoryResponse, UserFavoriteResponse
)
from database import get_db, create_tables, User, QuestionHistory, UserFavorite
from auth import (
    authenticate_user, create_access_token, create_user, get_current_active_user,
    get_user_by_username, get_user_by_email, ACCESS_TOKEN_EXPIRE_MINUTES
)

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Xinference Q&A Agent",
    description="An intelligent agent to answer questions about Xinference",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
doc_service = DocumentationService()
github_service = GitHubService()
search_service = SearchService(doc_service, github_service)
response_service = ResponseService()

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    # Create database tables
    create_tables()

    # Initialize services
    await doc_service.initialize()
    await github_service.initialize()
    await search_service.initialize()

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup resources on shutdown"""
    await response_service.close()

@app.get("/")
async def root():
    return {"message": "Xinference Q&A Agent API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Authentication endpoints
@app.post("/api/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if username already exists
    if get_user_by_username(db, user.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Check if email already exists
    if get_user_by_email(db, user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    db_user = create_user(
        db=db,
        username=user.username,
        email=user.email,
        password=user.password,
        full_name=user.full_name
    )

    return db_user

@app.post("/api/auth/login", response_model=Token)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user and return access token"""
    user = authenticate_user(db, user_credentials.username, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return current_user

async def get_optional_current_user(
    db: Session = Depends(get_db),
    credentials: Optional[str] = None
) -> Optional[User]:
    """Get current user if authenticated, otherwise return None"""
    try:
        from fastapi.security import HTTPBearer
        from fastapi import Request

        # This is a simplified version - in production you'd want more robust handling
        return None  # For now, make authentication optional
    except:
        return None

@app.post("/api/ask", response_model=AnswerResponse)
async def ask_question(
    request: QuestionRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Main endpoint to ask questions about Xinference
    """
    try:
        # Search across all sources
        search_results = await search_service.search_all_sources(
            query=request.question,
            max_results=request.max_results or 10
        )

        print(f"Found {len(search_results)} search results for: {request.question}")

        # Generate response using AI
        answer = await response_service.generate_answer(
            question=request.question,
            search_results=search_results,
            context=request.context
        )

        # Save to user history if authenticated
        if current_user:
            history_entry = QuestionHistory(
                user_id=current_user.id,
                question=request.question,
                answer=answer.content,
                confidence=str(answer.confidence),
                response_time=str(answer.response_time)
            )
            db.add(history_entry)
            db.commit()

        return AnswerResponse(
            question=request.question,
            answer=answer.content,
            sources=search_results,
            confidence=answer.confidence,
            response_time=answer.response_time
        )

    except Exception as e:
        print(f"Error in ask_question: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/search/documentation")
async def search_documentation(q: str, limit: int = 5):
    """Search Xinference documentation"""
    try:
        results = await doc_service.search(q, limit)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/search/github")
async def search_github_issues(q: str, limit: int = 5):
    """Search GitHub issues"""
    try:
        results = await github_service.search_issues(q, limit)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/search/code")
async def search_source_code(q: str, limit: int = 5):
    """Search source code"""
    try:
        results = await github_service.search_code(q, limit)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/feedback")
async def submit_feedback(feedback: Dict[str, Any]):
    """Submit feedback on answers"""
    # Store feedback for improving the system
    return {"message": "Feedback received"}

@app.get("/api/popular-questions")
async def get_popular_questions():
    """Get frequently asked questions"""
    try:
        questions = await search_service.get_popular_questions()
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# User-specific endpoints
@app.get("/api/user/history", response_model=List[QuestionHistoryResponse])
async def get_user_history(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user's question history"""
    history = db.query(QuestionHistory).filter(
        QuestionHistory.user_id == current_user.id
    ).order_by(QuestionHistory.created_at.desc()).limit(limit).all()

    return history

@app.get("/api/user/favorites", response_model=List[UserFavoriteResponse])
async def get_user_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user's favorite questions"""
    favorites = db.query(UserFavorite).filter(
        UserFavorite.user_id == current_user.id
    ).order_by(UserFavorite.created_at.desc()).all()

    return favorites

@app.post("/api/user/favorites")
async def add_to_favorites(
    request: Dict[str, str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Add a question to user's favorites"""
    # Check if already in favorites
    existing = db.query(UserFavorite).filter(
        UserFavorite.user_id == current_user.id,
        UserFavorite.question == request["question"]
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question already in favorites"
        )

    favorite = UserFavorite(
        user_id=current_user.id,
        question=request["question"],
        answer=request["answer"]
    )
    db.add(favorite)
    db.commit()

    return {"message": "Added to favorites"}

@app.delete("/api/user/favorites/{favorite_id}")
async def remove_from_favorites(
    favorite_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Remove a question from user's favorites"""
    favorite = db.query(UserFavorite).filter(
        UserFavorite.id == favorite_id,
        UserFavorite.user_id == current_user.id
    ).first()

    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found"
        )

    db.delete(favorite)
    db.commit()

    return {"message": "Removed from favorites"}

@app.get("/api/user/stats", response_model=UserStats)
async def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user statistics"""
    # Get total questions
    total_questions = db.query(QuestionHistory).filter(
        QuestionHistory.user_id == current_user.id
    ).count()

    # Get total favorites
    total_favorites = db.query(UserFavorite).filter(
        UserFavorite.user_id == current_user.id
    ).count()

    # Calculate average confidence
    history_records = db.query(QuestionHistory).filter(
        QuestionHistory.user_id == current_user.id
    ).all()

    avg_confidence = 0.0
    if history_records:
        confidences = [float(record.confidence) for record in history_records if record.confidence]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

    # Get recent activity
    recent_activity = db.query(QuestionHistory).filter(
        QuestionHistory.user_id == current_user.id
    ).order_by(QuestionHistory.created_at.desc()).limit(5).all()

    return UserStats(
        total_questions=total_questions,
        total_favorites=total_favorites,
        avg_confidence=avg_confidence,
        recent_activity=recent_activity
    )

# Mount static files for frontend
if os.path.exists("../frontend/build"):
    app.mount("/", StaticFiles(directory="../frontend/build", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
