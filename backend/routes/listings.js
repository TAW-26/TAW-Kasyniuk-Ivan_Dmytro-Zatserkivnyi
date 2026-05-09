const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const {
  getAll,
  getOne,
  create,
  update,
  remove,
  getByUser,
  markAsSold,
} = require("../controllers/listingController");

router.get("/", getAll);
router.get("/user/my", auth, getByUser);
router.get("/:id", getOne);

router.post("/", auth, create);
router.post("/:id/mark-sold", auth, markAsSold);
router.put("/:id", auth, update);
router.delete("/:id", auth, remove);

module.exports = router;
