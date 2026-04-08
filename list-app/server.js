const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API działa");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie: ${PORT}`);
});