// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  try {
    // 1. Get cookie from request
    const token = req.cookies?.veg_store_token;

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authentication denied" });
    }
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // 3. Attach user info to request
    req.user = {
      ...decoded,
      _id: decoded._id || decoded.id || decoded.userId, // Normalize to _id
    };

    
    // 4. Continue to next middleware / route
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
