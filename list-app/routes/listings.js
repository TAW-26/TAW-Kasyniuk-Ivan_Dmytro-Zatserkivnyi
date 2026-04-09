const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const {
  getAll,
  getOne,
  create,
  update,
  remove,
  getByUser,
} = require("../controllers/listingController");

// Publiczne
router.get("/", getAll);
router.get("/:id", getOne);

// Wymagają autoryzacji
router.post("/", auth, create);
router.put("/:id", auth, update);
router.delete("/:id", auth, remove);
router.get("/user/my", auth, getByUser);

module.exports = router;
