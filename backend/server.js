// import express from "express"
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import authRoute from "./routes/auth/authRoute.js";
import companyRoute from "./routes/company/companyRoute.js";
import branchRoute from "./routes/branch/branchRoute.js";
import userRoute from "./routes/user/userRoute.js";
import pricelevelRoute from "./routes/pricelevel/pricelevelRoute.js";
import acccountmasterRoute from "./routes/accountmaster/accountMasterRoute.js";
import itemRoute from "./routes/itemmaster/itemRoute.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import cookieParser from "cookie-parser";




const app = express();

dotenv.config();
const corsOptions = {
  origin: true,
  credentials: true,
};
app.use(cors(corsOptions));
app.use(cookieParser()); // <-- this makes req.cookies work

// Connect to DB
connectDB().catch((err) => console.error("DB connection failed", err));
app.use(express.json());
const PORT = 5000;
app.use("/api/auth", authRoute);
app.use("/api/company", authMiddleware, companyRoute);
app.use("/api/branch", authMiddleware, branchRoute);
app.use("/api/user", authMiddleware, userRoute);
app.use("/api/pricelevel", authMiddleware, pricelevelRoute);
app.use("/api/accountmaster", authMiddleware, acccountmasterRoute);
app.use("/api/item", authMiddleware, itemRoute);

// app.get("/",(req,res)=>{
// res.send("ok")})
app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
