# Cloud-Based Smart Queue Manager — Backend Prototype

Local FastAPI backend for the Distributed and Cloud Computing mini-project.

## Stack

- Python 3.11+
- FastAPI
- Uvicorn
- SQLAlchemy
- SQLite
- Pydantic
- JWT authentication
- bcrypt
- pytest

## 1. Setup

### Windows

```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Linux/macOS

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` if you want to customize settings.

## 2. Seed Database

```bash
python -m app.seed
```

Demo accounts:

| Role | Email | Password |
|---|---|---|
| User | user@example.com | user123 |
| Counter | counter@example.com | counter123 |
| Admin | admin@example.com | admin123 |

## 3. Run

```bash
uvicorn app.main:app --reload
```

API:

http://127.0.0.1:8000

Swagger:

http://127.0.0.1:8000/docs

ReDoc:

http://127.0.0.1:8000/redoc

Health:

http://127.0.0.1:8000/api/health

## 4. Main API Groups

Authentication:
- POST `/api/auth/register`
- POST `/api/auth/login`

Services:
- GET `/api/services`
- GET `/api/services/{service_id}`

Queues:
- POST `/api/queues/join`
- GET `/api/queues/my-token`
- GET `/api/queues/{service_id}/status`
- GET `/api/queues/token/{token_id}`
- POST `/api/queues/token/{token_id}/cancel`
- GET `/api/queues/recommend`

Counters:
- GET `/api/counters`
- GET `/api/counters/{counter_id}/queue`
- POST `/api/counters/{counter_id}/next`
- POST `/api/counters/{counter_id}/serve/{token_id}`
- POST `/api/counters/{counter_id}/skip/{token_id}`
- POST `/api/counters/{counter_id}/cancel/{token_id}`

Admin:
- GET `/api/admin/dashboard`
- GET `/api/admin/tokens`

## 5. Frontend

The React frontend should use:

`http://127.0.0.1:8000/api`

as its API base URL.

CORS permits:
- http://localhost:5173
- http://127.0.0.1:5173

## 6. Tests

Run:

```bash
pytest -q
```

The test suite covers health, registration/login, services, queue joining, role protection, counter processing, and concurrent token generation.

## 7. Prototype Scope

This backend is intentionally local and lightweight.

It does not claim:
- AWS deployment
- production scalability
- high availability
- Kubernetes
- Kafka
- Redis
- WebSocket infrastructure

The architecture is cloud-ready conceptually, but deployment is outside the prototype scope.

## 8. DCC Demonstration

The backend demonstrates:
- distributed client/API communication
- shared database state
- concurrency control
- synchronization
- multiple counters
- resource sharing
- queue coordination
- role-based access
