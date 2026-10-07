# Cloud-Based Smart Queue Manager (Frontend Prototype)

**Distributed and Cloud Computing Mini-Project**  
A high-performance, responsive React frontend prototype for a cloud-based smart queue management system. This application interfaces with a local FastAPI REST API backend running at `http://127.0.0.1:8000`.

---

## 1. Complete Folder Structure

```text
frontend/
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
├── src/
│   ├── api/
│   │   └── api.ts                   # Centralized API layer, JWT handling & error handlers
│   ├── context/
│   │   └── AuthContext.tsx          # Authentication state, role management & connectivity
│   ├── types/
│   │   └── index.ts                 # TypeScript data contracts & enums
│   ├── components/
│   │   ├── Navbar.tsx               # Top bar with user profile, role badge & logout
│   │   ├── Sidebar.tsx              # Role-aware responsive navigation sidebar
│   │   ├── ProtectedRoute.tsx       # RBAC client-side route guard
│   │   ├── BackendStatusBanner.tsx  # FastAPI connectivity ping & Sandbox mode toggle
│   │   ├── ServiceCard.tsx          # Department card with priority modal (Normal/Priority)
│   │   ├── QueueStatusCard.tsx      # Polling live queue status display
│   │   ├── TokenCard.tsx            # Digital token badge with position & cancel modal
│   │   ├── CounterCard.tsx          # Counter terminal station card
│   │   ├── StatisticCard.tsx        # KPI metrics card for admin & counter views
│   │   ├── StatusBadge.tsx          # Semantic status badge (WAITING, SERVING, etc.)
│   │   ├── LoadingSpinner.tsx       # Uniform loading indicator
│   │   ├── ErrorMessage.tsx         # Backend error & server start troubleshooting guide
│   │   ├── ConfirmModal.tsx         # Confirmation dialog for critical actions
│   │   └── EmptyState.tsx           # Fallback for empty queues and lists
│   ├── pages/
│   │   ├── Login.tsx                # Authentication page with 1-click demo accounts
│   │   ├── Register.tsx             # New user registration page
│   │   ├── Dashboard.tsx            # Student/citizen dashboard & recommendation
│   │   ├── Services.tsx             # Departmental service list & token generator
│   │   ├── MyToken.tsx              # Active token status & position tracking
│   │   ├── QueueStatus.tsx          # Multi-counter live polling status board (6s)
│   │   ├── CounterDashboard.tsx     # Operator console (Call Next, Serve, Skip, Cancel)
│   │   └── AdminDashboard.tsx       # System-wide metrics & workload distribution
│   ├── App.tsx                      # Application router and protected route tree
│   ├── main.tsx                     # Vite React DOM entry point
│   └── index.css                    # Tailwind CSS v4 styling
```

---

## 2. Installation Commands

Clone or download the project files into your local directory, then install the dependencies:

```bash
# Navigate to frontend folder
cd frontend

# Install all npm dependencies
npm install
```

---

## 3. Run Command

Start the local development server:

```bash
npm run dev
```

The application will be accessible at:
- `http://localhost:5173` (or port assigned by Vite)

---

## 4. Backend URL Configuration

All API requests are routed through a single base configuration constant defined in `src/api/api.ts`:

```typescript
export const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000/api';
```

- **Environment Variable Override:**  
  You can set `VITE_API_BASE_URL` in `.env`:
  ```bash
  VITE_API_BASE_URL=http://127.0.0.1:8000/api
  ```
- **Runtime UI Override:**  
  Click the **Settings icon** in the top connectivity banner to change the API Base URL directly in the browser during presentations without restarting Vite.

---

## 5. Demo Credentials

The login page includes 1-click autofill buttons for all 3 roles:

| Role | Email | Password | Assigned Landing Page |
|---|---|---|---|
| **Student / User** | `user@example.com` | `user123` | `/dashboard` (User Dashboard) |
| **Counter Operator** | `counter@example.com` | `counter123` | `/counter` (Counter Terminal) |
| **System Admin** | `admin@example.com` | `admin123` | `/admin` (Analytics & Oversight) |

---

## 6. API Integration Explanation

The application strictly implements the required backend contract:

### Authentication & Sessions
- `POST /api/auth/register` — Registers new client account and receives JWT.
- `POST /api/auth/login` — Authenticates user, stores token in `localStorage`, and sends `Authorization: Bearer <token>` on all requests.

### User & Token Operations
- `GET /api/services` — Retrieves all available department queue services.
- `GET /api/services/{service_id}` — Retrieves individual service details.
- `POST /api/queues/join` — Submits `{ service_id, priority: "NORMAL" | "PRIORITY" }` and receives a digital token.
- `GET /api/queues/my-token` — Checks user's current waiting or active token.
- `GET /api/queues/{service_id}/status` — Returns department's live token, waiting count, and active counters.
- `GET /api/queues/token/{token_id}` — Gets full token progress information.
- `POST /api/queues/token/{token_id}/cancel` — Forfeits the user's active position in the queue.
- `GET /api/queues/recommend` — Dynamically returns the recommended service based on shortest wait times.

### Counter Operator Console
- `GET /api/counters` — Lists available workstations and active operators.
- `GET /api/counters/{counter_id}/queue` — Retrieves ordered queue (prioritizing `PRIORITY` tokens).
- `POST /api/counters/{counter_id}/next` — Summons the next waiting token to the counter.
- `POST /api/counters/{counter_id}/serve/{token_id}` — Completes customer session.
- `POST /api/counters/{counter_id}/skip/{token_id}` — Marks absent customer as skipped.
- `POST /api/counters/{counter_id}/cancel/{token_id}` — Cancels an abandoned token.

### Administrative Monitoring
- `GET /api/admin/dashboard` — Global telemetry: Total Users, Active Counters, Waiting, Served, Skipped, and Cancelled counts.
- `GET /api/health` — Lightweight health ping check for backend connectivity.

---

## 7. Troubleshooting Instructions

### Backend Unavailable ("Backend unavailable. Please start the FastAPI server.")
If you see this notification on any screen:
1. Ensure your FastAPI server is running:
   ```bash
   cd backend
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
2. Verify CORS is enabled in your FastAPI application (`main.py`):
   ```python
   from fastapi import FastAPI
   from fastapi.middleware.cors import CORSMiddleware

   app = FastAPI()

   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"], # or ["http://localhost:5173", "http://127.0.0.1:5173"]
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```
3. Check the base URL in the top banner: It should point to `http://127.0.0.1:8000/api`.
4. **Offline Evaluation / Sandbox Mode:** If presenting when the local Python backend is not active, toggle the **"Demo Simulation Sandbox"** switch in the top banner or on the error dialog to run interactive prototype workflows in-browser.
