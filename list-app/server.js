const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");

dotenv.config();


mongoose.connect(
  "mongodb+srv://admin:tirrcjDnADNnSYBR@cluster0.orue44x.mongodb.net/?appName=Cluster0"
)
.then(() => console.log("MongoDB подключен"))
.catch(err => console.log(err));

const app = express();

app.use(cors());
app.use(express.json());

// routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API работает");
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server запущен на порту ${PORT}`);
});