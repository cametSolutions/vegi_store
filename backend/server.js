// import express from "express"
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import authRoute from "./routes/auth/authRoute.js"
const app = express();
dotenv.config();
// connectDB()
const corsOptions = {
    origin: true,
    credential: true
};
app.use(cors(corsOptions));
// Connect to DB
connectDB().catch((err) => console.error("DB connection failed", err));
app.use(express.json());
const PORT = 5000;
app.use("/api/auth", authRoute);
// app.get("/",(req,res)=>{
// res.send("ok")})
app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});
