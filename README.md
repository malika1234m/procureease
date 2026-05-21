# ProcureEase ERP

> A full-stack Enterprise Resource Planning system built for Sri Lankan SMEs — managing procurement, inventory, HR, payroll, and finance from a single platform.

---

## Overview

ProcureEase is a production-ready ERP platform covering the full procurement lifecycle — from raising a purchase requisition to receiving goods, processing supplier invoices, and running payroll. Built specifically with Sri Lankan business compliance in mind (EPF/ETF).

### Key Features

- **Role-based access** — 5 user roles with tailored dashboards and navigation
- **Full procurement workflow** — Requisition → Approval → Purchase Order → GRN
- **Inventory management** — Real-time stock tracking, low-stock alerts, categories
- **HR & Payroll** — Employee management, attendance, EPF/ETF-compliant payroll
- **Finance** — Supplier invoices, payment recording, expense tracking
- **Analytics** — 5 report dashboards with live charts across all modules
- **User management** — Admin can create and manage all system users
- **Sri Lanka compliance** — EPF (8%/12%) and ETF (3%) auto-calculated on payroll

---

## Modules

| Module | Description |
|--------|-------------|
| **Dashboard** | Role-specific overview with live KPIs and charts |
| **Suppliers** | Vendor directory — CRUD, ratings, payment terms, status |
| **Procurement** | PR workflow — raise, approve/reject, convert to PO |
| **Inventory** | Items, categories, stock adjustments, GRN, low-stock alerts |
| **HR & Payroll** | Employees, attendance tracking, EPF/ETF payroll processing |
| **Finance** | Supplier invoices, payments, expense recording and approval |
| **Reports** | Analytics across procurement, inventory, HR, and finance |
| **Users** | System user management with role assignment (admin only) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Lucide Icons |
| Backend | Node.js 20, Express.js |
| Database | PostgreSQL 16 |
| Authentication | JWT (jsonwebtoken + bcryptjs), 7-day expiry |
| Deployment | Docker + docker-compose, Nginx (SPA + API proxy) |

---

## User Roles

| Role | Access |
|------|--------|
| `admin` | Full access — all modules + user management |
| `procurement_manager` | Procurement, suppliers, inventory, reports |
| `store_keeper` | Inventory management only |
| `finance_officer` | Finance module + reports |
| `employee` | Submit purchase requisitions only |

---

## Demo Accounts

All demo accounts use the password **`password`**.

| Email | Role |
|-------|------|
| admin@procureease.com | Administrator |
| procurement@procureease.com | Procurement Manager |
| store@procureease.com | Store Keeper |
| finance@procureease.com | Finance Officer |
| employee@procureease.com | Employee |

> **Important:** Change these passwords immediately in a production environment.

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- PostgreSQL 16
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/your-username/procureease.git
cd procureease
```

### 2. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Set up the database

```bash
# Create the database
psql -U your_postgres_user -c "CREATE DATABASE procureease;"

# Run the schema (creates all tables + default admin user)
psql -U your_postgres_user -d procureease -f backend/src/config/schema.sql
```

### 4. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=8000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=procureease
DB_USER=your_postgres_username
DB_PASSWORD=your_password

JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d

ALLOWED_ORIGINS=http://localhost:5173
```

### 5. Start development servers

```bash
# Terminal 1 — Backend (http://localhost:8000)
cd backend && npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend && npm run dev
```

Open **http://localhost:5173** and log in with `admin@procureease.com` / `password`.

---

## Docker Deployment (Production)

### 1. Set environment variables

```bash
cp .env.production .env
```

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Edit `.env` and set `DB_PASSWORD`, `JWT_SECRET`, and `ALLOWED_ORIGINS`.

### 2. Build and run

```bash
docker-compose up -d --build
```

| URL | Description |
|-----|-------------|
| `http://localhost` | Frontend app |
| `http://localhost/api/...` | Backend API (proxied through Nginx) |
| `http://localhost/health` | API health check |

### 3. Stop

```bash
docker-compose down

# Also remove database volume
docker-compose down -v
```

---

## Cloud Deployment

### Railway *(recommended)*

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a **PostgreSQL** plugin
4. Set the environment variables from `.env.production`
5. Deploy — Railway auto-detects the Dockerfile

### Render

1. Create a **Web Service** pointing to `backend/`
2. Create a **PostgreSQL** database
3. Set environment variables and deploy
4. For the frontend, create a separate **Static Site** from `frontend/` with build command `npm run build`

### Vercel (Frontend only)

```bash
cd frontend
npm run build
npx vercel --prod
```

Set `VITE_API_URL` to your backend URL in Vercel environment variables.

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

| Prefix | Methods | Description |
|--------|---------|-------------|
| `/api/auth` | POST | Login, register |
| `/api/auth/me` | GET | Current user profile |
| `/api/users` | GET, POST, PUT, DELETE, PATCH | User management (admin only) |
| `/api/suppliers` | GET, POST, PUT, DELETE | Supplier CRUD + stats |
| `/api/requisitions` | GET, POST, PATCH, DELETE | Purchase requisitions + approve/reject |
| `/api/purchase-orders` | GET, POST, PATCH | Purchase orders + status updates |
| `/api/inventory` | GET, POST, PUT, DELETE, PATCH | Items, categories, stock adjust, GRN |
| `/api/hr` | GET, POST, PUT, DELETE, PATCH | Employees, attendance, payroll |
| `/api/finance` | GET, POST, PATCH, DELETE | Invoices, payments, expenses |
| `/api/reports` | GET | Overview, procurement, inventory, HR, finance analytics |
| `/health` | GET | Server + database health check |

---

## Project Structure

```
procureease/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js              # PostgreSQL connection pool
│   │   │   ├── schema.sql         # Full database schema (15 tables)
│   │   │   └── migrate.sql        # Column additions for upgrades
│   │   ├── controllers/           # Business logic (9 controllers)
│   │   │   ├── auth.controller.js
│   │   │   ├── users.controller.js
│   │   │   ├── supplier.controller.js
│   │   │   ├── requisition.controller.js
│   │   │   ├── purchaseOrder.controller.js
│   │   │   ├── inventory.controller.js
│   │   │   ├── hr.controller.js
│   │   │   ├── finance.controller.js
│   │   │   └── reports.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT protect + role authorize
│   │   │   └── errorHandler.js
│   │   ├── routes/                # 9 route files
│   │   └── server.js              # Express app entry point
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── finance/           # InvoiceModal, PaymentModal, ExpenseModal
│   │   │   ├── hr/                # EmployeeModal, PayslipModal
│   │   │   ├── inventory/         # ItemModal, CategoryModal, AdjustModal
│   │   │   ├── layout/            # Sidebar, Topbar, Layout
│   │   │   ├── procurement/       # PRModal, POModal, PRDetailModal
│   │   │   ├── suppliers/         # SupplierModal, DeleteModal
│   │   │   └── users/             # UserModal
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # JWT auth state
│   │   ├── pages/                 # 10 page components
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx      # Role-specific dashboards
│   │   │   ├── Suppliers.jsx
│   │   │   ├── Procurement.jsx
│   │   │   ├── Inventory.jsx
│   │   │   ├── HR.jsx
│   │   │   ├── Finance.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── Users.jsx
│   │   ├── services/              # Axios API service layers
│   │   ├── index.css              # Design system + utility classes
│   │   └── App.jsx                # React Router setup
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Database Schema

15 tables across 5 domains:

| Domain | Tables |
|--------|--------|
| Auth | `users` |
| Suppliers | `suppliers` |
| Procurement | `purchase_requisitions`, `pr_items`, `purchase_orders`, `po_items`, `grn`, `grn_items` |
| Inventory | `items`, `categories`, `stock_movements` |
| HR | `employees`, `attendance`, `payroll` |
| Finance | `supplier_invoices`, `payments`, `expenses` |

---

## Sri Lanka Payroll Compliance

| Contribution | Rate | Who Pays |
|-------------|------|----------|
| EPF Employee | 8% of gross salary | Employee |
| EPF Employer | 12% of gross salary | Employer |
| ETF Employer | 3% of gross salary | Employer |

Calculated automatically when generating monthly payroll. Displayed on payslips with print support.

---

## Security Notes

Before going to production:

- [ ] Change all default passwords via the Users module
- [ ] Set a strong random `JWT_SECRET` (64+ characters)
- [ ] Set `NODE_ENV=production` in your environment
- [ ] Restrict `ALLOWED_ORIGINS` to your actual frontend domain
- [ ] Enable HTTPS on your server/reverse proxy

---

## License

MIT — free to use and modify for commercial projects.

---

## Author

Built as a full-stack ERP showcase project for Sri Lankan SMEs.  
Stack: React · Node.js · PostgreSQL · Docker
