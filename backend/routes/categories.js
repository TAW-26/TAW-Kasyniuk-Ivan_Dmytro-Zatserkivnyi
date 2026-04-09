const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getAll, create, update, remove } = require("../controllers/categoryController");

router.get("/", getAll);

router.post("/", auth, create);
router.put("/:id", auth, update);
router.delete("/:id", auth, remove);

module.exports = router;
