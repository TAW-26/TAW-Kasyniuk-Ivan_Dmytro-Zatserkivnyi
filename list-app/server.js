const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/auth");
const listingRoutes = require("./routes/listings");
const categoryRoutes = require("./routes/categories");
const adminRoutes = require("./routes/admin");

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("API działa");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie: ${PORT}`);
});