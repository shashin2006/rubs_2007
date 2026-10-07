from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class UserRole(str, Enum):
    USER = "USER"
    COUNTER = "COUNTER"
    ADMIN = "ADMIN"


class CounterStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class TokenPriority(str, Enum):
    NORMAL = "NORMAL"
    PRIORITY = "PRIORITY"


class TokenStatus(str, Enum):
    WAITING = "WAITING"
    CALLED = "CALLED"
    SERVED = "SERVED"
    SKIPPED = "SKIPPED"
    CANCELLED = "CANCELLED"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.USER, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    tokens = relationship("QueueToken", back_populates="user")


class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String(500), default="")
    average_service_time: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    counters = relationship("Counter", back_populates="service")
    tokens = relationship("QueueToken", back_populates="service")


class Counter(Base):
    __tablename__ = "counters"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"), nullable=False)
    status: Mapped[CounterStatus] = mapped_column(
        SAEnum(CounterStatus), default=CounterStatus.ACTIVE, nullable=False
    )
    current_token_id: Mapped[int | None] = mapped_column(ForeignKey("queue_tokens.id"), nullable=True)

    service = relationship("Service", back_populates="counters")
    current_token = relationship("QueueToken", foreign_keys=[current_token_id])


class QueueToken(Base):
    __tablename__ = "queue_tokens"
    __table_args__ = (
        UniqueConstraint("service_id", "token_number", name="uq_service_token_number"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    token_number: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"), nullable=False)
    counter_id: Mapped[int | None] = mapped_column(ForeignKey("counters.id"), nullable=True)
    priority: Mapped[TokenPriority] = mapped_column(
        SAEnum(TokenPriority), default=TokenPriority.NORMAL, nullable=False
    )
    status: Mapped[TokenStatus] = mapped_column(
        SAEnum(TokenStatus), default=TokenStatus.WAITING, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    called_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user = relationship("User", back_populates="tokens")
    service = relationship("Service", back_populates="tokens")


class QueueHistory(Base):
    __tablename__ = "queue_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    token_id: Mapped[int] = mapped_column(ForeignKey("queue_tokens.id"), nullable=False)
    old_status: Mapped[str] = mapped_column(String(30), nullable=False)
    new_status: Mapped[str] = mapped_column(String(30), nullable=False)
    changed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    changed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
