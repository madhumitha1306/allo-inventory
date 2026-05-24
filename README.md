# Allo Multi-Warehouse Inventory & Reservation System

A full-stack Next.js application built to handle real-time inventory tracking across distributed warehouse nodes. The architecture implements high-concurrency reservation locks combined with automated 10-minute expiry management to safely prevent stock overselling during competitive customer checkouts.

## Key Architectural Features

1. Concurrency Control & Anti-Overselling
To completely eliminate race conditions where multiple shoppers try to pull the last unit of stock simultaneously, the platform bypasses vulnerable "read-then-write" validation. Instead, reservations utilize atomic database-level transactions, enforcing condition checks directly inside the database engine to guarantee stock availability before committing a reservation.

2. Time-Based Reservation Locks
When a shopper clicks "Proceed to Checkout", a unique reservation token is generated alongside a database timestamp. This temporarily reallocates the item from Available to Held status.
* Lifecycle Guard: API endpoints calculate hold validity on-the-fly using a strict 10-minute ($600$ seconds) decay limit.
* Early Release Optimization: Users can explicitly cancel their transaction, executing an immediate database operation that returns the held inventory unit safely back to the global availability pool.

##  Tech Stack
* Framework: Next.js (App Router, React Client Components)
* Database Layer: Prisma ORM integrated with a hosted PostgreSQL cloud instance (Neon Cloud)
* Styling Engine: Tailwind CSS

##  API Reference

### 1. Fetch Real-Time Inventory
* Endpoint: `GET /api/inventory`
* Description: Extracts live stock balances across all registered regional warehouse operations.
* Response Status:`200 OK`

### 2. Request Stock Reservation
* Endpoint: `POST /api/reserve`
* Request Payload:
  ```json
  {
    "productId": "string",
    "warehouseId": "string",
    "quantity": 1
  }



* Response Statuses:
* `201 Created`: Hold secured successfully; returns a dynamic `reservationId`.
* `409 Conflict`: Targeted item is out of stock or intercepted by another concurrent actor.



### 3. Confirm Purchase Transaction

* Endpoint: `POST /api/confirm`
* Request Payload:
```json
{
  "reservationId": "string"
}

```


* Response Statuses:
* `200 OK`: Simulated processing complete; inventory unit permanently deducted.
* `410 Gone`: The 10-minute hold window closed; inventory unit was automatically returned to public availability.

4. Early Reservation Release

* Endpoint: `POST /api/release`
* Request Payload:
```json
{
  "reservationId": "string"
}

```


* Response Status: `200 OK` (Stock hold discarded and returned to the pool).

---

## Local Developer Setup

1. Install Project Dependencies:
```bash
npm install

```
2. Establish Environment Parameters:
Create a standard `.env` file in your root folder and add your hosted cloud database credentials:
```env
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@YOUR_HOST/neondb?sslmode=require"

```
3. Deploy Structural Migrations:
Synchronize your database schema blueprints directly to the hosted cloud layer:
```bash
npx prisma db push

```
4. Execute Core Data Seeding:
Populate your hosted tables automatically with seed catalog entries and warehouse items:
```bash
npx prisma db seed

```
5. Run the Application:
```bash
npm run dev

```
Open your browser to `http://localhost:3000` to interact with the full live system environment.
