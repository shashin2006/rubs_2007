from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from .models import CounterStatus, TokenPriority, TokenStatus, UserRole


class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserPublic


class ServicePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    average_service_time: int
    active: bool


class CounterPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    service_id: int
    status: CounterStatus
    current_token_id: int | None = None


class JoinQueueRequest(BaseModel):
    service_id: int
    priority: TokenPriority = TokenPriority.NORMAL


class TokenPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    token_number: str
    user_id: int
    service_id: int
    counter_id: int | None
    priority: TokenPriority
    status: TokenStatus
    created_at: datetime
    called_at: datetime | None
    completed_at: datetime | None


class TokenSummary(BaseModel):
    id: int
    token_number: str
    status: TokenStatus
    priority: TokenPriority
    created_at: datetime


class JoinQueueResponse(BaseModel):
    token_id: int
    token_number: str
    service_id: int
    service_name: str
    position: int
    estimated_wait_minutes: int
    status: TokenStatus


class TokenDetailsResponse(BaseModel):
    token: TokenPublic
    service: ServicePublic
    position: int
    estimated_wait_minutes: int


class QueueStatusResponse(BaseModel):
    service: ServicePublic
    waiting_count: int
    current_token: str | None
    estimated_wait_minutes: int
    active_counters: int
    recent_tokens: list[TokenSummary]


class QueueRecommendation(BaseModel):
    service_id: int
    service_name: str
    estimated_wait_minutes: int
    waiting_count: int
    active_counters: int


class RecommendationResponse(BaseModel):
    recommendation: QueueRecommendation | None
    options: list[QueueRecommendation]


class CalledTokenResponse(BaseModel):
    message: str
    token: dict[str, Any]


class AdminDashboardResponse(BaseModel):
    total_users: int
    active_counters: int
    waiting_tokens: int
    served_tokens: int
    skipped_tokens: int
    cancelled_tokens: int
    service_statistics: list[dict[str, Any]]
