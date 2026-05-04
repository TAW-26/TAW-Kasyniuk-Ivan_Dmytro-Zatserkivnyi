const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const {
  getAll,
  getOne,
  create,
  update,
  remove,
  getByUser,
  purchase,
} = require("../controllers/listingController");

router.get("/", getAll);
router.get("/user/my", auth, getByUser);
router.get("/:id", getOne);

router.post("/", auth, create);
router.post("/:id/purchase", auth, purchase);
router.put("/:id", auth, update);
router.delete("/:id", auth, remove);

module.exports = router;
