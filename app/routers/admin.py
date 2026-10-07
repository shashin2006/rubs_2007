from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_roles
from ..models import Counter, CounterStatus, QueueToken, Service, TokenStatus, User, UserRole

router = APIRouter(prefix="/api/admin", tags=["Admin"])
admin_only = require_roles(UserRole.ADMIN)


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), _: User = Depends(admin_only)):
    total_users = db.scalar(select(func.count(User.id))) or 0
    active_counters = db.scalar(
        select(func.count(Counter.id)).where(Counter.status == CounterStatus.ACTIVE)
    ) or 0

    def count_status(status):
        return db.scalar(select(func.count(QueueToken.id)).where(QueueToken.status == status)) or 0

    service_statistics = []
    for service in db.scalars(select(Service).order_by(Service.id)).all():
        waiting = db.scalar(select(func.count(QueueToken.id)).where(
            QueueToken.service_id == service.id,
            QueueToken.status.in_([TokenStatus.WAITING, TokenStatus.CALLED])
        )) or 0
        served = db.scalar(select(func.count(QueueToken.id)).where(
            QueueToken.service_id == service.id,
            QueueToken.status == TokenStatus.SERVED
        )) or 0
        service_statistics.append({
            "service_id": service.id,
            "service_name": service.name,
            "waiting": int(waiting),
            "served": int(served),
        })

    return {
        "total_users": int(total_users),
        "active_counters": int(active_counters),
        "waiting_tokens": int(count_status(TokenStatus.WAITING)),
        "served_tokens": int(count_status(TokenStatus.SERVED)),
        "skipped_tokens": int(count_status(TokenStatus.SKIPPED)),
        "cancelled_tokens": int(count_status(TokenStatus.CANCELLED)),
        "service_statistics": service_statistics,
    }


@router.get("/tokens")
def recent_tokens(db: Session = Depends(get_db), _: User = Depends(admin_only)):
    tokens = db.scalars(select(QueueToken).order_by(QueueToken.created_at.desc()).limit(100)).all()
    return {"tokens": tokens}
