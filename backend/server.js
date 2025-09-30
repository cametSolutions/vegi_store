// ----------------- Imports -----------------
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import rateLimit from "express-rate-limit";

// DB + Middlewares
import connectDB from "./config/db.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";

// Routes
import authRoute from "./routes/auth/authRoute.js";
import companyRoute from "./routes/company/companyRoute.js";
import branchRoute from "./routes/branch/branchRoute.js";
import userRoute from "./routes/user/userRoute.js";
import pricelevelRoute from "./routes/pricelevel/pricelevelRoute.js";
import acccountmasterRoute from "./routes/accountmaster/accountMasterRoute.js";
import itemRoute from "./routes/itemmaster/itemRoute.js";

// ----------------- App Init -----------------
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ----------------- Global Middlewares -----------------
const corsOptions = {
  origin: true, // allow frontend origin or all
  credentials: true,
};
app.use(cors(corsOptions));

app.use((req, res, next) => {
  Object.defineProperty(req, "query", {
    ...Object.getOwnPropertyDescriptor(req, "query"),
    value: req.query,
    writable: true,
  });
  next();
});

// Cookie parser (must be before routes if cookies are used for auth)
app.use(cookieParser());

// Security
app.use(helmet()); //// Secure headers
app.use(
  mongoSanitize({
    replaceWith: "_",
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized request[${key}]`);
    },
  })
);
app.use(hpp()); //// Prevent HTTP parameter pollution

// Body parser
app.use(express.json({ limit: "10mb" })); //// Parse JSON requests

// Rate limiting (apply only to /api/*)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// ----------------- DB Connection -----------------
connectDB().catch((err) => console.error("DB connection failed", err));

// ----------------- Routes -----------------
app.get("/", (req, res) => {
  res.send("✅ Server is alive");
});

app.use("/api/auth", authRoute);
app.use("/api/company", authMiddleware, companyRoute);
app.use("/api/branch", authMiddleware, branchRoute);
app.use("/api/user", authMiddleware, userRoute);
app.use("/api/pricelevel", authMiddleware, pricelevelRoute);
app.use("/api/accountmaster", authMiddleware, acccountmasterRoute);
app.use("/api/item", authMiddleware, itemRoute);

// ----------------- Error Handling -----------------
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// ----------------- Server -----------------
app.listen(PORT, () => {
  console.log(`🚀 Server started at http://localhost:${PORT}`);
});
