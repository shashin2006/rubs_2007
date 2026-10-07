from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_roles
from ..models import Counter, CounterStatus, QueueToken, TokenStatus, User, UserRole

router = APIRouter(prefix="/api/counters", tags=["Counters"])
operator = require_roles(UserRole.COUNTER, UserRole.ADMIN)


def get_counter(db: Session, counter_id: int) -> Counter:
    counter = db.get(Counter, counter_id)
    if not counter:
        raise HTTPException(status_code=404, detail="Counter not found")
    return counter


def update_status(db: Session, token: QueueToken, new_status: TokenStatus, changed_by: int | None):
    from ..models import QueueHistory
    old = token.status.value
    token.status = new_status
    if new_status == TokenStatus.CALLED:
        token.called_at = datetime.utcnow()
    if new_status in (TokenStatus.SERVED, TokenStatus.SKIPPED, TokenStatus.CANCELLED):
        token.completed_at = datetime.utcnow()
    db.add(QueueHistory(
        token_id=token.id,
        old_status=old,
        new_status=new_status.value,
        changed_by=changed_by,
    ))


@router.get("")
def list_counters(db: Session = Depends(get_db), _: User = Depends(operator)):
    counters = db.scalars(select(Counter).order_by(Counter.id)).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "service_id": c.service_id,
            "status": c.status,
            "current_token_id": c.current_token_id,
        }
        for c in counters
    ]


@router.get("/{counter_id}/queue")
def counter_queue(counter_id: int, db: Session = Depends(get_db), _: User = Depends(operator)):
    counter = get_counter(db, counter_id)
    tokens = db.scalars(
        select(QueueToken)
        .where(
            QueueToken.service_id == counter.service_id,
            QueueToken.status.in_([TokenStatus.WAITING, TokenStatus.CALLED]),
        )
        .order_by(
            QueueToken.priority.desc(),
            QueueToken.created_at.asc(),
        )
    ).all()
    return {"counter": counter.name, "service_id": counter.service_id, "queue": tokens}


@router.post("/{counter_id}/next")
def next_token(counter_id: int, db: Session = Depends(get_db), current_user: User = Depends(operator)):
    counter = get_counter(db, counter_id)
    if counter.status != CounterStatus.ACTIVE:
        raise HTTPException(status_code=409, detail="Counter is inactive")

    if counter.current_token_id:
        current = db.get(QueueToken, counter.current_token_id)
        if current and current.status == TokenStatus.CALLED:
            raise HTTPException(status_code=409, detail="Finish the current token before calling another")

    token = db.scalar(
        select(QueueToken)
        .where(
            QueueToken.service_id == counter.service_id,
            QueueToken.status == TokenStatus.WAITING,
        )
        .order_by(
            QueueToken.priority.desc(),
            QueueToken.created_at.asc(),
        )
    )
    if not token:
        raise HTTPException(status_code=404, detail="No waiting token")

    update_status(db, token, TokenStatus.CALLED, current_user.id)
    token.counter_id = counter.id
    counter.current_token_id = token.id
    db.commit()
    db.refresh(token)

    return {
        "message": "Next token called",
        "token": {
            "id": token.id,
            "token_number": token.token_number,
            "status": token.status,
            "priority": token.priority,
        },
    }


def complete_token(
    counter_id: int,
    token_id: int,
    new_status: TokenStatus,
    db: Session,
    current_user: User,
):
    counter = get_counter(db, counter_id)
    token = db.get(QueueToken, token_id)
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    if token.counter_id != counter.id:
        raise HTTPException(status_code=400, detail="Token is not assigned to this counter")
    if token.status != TokenStatus.CALLED:
        raise HTTPException(status_code=409, detail="Only a called token can be completed")

    update_status(db, token, new_status, current_user.id)
    counter.current_token_id = None
    db.commit()
    return {"message": f"Token marked {new_status.value.lower()}", "token_id": token.id, "status": token.status}


@router.post("/{counter_id}/serve/{token_id}")
def serve(counter_id: int, token_id: int, db: Session = Depends(get_db), current_user: User = Depends(operator)):
    return complete_token(counter_id, token_id, TokenStatus.SERVED, db, current_user)


@router.post("/{counter_id}/skip/{token_id}")
def skip(counter_id: int, token_id: int, db: Session = Depends(get_db), current_user: User = Depends(operator)):
    return complete_token(counter_id, token_id, TokenStatus.SKIPPED, db, current_user)


@router.post("/{counter_id}/cancel/{token_id}")
def cancel(counter_id: int, token_id: int, db: Session = Depends(get_db), current_user: User = Depends(operator)):
    return complete_token(counter_id, token_id, TokenStatus.CANCELLED, db, current_user)
