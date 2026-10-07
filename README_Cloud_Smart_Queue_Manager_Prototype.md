# Cloud-Based Smart Queue Manager — Prototype

## 1. Project Overview

Cloud-Based Smart Queue Manager is a Distributed and Cloud Computing mini-project prototype.

The prototype demonstrates:

- Distributed client-server communication
- REST API communication
- Shared queue state
- Multiple service counters
- Concurrent-safe token generation
- Queue recommendation
- Estimated waiting time
- Priority handling
- User, counter, and admin roles
- Centralized database state
- Queue monitoring

**This version is local only. No cloud deployment is required.**

---

# 2. Architecture

```text
                    ┌─────────────────────────┐
                    │        Users            │
                    │  Browser / Mobile Web   │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │     React + Vite        │
                    │      Frontend            │
                    └────────────┬────────────┘
                                 │ REST API
                                 ▼
                    ┌─────────────────────────┐
                    │     FastAPI Backend     │
                    │ Authentication           │
                    │ Queue Management         │
                    │ Token Management         │
                    │ Counter Management       │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │       SQLite DB         │
                    │ Users / Services         │
                    │ Counters / Tokens       │
                    │ Queue History            │
                    └─────────────────────────┘
                                 ▲
                                 │
                    ┌────────────┴────────────┐
                    │ Counter / Admin Users   │
                    └─────────────────────────┘
```

---

# 3. Requirements

Install:

- Python 3.11 or newer
- Node.js 18 or newer
- npm
- VS Code recommended

Check:

```bash
python --version
node --version
npm --version
```

---

# 4. Backend Setup

Open a terminal in the backend folder.

## Windows

```bash
python -m venv venv
venv\Scripts\activate
```

## Linux/macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Seed the database:

```bash
python -m app.seed
```

Start FastAPI:

```bash
uvicorn app.main:app --reload
```

Backend will run at:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

ReDoc:

```text
http://127.0.0.1:8000/redoc
```

Health check:

```text
http://127.0.0.1:8000/api/health
```

---

# 5. Demo Accounts

## Normal User

```text
Email: user@example.com
Password: user123
Role: USER
```

## Counter Operator

```text
Email: counter@example.com
Password: counter123
Role: COUNTER
```

## Administrator

```text
Email: admin@example.com
Password: admin123
Role: ADMIN
```

---

# 6. Frontend Setup

Open another terminal.

Go to the frontend directory:

```bash
cd frontend
```

Install packages:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

# 7. Start Order

Always start the backend first.

### Terminal 1

```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

### Terminal 2

```bash
cd frontend
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

# 8. Main User Flow

1. Open the frontend.
2. Login using the normal user account.
3. Open the Dashboard.
4. View available services.
5. Select Banking, Documents, or Support.
6. Join a queue.
7. Receive a digital token.
8. View queue position.
9. View estimated waiting time.
10. Cancel the token if required.
11. Login as the counter operator in another browser/incognito window.
12. Open Counter Dashboard.
13. Call the next token.
14. Serve or skip the token.
15. Return to the user dashboard and observe the queue status.

---

# 9. Admin Flow

Login with:

```text
admin@example.com
admin123
```

Open:

```text
Admin Dashboard
```

View:

- Total users
- Active counters
- Waiting tokens
- Served tokens
- Skipped tokens
- Cancelled tokens
- Service-wise statistics

---

# 10. API Endpoints

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

## Services

```text
GET /api/services
GET /api/services/{service_id}
```

## Queue

```text
POST /api/queues/join
GET /api/queues/my-token
GET /api/queues/{service_id}/status
GET /api/queues/token/{token_id}
POST /api/queues/token/{token_id}/cancel
GET /api/queues/recommend
```

## Counter

```text
GET /api/counters
GET /api/counters/{counter_id}/queue
POST /api/counters/{counter_id}/next
POST /api/counters/{counter_id}/serve/{token_id}
POST /api/counters/{counter_id}/skip/{token_id}
POST /api/counters/{counter_id}/cancel/{token_id}
```

## Admin

```text
GET /api/admin/dashboard
```

## Health

```text
GET /api/health
```

---

# 11. Troubleshooting

## Frontend says Backend Unavailable

Check that FastAPI is running:

```bash
uvicorn app.main:app --reload
```

Then open:

```text
http://127.0.0.1:8000/docs
```

If Swagger opens, the backend is running.

---

## CORS Error

Confirm the frontend is running on:

```text
http://localhost:5173
```

and that the backend CORS configuration allows that origin.

---

## Database Problems

For the prototype, the database is SQLite.

If the database needs to be recreated, stop the backend and remove the generated SQLite database file, then run:

```bash
python -m app.seed
```

---

## Login Does Not Work

Make sure the seed script has been executed:

```bash
python -m app.seed
```

Then use the demo credentials from Section 5.

---

# 12. Screenshots for College Report

After the application works, capture these screenshots:

1. Login/Register
2. User Dashboard
3. Service Selection
4. Queue Recommendation
5. Join Queue
6. Digital Token
7. Queue Position and Estimated Wait
8. Live Queue Status
9. Counter Dashboard
10. Next Token Called
11. Admin Dashboard
12. Queue Statistics
13. Swagger API
14. Concurrent Token Generation Test
15. Final Complete Workflow

Use these screenshots to replace the placeholders in the college report.

---

# 13. DCC Concepts Demonstrated

The prototype can be explained using:

### Distributed Clients

Different users and counters access the same backend from separate browser sessions.

### Shared State

Queue and token information is stored centrally in the database.

### REST Communication

The React frontend communicates with FastAPI through REST APIs.

### Concurrency

Multiple users can attempt to join a queue at approximately the same time.

### Synchronization

Database transactions and uniqueness constraints protect token allocation.

### Resource Sharing

Multiple counters share the same queue-management backend.

### Scalability

The architecture can later be deployed to cloud infrastructure and scaled.

### Availability

The service can later be configured for highly available cloud deployment.

---

# 14. Important Academic Note

This is a **prototype implementation**.

Do not claim:

- AWS deployment
- production scalability
- 100% availability
- real-world throughput
- cloud auto-scaling
- Kubernetes deployment

unless those features are actually implemented and measured.

For the current mini-project, explain AWS/cloud deployment as a proposed extension if it is not implemented.

---

# 15. Recommended Demonstration

For the final college demonstration:

### Browser 1

Login as:

```text
user@example.com
```

Join Banking queue.

Show:

```text
B-001
Position: 1
Estimated Wait: ...
```

### Browser 2 / Incognito

Login as:

```text
counter@example.com
```

Call next token.

### Browser 1

Refresh/poll the queue status and show that the queue state changes.

### Browser 3

Login as:

```text
admin@example.com
```

Show the admin statistics.

This demonstrates that multiple clients are interacting with shared backend state.

---

# 16. Project Completion Checklist

- [ ] Backend starts successfully
- [ ] Database initializes
- [ ] Seed accounts work
- [ ] User registration works
- [ ] Login works
- [ ] Service list works
- [ ] Queue joining works
- [ ] Unique token is generated
- [ ] Queue position works
- [ ] Estimated waiting time works
- [ ] Token cancellation works
- [ ] Counter dashboard works
- [ ] Call next works
- [ ] Serve works
- [ ] Skip works
- [ ] Admin dashboard works
- [ ] Frontend connects to backend
- [ ] CORS works
- [ ] Concurrent token test completed
- [ ] Screenshots captured
- [ ] College report updated

---

# 17. Final Goal

The prototype should be simple enough to build and demonstrate in one day while clearly showing the Distributed and Cloud Computing concepts required for the mini-project.
