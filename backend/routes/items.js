const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const Item = require("../models/Item");
const { protect } = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname).toLowerCase())
});
const upload = multer({ storage, limits: { fileSize: 3 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPG, PNG, WEBP or GIF images are allowed"));
}});

router.get("/", async (req, res) => {
  try {
    const { search, category, location, type, sort } = req.query;
    const filter = { status: { $ne: "returned" } };
    if (type && ["lost", "found"].includes(type)) filter.type = type;
    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: "i" };
    if (search) filter.$or = ["title", "description", "location"].map(k => ({ [k]: { $regex: search, $options: "i" } }));
    const items = await Item.find(filter).populate("postedBy", "name").sort(sort === "oldest" ? { date: 1 } : { date: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: "Could not retrieve items", error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate("postedBy", "name");
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch { res.status(400).json({ message: "Invalid item ID" }); }
});

router.post("/", protect, upload.single("image"), async (req, res) => {
  try {
    const { title, type, category, description, location, date } = req.body;
    if (!title || !type || !category || !description || !location || !date) return res.status(400).json({ message: "Please fill all required fields" });
    if (!["lost", "found"].includes(type)) return res.status(400).json({ message: "Type must be lost or found" });
    const item = await Item.create({
      title, type, category, description, location, date,
      image: req.file ? `/uploads/${req.file.filename}` : "",
      postedBy: req.user._id
    });
    res.status(201).json({ message: "Report submitted", item });
  } catch (err) { res.status(400).json({ message: err.message || "Could not create report" }); }
});

router.put("/:id", protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (String(item.postedBy) !== String(req.user._id) && req.user.role !== "admin") return res.status(403).json({ message: "You cannot edit this report" });
    const allowed = ["title", "category", "description", "location", "date", "status"];
    allowed.forEach(key => { if (req.body[key] !== undefined) item[key] = req.body[key]; });
    await item.save();
    res.json({ message: "Report updated", item });
  } catch (err) { res.status(400).json({ message: "Update failed", error: err.message }); }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (String(item.postedBy) !== String(req.user._id) && req.user.role !== "admin") return res.status(403).json({ message: "You cannot delete this report" });
    await item.deleteOne();
    res.json({ message: "Report deleted" });
  } catch { res.status(400).json({ message: "Invalid item ID" }); }
});

module.exports = router;
