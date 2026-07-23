# Wholesale ERP

A full-stack Wholesale Enterprise Resource Planning (ERP) application built using React, TypeScript, Node.js, Express, Prisma ORM, and PostgreSQL.

The system enables wholesale businesses to efficiently manage customers, inventory, products, sales challans, notifications, and audit logs through a secure role-based platform.

---

## Live Demo

Frontend:
https://YOUR-VERCEL-URL.vercel.app

Backend API:
https://YOUR-RENDER-URL.onrender.com

---

## Features

### Authentication

- JWT Authentication
- Refresh Token Authentication
- HTTP-only Cookies
- Role-Based Access Control (RBAC)
- Protected Routes

### Dashboard

- Business Overview
- Customer Statistics
- Product Statistics
- Inventory Overview
- Revenue Summary
- Sales Analytics

### Customer Management

- Create Customers
- Edit Customers
- Delete Customers
- Customer Notes
- Follow-ups
- Search
- Pagination

### Product Management

- Create Products
- Update Products
- Product Categories
- Product Pricing
- Search
- Pagination

### Inventory Management

- Warehouse Inventory
- Stock Adjustments
- Inventory Ledger
- Low Stock Monitoring

### Sales Challans

- Create Challans
- Draft Workflow
- Confirmation Workflow
- Invoice Generation

### Notifications

- System Notifications
- User Notifications

### Activity Logs

- User Activity Tracking
- Audit Logs

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Query
- Axios
- React Hook Form
- Framer Motion
- Recharts

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT
- Zod
- Helmet
- CORS

### Database

- PostgreSQL

### Deployment

- Vercel
- Render

---

## Project Structure

```text
wholesale-erp/

├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.ts
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
│
└── README.md
```

---

## System Architecture

```
React + Vite
      │
      ▼
REST API (Express)
      │
      ▼
Prisma ORM
      │
      ▼
PostgreSQL
```

---

## Authentication Flow

```
User Login
      │
      ▼
JWT Access Token
      │
      ▼
Refresh Token
      │
      ▼
Protected API Routes
```

---

## Database Entities

- Users
- Customers
- Products
- Warehouses
- Inventory
- Challans
- Challan Items
- Notifications
- Activity Logs

---

## Installation

### Clone Repository

```bash
git clone https://github.com/MohanaKrishna090033/wholesale-erp.git

cd wholesale-erp
```

---

## Backend Setup

```bash
cd backend

npm install
```

Create a `.env` file.

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
REFRESH_SECRET=your_refresh_secret
PORT=4000
```

Run the backend.

```bash
npm run dev
```

---

## Frontend Setup

```bash
cd frontend

npm install
```

Create a `.env` file.

```env
VITE_API_BASE_URL=http://localhost:4000
```

Run the frontend.

```bash
npm run dev
```

---

## Deployment

Frontend

- Vercel

Backend

- Render

Database

- PostgreSQL

---

## Security

- JWT Authentication
- Refresh Tokens
- Password Hashing
- Role-Based Authorization
- HTTP-only Cookies
- Helmet
- CORS
- Zod Validation
- Prisma SQL Injection Protection
- Audit Logging

---

## Future Enhancements

- Purchase Orders
- Supplier Management
- Analytics Dashboard
- Email Notifications
- Barcode Scanner
- PDF Reports
- Excel Export
- Multi-Warehouse Support

---

## Testing

The application has been tested for:

- Authentication
- Customer Management
- Product Management
- Inventory Management
- Sales Challans
- Dashboard
- Notifications
- Activity Logs
- API Integration
- Deployment

---

## Author

S Mohana Krishna

GitHub:
https://github.com/MohanaKrishna090033
