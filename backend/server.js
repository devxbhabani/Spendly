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

// Health route
app.get("/api/health", (req, res) => {
	res.status(200).json({
		status: "ok",
		message: "Personal Expenses Tracker API is healthy",
	});
});

// API Routes
app.use("/api", transactionRoutes);

// Server listen
app.listen(PORT, () => {
	console.log(`✓ Backend API server running on http://localhost:${PORT}`);
});
