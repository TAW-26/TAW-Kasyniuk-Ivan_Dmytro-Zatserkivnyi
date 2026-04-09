const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getAll, create, remove } = require("../controllers/categoryController");

// Publiczne
router.get("/", getAll);

// Wymagają autoryzacji (admin)
router.post("/", auth, create);
router.delete("/:id", auth, remove);

module.exports = router;
