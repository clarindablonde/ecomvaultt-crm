# EcomVaultt — AI Commerce OS

EcomVaultt is a high-performance Commerce Operating System built for multi-warehouse African e-commerce businesses managing cash-on-delivery (COD) logistics, omnichannel WhatsApp customer conversations, inventory intake approvals, and sales representative tracking.

---

## 🏗 Technology Stack

- **Frontend & App Shell:** Next.js 15 (App Router, TypeScript, React 19)
- **Styling & Design System:** Vercel × Linear × Apple minimalist dark aesthetic, custom CSS design system
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security & Realtime WebSockets)
- **Omnichannel Layer:** WhatsApp Cloud API, Instagram Direct, Facebook Messenger, TikTok
- **Commerce Features:** Multi-warehouse stock tracking, rider COD cash holding & remittance, sales rep leaderboards, AI Sales Coach

---

## 🗄 Database Setup (Supabase)

The complete SQL schema and initial seed data are provided in the `supabase/` directory:

1. **`supabase/schema.sql`**:
   - `profiles` with role-based access (`super_admin`, `representative`, `logistics_officer`, `finance`, `warehouse_manager`)
   - `warehouses` (Lagos Ikeja, Abuja Wuse II, Port Harcourt, Accra)
   - `products` & `inventory` with reorder thresholds and multi-warehouse counts
   - `inventory_intakes` with Super Admin approval workflows
   - `customers` (Customer 360 with health scores, tags, lifetime spend)
   - `conversations` & `messages` with AI coaching suggestions and message edit tracking
   - `orders` & `order_items` covering the entire pipeline from chat to bank remittal
   - `dispatch_assignments` for rider tracking and COD cash collection
   - `expenses` with tiered approval limits
   - Supabase Realtime enabled for live chat and order status updates
   - Row-Level Security (RLS) policies protecting sensitive profit margins

2. **`supabase/seed.sql`**:
   - Initial demo data matching `EcomVaultt-Design.html` for instant testing.

### How to apply the database schema:
1. Create a new project on [database.new](https://database.new) (Supabase).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste and run the contents of [`supabase/schema.sql`](file:///c:/Users/HP/OneDrive/Desktop/DevHub/clients-projects/clarindablonde/crm/supabase/schema.sql).
4. Run [`supabase/seed.sql`](file:///c:/Users/HP/OneDrive/Desktop/DevHub/clients-projects/clarindablonde/crm/supabase/seed.sql) to populate initial products, warehouses, and orders.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 🚀 Running the App Locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.
