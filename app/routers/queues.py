from datetime import datetime
from threading import Lock

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import Counter, CounterStatus, QueueToken, Service, TokenPriority, TokenStatus, User
from ..schemas import (
    JoinQueueRequest, JoinQueueResponse, QueueRecommendation, QueueStatusResponse,
    RecommendationResponse, TokenDetailsResponse, TokenPublic, TokenSummary
)
from ..utils import ACTIVE_STATUSES, calculate_position, estimate_wait, token_prefix

router = APIRouter(prefix="/api/queues", tags=["Queues"])

# SQLite is a lightweight single-process prototype. The lock prevents two
# local worker threads from racing while the UNIQUE constraint is the DB guard.
token_lock = Lock()


def next_token_number(db: Session, service_id: int, prefix: str) -> str:
    rows = db.scalars(
        select(QueueToken.token_number)
        .where(QueueToken.service_id == service_id)
    ).all()
    max_number = 0
    for value in rows:
        try:
            max_number = max(max_number, int(str(value).split("-")[-1]))
        except ValueError:
            continue
    return f"{prefix}-{max_number + 1:03d}"


def get_token_or_404(db: Session, token_id: int) -> QueueToken:
    token = db.get(QueueToken, token_id)
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    return token


@router.post("/join", response_model=JoinQueueResponse, status_code=201)
def join_queue(
    payload: JoinQueueRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = db.get(Service, payload.service_id)
    if not service or not service.active:
        raise HTTPException(status_code=404, detail="Service not found")

    existing = db.scalar(
        select(QueueToken).where(
            QueueToken.user_id == current_user.id,
            QueueToken.status.in_(ACTIVE_STATUSES),
        )
    )
    if existing:
        raise HTTPException(status_code=409, detail="You already have an active queue token")

    prefix = token_prefix(service.name)
    with token_lock:
        for _ in range(3):
            token_number = next_token_number(db, service.id, prefix)
            token = QueueToken(
                token_number=token_number,
                user_id=current_user.id,
                service_id=service.id,
                priority=payload.priority,
                status=TokenStatus.WAITING,
            )
            db.add(token)
            try:
                db.commit()
                db.refresh(token)
                break
            except IntegrityError:
                db.rollback()
        else:
            raise HTTPException(status_code=409, detail="Could not allocate a unique token")

    position = calculate_position(db, token)
    wait = estimate_wait(db, service.id, service.average_service_time)

    return JoinQueueResponse(
        token_id=token.id,
        token_number=token.token_number,
        service_id=service.id,
        service_name=service.name,
        position=position,
        estimated_wait_minutes=wait,
        status=token.status,
    )


@router.get("/my-token")
def my_token(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    token = db.scalar(
        select(QueueToken)
        .where(
            QueueToken.user_id == current_user.id,
            QueueToken.status.in_(ACTIVE_STATUSES),
        )
        .order_by(QueueToken.created_at.desc())
    )
    if not token:
        return {"token": None}
    service = db.get(Service, token.service_id)
    return {
        "token": TokenPublic.model_validate(token).model_dump(),
        "position": calculate_position(db, token),
        "estimated_wait_minutes": estimate_wait(db, token.service_id, service.average_service_time),
    }


@router.get("/{service_id}/status", response_model=QueueStatusResponse)
def queue_status(service_id: int, db: Session = Depends(get_db)):
    service = db.get(Service, service_id)
    if not service or not service.active:
        raise HTTPException(status_code=404, detail="Service not found")

    active_counters = db.scalar(
        select(func.count(Counter.id)).where(
            Counter.service_id == service_id,
            Counter.status == CounterStatus.ACTIVE,
        )
    ) or 0

    waiting_count = db.scalar(
        select(func.count(QueueToken.id)).where(
            QueueToken.service_id == service_id,
            QueueToken.status.in_(ACTIVE_STATUSES),
        )
    ) or 0

    current = db.scalar(
        select(QueueToken)
        .where(
            QueueToken.service_id == service_id,
            QueueToken.status == TokenStatus.CALLED,
        )
        .order_by(QueueToken.called_at.asc())
    )

    recent = db.scalars(
        select(QueueToken)
        .where(QueueToken.service_id == service_id)
        .order_by(QueueToken.created_at.desc())
        .limit(10)
    ).all()

    wait = max(0, round(int(waiting_count) * service.average_service_time / max(1, int(active_counters))))

    return QueueStatusResponse(
        service=service,
        waiting_count=int(waiting_count),
        current_token=current.token_number if current else None,
        estimated_wait_minutes=wait,
        active_counters=int(active_counters),
        recent_tokens=[
            TokenSummary(
                id=t.id,
                token_number=t.token_number,
                status=t.status,
                priority=t.priority,
                created_at=t.created_at,
            )
            for t in recent
        ],
    )


@router.get("/token/{token_id}", response_model=TokenDetailsResponse)
def token_details(token_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    token = get_token_or_404(db, token_id)
    if token.user_id != current_user.id and current_user.role.value not in ("ADMIN", "COUNTER"):
        raise HTTPException(status_code=403, detail="You cannot view this token")
    service = db.get(Service, token.service_id)
    return TokenDetailsResponse(
        token=token,
        service=service,
        position=calculate_position(db, token) if token.status in ACTIVE_STATUSES else 0,
        estimated_wait_minutes=estimate_wait(db, token.service_id, service.average_service_time)
        if token.status in ACTIVE_STATUSES else 0,
    )


@router.post("/token/{token_id}/cancel")
def cancel_token(token_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    token = get_token_or_404(db, token_id)
    if token.user_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="You cannot cancel this token")
    if token.status not in ACTIVE_STATUSES:
        raise HTTPException(status_code=409, detail="Token is no longer active")

    old = token.status.value
    token.status = TokenStatus.CANCELLED
    token.completed_at = datetime.utcnow()
    db.commit()

    return {"message": "Token cancelled", "token_id": token.id, "old_status": old, "status": token.status}


@router.get("/recommend", response_model=RecommendationResponse)
def recommend_queue(service_id: int | None = None, db: Session = Depends(get_db)):
    query = select(Service).where(Service.active.is_(True)).order_by(Service.id)
    if service_id is not None:
        query = query.where(Service.id == service_id)
    services = db.scalars(query).all()

    options = []
    for service in services:
        active_counters = db.scalar(
            select(func.count(Counter.id)).where(
                Counter.service_id == service.id,
                Counter.status == CounterStatus.ACTIVE,
            )
        ) or 0
        waiting = db.scalar(
            select(func.count(QueueToken.id)).where(
                QueueToken.service_id == service.id,
                QueueToken.status.in_(ACTIVE_STATUSES),
            )
        ) or 0
        estimate = round(int(waiting) * service.average_service_time / max(1, int(active_counters)))
        options.append(
            QueueRecommendation(
                service_id=service.id,
                service_name=service.name,
                estimated_wait_minutes=int(estimate),
                waiting_count=int(waiting),
                active_counters=int(active_counters),
            )
        )

    options.sort(key=lambda x: (x.estimated_wait_minutes, x.service_id))
    return RecommendationResponse(
        recommendation=options[0] if options else None,
        options=options,
    )
