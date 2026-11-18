const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required" });
    if (password.length < 8) return res.status(400).json({ message: "Password must contain at least 8 characters" });
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ message: "Email is already registered" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: normalizedEmail, password: hashed });
    res.status(201).json({ message: "Registration successful", token: makeToken(user._id), user: publicUser(user) });
  } catch (err) { res.status(500).json({ message: "Registration failed", error: err.message }); }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password || "", user.password))) return res.status(401).json({ message: "Incorrect email or password" });
    res.json({ message: "Login successful", token: makeToken(user._id), user: publicUser(user) });
  } catch (err) { res.status(500).json({ message: "Login failed", error: err.message }); }
});

router.get("/me", protect, (req, res) => res.json({ user: req.user }));
function makeToken(id) { return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" }); }
function publicUser(user) { return { id: user._id, name: user.name, email: user.email, role: user.role }; }
module.exports = router;
