const router = require("express").Router();
const Claim = require("../models/Claim");
const Item = require("../models/Item");
const { protect, adminOnly } = require("../middleware/auth");

router.post("/", protect, async (req, res) => {
  try {
    const { itemId, message } = req.body;
    if (!itemId || !message) return res.status(400).json({ message: "Item and claim explanation are required" });
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (String(item.postedBy) === String(req.user._id)) return res.status(400).json({ message: "You cannot claim your own report" });
    const existing = await Claim.findOne({ item: itemId, claimant: req.user._id, status: "pending" });
    if (existing) return res.status(409).json({ message: "You already have a pending claim for this item" });
    const claim = await Claim.create({ item: itemId, claimant: req.user._id, message });
    res.status(201).json({ message: "Claim submitted", claim });
  } catch (err) { res.status(400).json({ message: "Could not submit claim", error: err.message }); }
});

router.get("/mine", protect, async (req, res) => {
  const claims = await Claim.find({ claimant: req.user._id }).populate("item").sort({ createdAt: -1 });
  res.json(claims);
});

router.get("/", protect, adminOnly, async (req, res) => {
  const claims = await Claim.find().populate("item").populate("claimant", "name email").sort({ createdAt: -1 });
  res.json(claims);
});

router.patch("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ message: "Status must be approved or rejected" });
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });
    claim.status = status;
    await claim.save();
    if (status === "approved") await Item.findByIdAndUpdate(claim.item, { status: "claimed" });
    res.json({ message: `Claim ${status}`, claim });
  } catch { res.status(400).json({ message: "Invalid claim ID" }); }
});
module.exports = router;
