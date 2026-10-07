from sqlalchemy import select

from .auth import hash_password
from .database import Base, SessionLocal, engine
from .models import Counter, CounterStatus, Service, User, UserRole

SERVICES = [
    ("Banking", "Banking and account-related services", 5),
    ("Documents", "Document verification and issue services", 7),
    ("Support", "General customer support", 4),
]


def get_or_create_user(db, name, email, password, role):
    user = db.scalar(select(User).where(User.email == email))
    if not user:
        user = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=role,
        )
        db.add(user)
        db.flush()
    return user


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        get_or_create_user(db, "Demo User", "user@example.com", "user123", UserRole.USER)
        get_or_create_user(db, "Counter Operator", "counter@example.com", "counter123", UserRole.COUNTER)
        get_or_create_user(db, "Administrator", "admin@example.com", "admin123", UserRole.ADMIN)

        service_map = {}
        for name, description, avg in SERVICES:
            service = db.scalar(select(Service).where(Service.name == name))
            if not service:
                service = Service(
                    name=name,
                    description=description,
                    average_service_time=avg,
                    active=True,
                )
                db.add(service)
                db.flush()
            service_map[name] = service

        for number, (name, _, _) in enumerate(SERVICES, start=1):
            service = service_map[name]
            counter_name = f"Counter {number}"
            exists = db.scalar(
                select(Counter).where(
                    Counter.name == counter_name,
                    Counter.service_id == service.id,
                )
            )
            if not exists:
                db.add(Counter(
                    name=counter_name,
                    service_id=service.id,
                    status=CounterStatus.ACTIVE,
                ))

        db.commit()
        print("Seed completed successfully.")
        print("Demo accounts:")
        print("  USER    user@example.com / user123")
        print("  COUNTER counter@example.com / counter123")
        print("  ADMIN   admin@example.com / admin123")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
