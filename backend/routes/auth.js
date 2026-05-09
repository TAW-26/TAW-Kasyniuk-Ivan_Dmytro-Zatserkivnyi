const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const auth = require("../middleware/authMiddleware");
const {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  me,
  updateMe,
  changePassword,
  deleteMe,
  toggleFavorite,
  clearFavorites,
} = require("../controllers/authController");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut." },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/verify/:token", verifyEmail);

router.get("/me", auth, me);
router.put("/me", auth, updateMe);
router.put("/me/password", auth, changePassword);
router.delete("/me", auth, deleteMe);

router.post("/favorites/toggle/:id", auth, toggleFavorite);
router.delete("/favorites", auth, clearFavorites);

module.exports = router;
