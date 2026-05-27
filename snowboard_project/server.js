const express = require("express");
const app = express();

const logger = require("./middleware/logger");

const userRoutes = require("./routes/userRoutes");
const resortRoutes = require("./routes/resortRoutes");
const tripRoutes = require("./routes/tripRoutes");
const resortLocationRoutes = require("./routes/resortLocationRoutes");
const aiRoutes   = require("./routes/aiRoutes");
const authRoutes = require("./routes/authRoutes");

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(express.json());
app.use(logger);

// ─── CORS — allow React dev server (port 3001) to reach this API ──────────────
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3001");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-user-role");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// ─── Route Mounting ───────────────────────────────────────────────────────────
app.use("/users", userRoutes);
app.use("/resorts", resortRoutes);
app.use("/trips", tripRoutes);
app.use("/resort-locations", resortLocationRoutes);
app.use("/", aiRoutes);
app.use("/auth", authRoutes);

// ─── 404 Fallback — unknown endpoints ────────────────────────────────────────
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    data: null,
    error: {
      code: "NOT_FOUND",
      message: `Cannot ${req.method} ${req.originalUrl}`,
      details: {}
    }
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Catches any unexpected errors forwarded via next(err) from controllers/routes
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  return res.status(500).json({
    success: false,
    data: null,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: err.message || "An unexpected error occurred. Please try again later.",
      details: {}
    }
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
