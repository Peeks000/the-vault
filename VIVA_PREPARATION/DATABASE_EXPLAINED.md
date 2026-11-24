# THE VAULT — Relational Database Architecture & Security Guide

> **Prepared for:** B.Tech Computer Science First-Year Viva Examination  
> **Student:** Yash  
> **Topic:** Comprehensive Explanation of Supabase & PostgreSQL Architecture

---

## 1. Relational Database Fundamentals

A **Relational Database Management System (RDBMS)** organizes data into structured tables consisting of **rows** (records) and **columns** (attributes). 

In THE VAULT, we use **PostgreSQL 15** hosted on the cloud via **Supabase**. Relationships between tables are formed using:
- **Primary Key (PK):** A unique identifier for every row in a table (e.g., `id` UUID in `auction_lots`).
- **Foreign Key (FK):** A column in one table that references the Primary Key of another table (e.g., `lot_id` in `lot_images` references `id` in `auction_lots`).

---

## 2. Entity-Relationship Diagram (ERD)

```
+──────────────────────────+             +──────────────────────────+
|       auth.users         |             |       user_profiles      |
|──────────────────────────|             |──────────────────────────|
| id (PK, UUID)            |◄────────────| id (PK, FK -> auth.users)|
| email                    |             | display_name             |
| created_at               |             | role ('super_admin', etc)|
+──────────────────────────+             +──────────────────────────+
                                                      │
                                                      │ places
                                                      ▼
+──────────────────────────+             +──────────────────────────+
|       auction_lots       | 1         * |           bids           |
|──────────────────────────|────────────►|──────────────────────────|
| id (PK, UUID)            |             | id (PK, UUID)            |
| title                    |             | lot_id (FK -> lots)      |
| category                 |             | bidder_id (FK -> users)  |
| current_bid (NUMERIC)    |             | amount (NUMERIC)         |
| bid_count (INT)          |             | status ('accepted', etc) |
| status ('live', etc)     |             +──────────────────────────+
+──────────────────────────+
             │ 1
             │ has many (1:N)
             ▼ *
+──────────────────────────+
|        lot_images        |
|──────────────────────────|
| id (PK, UUID)            |
| lot_id (FK -> lots,      |
|         ON DELETE CASCADE|
| image_url (TEXT)         |
| is_primary (BOOLEAN)     |
| sort_order (INT)         |
+──────────────────────────+
```

---

## 3. Database Tables Breakdown

### 3.1 `auction_lots` (Primary Entity)
Stores all auction items presented on the website.
- `id` (`UUID`): Universally unique 128-bit identifier generated via `gen_random_uuid()`.
- `legacy_id` (`TEXT`): String slug matching legacy mock IDs (`'watch'`, `'art'`, `'car'`) to preserve backwards compatibility.
- `lot_number` (`TEXT`): Traditional catalog number (e.g. `'LOT 024'`).
- `category` & `period`: Categorization fields used for client-side filtering.
- `title` & `subtitle` & `description`: Curatorial copy and provenance text.
- `estimate_low` & `estimate_high` (`NUMERIC`): Estimated valuation range in Indian Rupees (₹).
- `current_bid` (`NUMERIC`, default 0): Current highest bid amount.
- `bid_count` (`INTEGER`, default 0): Total number of recorded bids.
- `status` (`lot_status` ENUM): Restricted to `'draft'`, `'scheduled'`, `'live'`, `'closed'`, `'passed'`, or `'withdrawn'`.
- `ends_at` (`TIMESTAMPTZ`): ISO timestamp marking when the lot closes.

### 3.2 `lot_images` (One-to-Many Child Entity)
Stores high-resolution photograph assets for each auction lot.
- `lot_id` (`UUID`): Foreign key referencing `auction_lots.id`.
- **Constraint Rule — `ON DELETE CASCADE`:** If an auction lot is deleted from the database, all associated images in this table are **automatically deleted** to prevent orphaned data!
- `is_primary` (`BOOLEAN`): Indicates which image appears as the main banner on auction cards.
- `sort_order` (`INTEGER`): Controls the display order in the thumbnail switcher.

### 3.3 `bids` (Transactional Entity)
Records every bid placed by an authenticated collector.
- `lot_id` (`UUID`): References the auction lot.
- `bidder_id` (`UUID`): References the authenticated user placing the bid.
- `amount` (`NUMERIC`): Must be strictly greater than 0 (`CHECK (amount > 0)`).
- **Constraint Rule — `ON DELETE RESTRICT`:** If a lot has existing bids recorded against it, the database **blocks any attempt to delete the lot**, throwing PostgreSQL Error `23503`. This protects the integrity of financial history!

### 3.4 `user_profiles` (User Metadata)
Extends Supabase's internal `auth.users` authentication table with application-specific fields:
- `role` (`user_role` ENUM): `'collector'`, `'consignor'`, or `'super_admin'`.
- Only users with `role = 'super_admin'` are authorized to access `admin.html`.

---

## 4. PostgreSQL Data Types Explained

Examiners frequently ask first-year students about data types:

| Data Type | Used In | Why It Was Chosen |
| :--- | :--- | :--- |
| `UUID` | All table IDs | Unlike sequential integers (`1, 2, 3`), UUIDs cannot be guessed by malicious actors, preventing enumeration attacks (e.g., someone scraping `api/lots/1`, `api/lots/2`). |
| `NUMERIC(14, 2)` | `current_bid`, `amount` | `FLOAT` or `DOUBLE` in programming languages suffer from binary rounding errors (e.g., `0.1 + 0.2 = 0.30000000000000004`). `NUMERIC` stores exact decimal digits, making it essential for financial currencies! |
| `TIMESTAMPTZ` | `ends_at`, `created_at` | Stores timestamps **with time zone** information normalized to UTC, preventing timing bugs when collectors bid across different global time zones. |
| `ENUM` | `lot_status`, `role` | Enumerated types restrict inputs to a predefined list of valid strings, preventing typographical bugs like inserting `'liv'` instead of `'live'`. |

---

## 5. PostgreSQL Triggers & Functions

### What is a Trigger?
A **Trigger** is a database mechanism that automatically executes a specified function whenever an `INSERT`, `UPDATE`, or `DELETE` event occurs on a table.

### 1. `set_updated_at` Trigger
```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_auction_lots_updated_at
BEFORE UPDATE ON auction_lots
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
```
- **How it works:** Whenever a developer updates a row in `auction_lots`, this trigger automatically changes `updated_at` to the current system clock timestamp (`NOW()`). Developers don't have to manually update it in JavaScript!

### 2. `handle_new_user` Trigger
- **How it works:** Listens to `auth.users` on `INSERT`. As soon as a visitor registers a new account, this trigger immediately inserts a companion record into `user_profiles` with `role = 'collector'`.

---

## 6. Security Architecture & RLS Policies

### What is Row Level Security (RLS)?
In traditional web architectures, the frontend cannot talk directly to the database because anyone with browser DevTools could execute `SELECT * FROM users;`. A backend API (Express/Django) is usually required to filter queries.

With Supabase and **Row Level Security (RLS)**, PostgreSQL itself inspects the incoming JSON Web Token (JWT) on **every single SQL query** and applies row-by-row permission rules directly inside the database engine!

### RLS Policies in THE VAULT:

1. **Public Catalog Read Policy:**
   ```sql
   CREATE POLICY "Allow public read-only access for published lots"
   ON auction_lots FOR SELECT
   USING (status IN ('scheduled', 'live', 'closed') AND published_at IS NOT NULL);
   ```
   *Any anonymous visitor can browse active lots, but unpublished drafts are completely invisible.*

2. **Super-Admin Full Access Policy:**
   ```sql
   CREATE POLICY "Allow super-admins full CRUD access"
   ON auction_lots FOR ALL
   TO authenticated
   USING (is_super_admin());
   ```
   *Only users who cryptographically verify as super-admins can insert, edit, or delete lots.*

---

## 7. Migration Insights: Two Critical Viva Bug Fixes

### 1. Hardening `SECURITY DEFINER` Functions against Search Path Injections
In migration `20261114010000`, we fixed a critical PostgreSQL security vulnerability:
```sql
ALTER FUNCTION is_super_admin() SET search_path = public, pg_temp;
```
- **The Vulnerability:** `SECURITY DEFINER` functions run with database owner privileges. If `search_path` is left unset, an attacker could inject a fake function in a temporary schema that runs with elevated permissions (Privilege Escalation).
- **The Fix:** Explicitly pinning `search_path = public, pg_temp` neutralizes this exploit.

### 2. Resolving PostgreSQL Error `42501` (Permission Denied)
In migration `20261119000000`, we granted explicit SQL privileges:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON auction_lots TO authenticated;
GRANT SELECT ON auction_lots TO anon;
```
- **The Concept:** PostgreSQL has **two independent security layers**:
  1. **Table Privileges:** Does the role have permission to execute the SQL verb (`SELECT`, `INSERT`) on the table?
  2. **RLS Policies:** Which specific rows is the role allowed to see or modify?
- Even if RLS says "Allow", PostgreSQL halts with error `42501` if table-level grants are missing!
