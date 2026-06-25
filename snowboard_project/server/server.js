require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();

const logger = require("./middleware/logger");

const userRoutes = require("./routes/userRoutes");
const resortRoutes = require("./routes/resortRoutes");
const tripRoutes = require("./routes/tripRoutes");
const resortLocationRoutes = require("./routes/resortLocationRoutes");
const aiRoutes     = require("./routes/aiRoutes");
const authRoutes   = require("./routes/authRoutes");
const socialRoutes     = require("./routes/socialRoutes");
const tripMemberRoutes  = require("./routes/tripMemberRoutes");
const dashboardRoutes   = require("./routes/dashboardRoutes");

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(express.json());
app.use(logger);

// ─── CORS — allow React dev server (port 5173) to reach this API ──────────────
// In production, frontend + backend share the same Render domain, so allow all origins.
// In development, restrict to the local React dev server.
app.use((req, res, next) => {
  const allowedOrigin = process.env.NODE_ENV === "production" ? "*" : "http://localhost:5173";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-user-role, x-user-id");
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
app.use("/", socialRoutes);
app.use("/trip-members", tripMemberRoutes);
app.use("/auth",      authRoutes);
app.use("/dashboard", dashboardRoutes);

// ─── Serve React build (single Render web service serves API + frontend) ─────
app.use(express.static(path.join(__dirname, "../client/build")));

// Catch-all — any GET not matched by an API route above falls through to the
// React app's index.html, so React Router can handle client-side routing
// (without this, refreshing a non-"/" route returns a 404).
app.get("/*splat", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

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
const http            = require("http");
const { sequelize }   = require("./db");
const { initSocket }  = require("./socket");
const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);
initSocket(httpServer);

sequelize.authenticate()
  .then(() => console.log("Database connected successfully."))
  .catch((err) => console.error("Database connection failed:", err.message));

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
