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

// ─── Route Mounting ───────────────────────────────────────────────────────────
app.use("/users", userRoutes);
app.use("/resorts", resortRoutes);
app.use("/trips", tripRoutes);
app.use("/resort-locations", resortLocationRoutes);
app.use("/", aiRoutes);
app.use("/auth", authRoutes);

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Catches any unexpected errors thrown in controllers/routes
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  return res.status(500).json({
    success: false,
    data: null,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred. Please try again later.",
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
