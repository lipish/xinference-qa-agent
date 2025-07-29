from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class SourceType(str, Enum):
    DOCUMENTATION = "documentation"
    GITHUB_ISSUE = "github_issue"
    SOURCE_CODE = "source_code"
    FAQ = "faq"

class SearchResult(BaseModel):
    title: str
    content: str
    url: str
    source_type: SourceType
    relevance_score: float = Field(ge=0.0, le=1.0)
    metadata: Dict[str, Any] = {}

class QuestionRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)
    context: Optional[str] = None
    max_results: Optional[int] = Field(default=10, ge=1, le=50)
    include_sources: List[SourceType] = Field(default_factory=lambda: list(SourceType))

class GeneratedAnswer(BaseModel):
    content: str
    confidence: float = Field(ge=0.0, le=1.0)
    response_time: float
    reasoning: Optional[str] = None

class AnswerResponse(BaseModel):
    question: str
    answer: str
    sources: List[SearchResult]
    confidence: float = Field(ge=0.0, le=1.0)
    response_time: float
    timestamp: datetime = Field(default_factory=datetime.now)

class PopularQuestion(BaseModel):
    question: str
    frequency: int
    category: str
    last_asked: datetime

class FeedbackRequest(BaseModel):
    question: str
    answer: str
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    helpful: bool

class DocumentationPage(BaseModel):
    title: str
    url: str
    content: str
    section: str
    last_updated: Optional[datetime] = None

class GitHubIssue(BaseModel):
    number: int
    title: str
    body: str
    url: str
    state: str
    labels: List[str] = []
    created_at: datetime
    updated_at: datetime
    author: str

class CodeSearchResult(BaseModel):
    file_path: str
    content: str
    url: str
    repository: str
    language: str
    line_numbers: List[int] = []

# Authentication schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    username: Optional[str] = None

# User activity schemas
class QuestionHistoryResponse(BaseModel):
    id: int
    question: str
    answer: str
    confidence: str
    response_time: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserFavoriteResponse(BaseModel):
    id: int
    question: str
    answer: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserStats(BaseModel):
    total_questions: int
    total_favorites: int
    avg_confidence: float
    recent_activity: List[QuestionHistoryResponse]
