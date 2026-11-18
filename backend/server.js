require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const itemRoutes = require("./routes/items");
const claimRoutes = require("./routes/claims");
const adminRoutes = require("./routes/admin");
const User = require("./models/User");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/api/health", (req, res) => res.json({ message: "Campus Lost and Found API is running" }));
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/admin", adminRoutes);

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "../frontend/index.html")));

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      const existing = await User.findOne({ email: process.env.ADMIN_EMAIL.toLowerCase() });
      if (!existing) {
        const bcrypt = require("bcryptjs");
        const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
        await User.create({ name: "Campus Admin", email: process.env.ADMIN_EMAIL.toLowerCase(), password, role: "admin" });
        console.log("Initial admin account created from .env");
      }
    }
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
  } catch (err) {
    console.error("Could not start server:", err.message);
    process.exit(1);
  }
}
start();
