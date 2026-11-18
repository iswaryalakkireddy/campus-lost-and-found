const router = require("express").Router();
const User = require("../models/User");
const Item = require("../models/Item");
const Claim = require("../models/Claim");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/stats", protect, adminOnly, async (req, res) => {
  const [users, items, lost, found, pendingClaims] = await Promise.all([
    User.countDocuments({ role: "student" }), Item.countDocuments(),
    Item.countDocuments({ type: "lost" }), Item.countDocuments({ type: "found" }),
    Claim.countDocuments({ status: "pending" })
  ]);
  res.json({ users, items, lost, found, pendingClaims });
});
router.get("/items", protect, adminOnly, async (req, res) => {
  res.json(await Item.find().populate("postedBy", "name email").sort({ createdAt: -1 }));
});
module.exports = router;
