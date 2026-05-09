const dotenv = require("dotenv");
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

const app = require("./app");
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie: ${PORT}`);
});
