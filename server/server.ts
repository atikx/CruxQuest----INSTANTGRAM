import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes";
import verifiedUserRoutes from "./routes/verifiedUser.routes";
import "dotenv/config";

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/user", userRoutes);
app.use("/verifiedUser", verifiedUserRoutes);

app.get("/clearToken", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Token cleared successfully" });
  console.log("Token cleared successfully");
});


app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
});
