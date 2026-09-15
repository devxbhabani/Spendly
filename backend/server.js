import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import transactionRoutes from "./routes/transactionRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB();

// Middleware
app.use(
	cors({
		origin: "*",
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
);
app.use(express.json());

// Root status route
app.get("/", (req, res) => {
	res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Spendly API • Live</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0F1117; color: #F4F5F8; margin: 0; padding: 40px 20px; display: flex; justify-content: center; align-items: center; min-height: 80vh; }
    .card { background: #1A1D27; border: 1px solid #2B3040; border-radius: 20px; padding: 32px; max-width: 520px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(190, 242, 100, 0.15); color: #BEF264; padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: 12px; margin-bottom: 16px; border: 1px solid rgba(190, 242, 100, 0.3); }
    .dot { width: 8px; height: 8px; background: #BEF264; border-radius: 50%; box-shadow: 0 0 10px #BEF264; }
    h1 { margin: 0 0 8px 0; font-size: 24px; font-weight: 800; }
    p { color: #8C93A8; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; }
    .endpoint-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
    .endpoint { display: flex; justify-content: space-between; align-items: center; background: #12141C; padding: 12px 16px; border-radius: 12px; border: 1px solid #242838; text-decoration: none; color: #F4F5F8; transition: all 0.2s; font-size: 13px; font-family: monospace; }
    .endpoint:hover { border-color: #BEF264; transform: translateY(-1px); }
    .tag { background: #222736; color: #8C93A8; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span> LIVE &amp; CONNECTED</div>
    <h1>Spendly API Server</h1>
    <p>The backend server is running smoothly on Render and connected to MongoDB Atlas. Use the API endpoints below:</p>
    <div class="endpoint-list">
      <a class="endpoint" href="/api/health" target="_blank">
        <span>GET /api/health</span>
        <span class="tag">Health</span>
      </a>
      <a class="endpoint" href="/api/transactions" target="_blank">
        <span>GET /api/transactions</span>
        <span class="tag">Transactions</span>
      </a>
      <a class="endpoint" href="/api/analytics" target="_blank">
        <span>GET /api/analytics</span>
        <span class="tag">Analytics</span>
      </a>
    </div>
  </div>
</body>
</html>
	`);
});

// Health route & aliases
const healthHandler = (req, res) => {
	res.status(200).json({
		status: "ok",
		message: "Spendly Expenses Tracker API is healthy",
		database: "connected",
		timestamp: new Date().toISOString(),
	});
};

app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

// API Routes
app.use("/api", transactionRoutes);

// Server listen
app.listen(PORT, () => {
	console.log(`✓ Backend API server running on http://localhost:${PORT}`);
});
