from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Counter, CounterStatus, Service
from ..schemas import CounterPublic, ServicePublic

router = APIRouter(prefix="/api/services", tags=["Services"])


@router.get("", response_model=list[ServicePublic])
def list_services(db: Session = Depends(get_db)):
    return list(db.scalars(select(Service).where(Service.active.is_(True)).order_by(Service.id)))


@router.get("/{service_id}")
def get_service(service_id: int, db: Session = Depends(get_db)):
    service = db.get(Service, service_id)
    if not service or not service.active:
        raise HTTPException(status_code=404, detail="Service not found")
    counters = db.scalars(
        select(Counter).where(
            Counter.service_id == service_id,
            Counter.status == CounterStatus.ACTIVE,
        ).order_by(Counter.id)
    ).all()
    return {
        "service": ServicePublic.model_validate(service).model_dump(),
        "counters": [CounterPublic.model_validate(c).model_dump() for c in counters],
    }
