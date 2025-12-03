import jwt from "jsonwebtoken";

export const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role , name: user.name},
    process.env.JWT_SECRET_KEY,
    { expiresIn: "7d" }   // 🔹 1 week
  );
};
