from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import QueueToken, TokenStatus

ACTIVE_STATUSES = (TokenStatus.WAITING, TokenStatus.CALLED)


def calculate_position(db: Session, token: QueueToken) -> int:
    count = db.scalar(
        select(func.count(QueueToken.id)).where(
            QueueToken.service_id == token.service_id,
            QueueToken.status.in_(ACTIVE_STATUSES),
            QueueToken.created_at < token.created_at,
        )
    )
    return int(count or 0) + 1


def estimate_wait(db: Session, service_id: int, average_service_time: int) -> int:
    waiting = db.scalar(
        select(func.count(QueueToken.id)).where(
            QueueToken.service_id == service_id,
            QueueToken.status.in_(ACTIVE_STATUSES),
        )
    ) or 0
    return max(0, round(int(waiting) * max(1, average_service_time) / 1))


def token_prefix(service_name: str) -> str:
    mapping = {"Banking": "B", "Documents": "D", "Support": "S"}
    return mapping.get(service_name, service_name[:1].upper() or "Q")


def now_utc() -> datetime:
    return datetime.utcnow()
