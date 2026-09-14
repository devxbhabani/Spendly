# Personal Expenses Tracker & PhonePe SMS Sync

A full-stack, mobile-friendly personal expense tracking system with automated PhonePe/Bank SMS parsing, styled after the Vendify design system and backed by MongoDB Atlas.

---

## 📁 Repository Structure

```
Expense-Tracker/
│
├── backend/                       # Node.js & Express REST API
│   ├── config/
│   │   └── db.js                  # MongoDB Atlas connection setup
│   ├── controllers/
│   │   └── transactionController.js # CRUD handlers & real dynamic analytics
│   ├── models/
│   │   └── Transaction.js         # Mongoose schema for transactions
│   ├── routes/
│   │   └── transactionRoutes.js   # Express API routes (/api/transactions, /api/analytics)
│   ├── .env                       # MongoDB Atlas URI & Port configuration
│   ├── package.json               # Backend dependencies
│   └── server.js                  # Server entry point
│
├── frontend/                      # React (Vite) + Tailwind CSS v3 + Capacitor Android
│   ├── android/                   # Native Android wrapper project with SMS permissions
│   ├── public/                    # Static assets
│   ├── src/
│   │   ├── components/            # UI components (Header, MetricCards, SpendingChart,
│   │   │                          # CalendarCard, CategoryDonut, TransactionList, 
│   │   │                          # SmsSyncModal, AddExpenseModal, MobileNav, Sidebar)
│   │   ├── services/              # api.js, parser.js, smsService.js
│   │   ├── App.jsx                # Main application dashboard
│   │   ├── main.jsx               # Application root
│   │   └── index.css              # Tailwind CSS directives & custom design tokens
│   ├── capacitor.config.json      # Capacitor configuration
│   ├── index.html                 # HTML shell with Google fonts & mobile meta tags
│   ├── package.json               # Frontend dependencies & Capacitor scripts
│   ├── postcss.config.js          # PostCSS configuration
│   ├── tailwind.config.js         # Tailwind CSS v3 theme configuration
│   └── vite.config.js             # Vite configuration with /api backend proxy
│
├── Personal_Expenses_Tracker_Guide.docx # Project guide and Android Capacitor blueprint
├── app-ui-example.jpeg            # Visual reference mockup
├── package.json                   # Root workspace launcher scripts
└── README.md                      # Project documentation
```

---

## 🚀 Running the Project

### 1. Start the Backend API:
```powershell
cd backend
npm install
npm start
# Server runs on http://localhost:5000 and connects to MongoDB Atlas
```

### 2. Start the Frontend Application:
```powershell
cd frontend
npm install
npm run dev
# Vite runs on http://localhost:5173
```

### 3. Native Android Build (Capacitor):
```powershell
cd frontend
npm run cap:build
npm run cap:open
# Opens in Android Studio ready to run on an emulator or USB device
```
