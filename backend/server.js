const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is required");
  process.exit(1);
}

if (!process.env.JWT_REFRESH_SECRET) {
  console.error("FATAL: JWT_REFRESH_SECRET is required");
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error("FATAL: MONGO_URI is required");
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && !process.env.FRONTEND_URL) {
  console.error("FATAL: FRONTEND_URL is required in production");
  process.exit(1);
}

connectDB();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:4200",
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));

const authRoutes = require("./routes/auth");
const listingRoutes = require("./routes/listings");
const categoryRoutes = require("./routes/categories");
const adminRoutes = require("./routes/admin");
const messageRoutes = require("./routes/messages");

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("API działa");
});

const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie: ${PORT}`);
});