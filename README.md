# CampusDesk — College Complaint Management System

**CampusDesk** is a full-featured web application designed for colleges and universities to streamline the logging, tracking, management, and resolution of student grievances. It bridges the communication gap between students and campus administration with real-time status tracking, automated alerts, and an integrated AI Help Desk.

---

## 🏗️ Architecture & Technology Stack

- **Frontend Framework:** [Next.js 14](https://nextjs.org/) (App Router, React 18, CSS variables, responsive design)
- **Authentication:** **Local Authentication Engine**
  - Cryptographic password hashing using native Node.js `crypto.scryptSync` with unique random cryptographic salts.
  - Constant-time verification using `crypto.timingSafeEqual`.
  - Tamper-proof session management using HMAC-SHA256 signed HTTP-only cookies.
  - Zero third-party auth dependencies, instant signups, and no external email confirmation blockers.
- **Database Service:** [Supabase PostgreSQL](https://supabase.com/)
  - Strict database backend: all student profiles, complaints, departments, and notification records are hosted directly in Supabase Postgres.
  - Automated database triggers for complaint status transitions and timestamp updates.
- **File Storage:** [Supabase Storage](https://supabase.com/storage)
  - Dedicated public `complaint-images` bucket for student photo attachments.
- **AI Help Desk:** [Groq Cloud](https://groq.com/) (Llama 3.1)
  - Intelligent campus assistant helping students categorize issues and navigate campus complaint policies.

---

## ✨ Features

### 🎓 For Students
- **Instant Account Creation:** Fast registration using official college roll number, course, department, and semester.
- **Lodge Complaints:** Submit issues across categories (Wi-Fi, Hostel, Library, Canteen, Faculty, Examination, etc.) with priority levels and photo evidence.
- **Ticket Stub & Live Tracker:** Every submission receives a unique ticket ID (e.g. `C101`) and a 3-step visual tracker (*Pending* → *In Progress* → *Resolved*).
- **Automated Notifications:** Get notified immediately whenever an administrator updates complaint status or leaves remarks.
- **Track by Ticket ID:** Search any complaint ticket ID directly for quick progress checks.
- **Profile & Password Management:** Update contact information or change password securely from the profile panel.

### 🛡️ For Administrators
- **Role-Guarded Access:** Dedicated `/admin/login` portal with server-side role validation.
- **Executive Dashboard:** Live metrics displaying total students, total complaints, pending vs. resolved breakdown, and department workloads.
- **Complaint Resolution Workspace:** Filter issues by status, department, or keyword; reassign departments, update status, and leave remarks visible to the student.
- **Department Management:** Add, edit, and organize campus departments and department heads.

### 🤖 AI Help Desk
- Interactive chatbot embedded directly in the portal to answer common questions, recommend the right department for specific problems, and explain campus grievance escalation procedures.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or 20.x (Recommended: Node 20+)
- An active [Supabase](https://supabase.com/) account (free tier works great)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/codingwithgurman/ComplaintManagementSystem.git
cd ComplaintManagementSystem
npm install
```

### 2. Configure Environment Variables
Copy the example environment file to `.env.local`:
```bash
cp .env.example .env.local
```

Open `.env.local` and configure your credentials:
```dotenv
# Supabase Configuration (Database & Storage)
# Found in: Supabase Dashboard > Project Settings > API Keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-or-anon-key

# Local Auth Session Secret (Optional - min 32 characters)
SESSION_SECRET=your-random-32-char-session-signing-secret

# Groq AI Help Desk (Optional - required for chatbot)
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.1-8b-instant
```

### 3. Initialize the Supabase Database

1. Open your project on the [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to the **SQL Editor** from the left-hand navigation.
3. Copy and run the scripts in order:
   - **Step 1:** Run [`sql/01_schema.sql`](./sql/01_schema.sql)
     - Creates tables: `profiles`, `departments`, `complaints`, `notifications`.
     - Creates indexes, automatic timestamps, and notification triggers.
     - Provisions the `complaint-images` storage bucket.
   - **Step 2:** Run [`sql/02_seed_data.sql`](./sql/02_seed_data.sql)
     - Seeds standard campus departments.

---

## 👑 Creating an Administrator Account

1. Open the app in your browser at `http://localhost:3000/register`.
2. Register an account with your administrator email (e.g., `admin@college.edu`) and password.
3. In your Supabase Dashboard **SQL Editor**, run the following SQL command to promote the user:
   ```sql
   update public.profiles
   set role = 'admin'
   where email = 'admin@college.edu';
   ```
4. You can now log in via `http://localhost:3000/admin/login` to access the full administrative dashboard!

---

## 💻 Running the Application

### Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Build & Start
```bash
npm run build
npm run start
```

### Code Quality / Linting
```bash
npm run lint
```

---

## 📁 Project Structure

```text
├── app/
│   ├── admin/                 # Administrator portal
│   │   ├── complaints/        # Manage, reassign, and resolve complaints
│   │   ├── dashboard/         # Analytics and department progress
│   │   ├── departments/       # Department CRUD
│   │   └── login/             # Admin authentication
│   ├── api/
│   │   ├── auth/              # Local auth routes
│   │   │   ├── change-password/ # Secure password update
│   │   │   ├── login/         # Credential verification & session creation
│   │   │   ├── logout/        # Session destruction
│   │   │   ├── me/            # Session validation & hydration
│   │   │   └── register/      # Student registration & password hashing
│   │   └── chat/              # Groq AI Help Desk server endpoint
│   ├── chatbot/               # AI Help Desk interface
│   ├── complaints/            # Student complaints list, detail, and submission
│   ├── dashboard/             # Student dashboard overview
│   ├── login/                 # Student login page
│   ├── notifications/         # Real-time alert feed
│   ├── profile/               # Student profile and password management
│   ├── register/              # Student account registration
│   ├── track/                 # Public ticket search
│   └── page.js                # Landing page
├── components/                # Shared UI elements, Navbar, Topbar, Sidebar, AppShell
├── lib/
│   ├── auth.js                # Cryptographic hashing & session signing engine
│   ├── AuthProvider.js        # React authentication context & session hooks
│   ├── data.js                # Supabase database & storage helper functions
│   ├── supabaseClient.js      # Client-side Supabase database/storage client
│   ├── supabaseServer.js      # Server-side Supabase database client
│   └── validate.js            # Input validation & password strength utilities
├── sql/
│   ├── 01_schema.sql          # Primary database schema, triggers, and bucket setup
│   └── 02_seed_data.sql       # Department seed data & admin instructions
└── README.md
```

---

## 🔒 Security Architecture

- **No Plaintext Passwords:** Passwords are salted with 16 cryptographically secure random bytes and derived using scrypt.
- **Secure Cookies:** Session tokens are delivered via `httpOnly`, `sameSite: lax` cookies, mitigating cross-site scripting (XSS) credential theft.
- **Tamper-Proof Tokens:** Session cookies are verified with HMAC-SHA256 signatures; any altered payload fails verification immediately.
- **Role Enforcement:** Server API routes and UI `AppShell` wrappers check user roles to ensure students cannot access admin workspaces.
- **No Password Hashes in Client Queries:** Database helpers explicitly exclude sensitive credential fields when querying profiles.

---

## 🚢 Deployment (Vercel)

1. Push your code to a GitHub repository.
2. Import the repository into [Vercel](https://vercel.com/new).
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SESSION_SECRET`
   - `GROQ_API_KEY` (if using chatbot)
4. Click **Deploy**.
5. Once deployed, run `sql/01_schema.sql` and `sql/02_seed_data.sql` in your production Supabase database.

---

## 📄 License
This project is licensed under the MIT License.
