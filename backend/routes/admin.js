const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const {
  getAllUsers,
  getUser,
  updateRole,
  deleteUser,
} = require("../controllers/adminController");

router.get("/users", auth, admin, getAllUsers);
router.get("/users/:id", auth, admin, getUser);
router.put("/users/:id/role", auth, admin, updateRole);
router.delete("/users/:id", auth, admin, deleteUser);

module.exports = router;
