import User from "../../model/user/userModel.js";
import bcrypt from "bcrypt";
import { generateToken } from "../../utils/token.js"; // 🔹 make sure path is correct

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email })
      .populate({ path: "access.company", select: "_id companyName" })
      .populate({ path: "access.branches", select: "_id branchName" });

    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 🔹 Generate JWT
    const token = generateToken(user);

    // 🔹 Set cookie
    res.cookie("veg_store_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true only in prod
      sameSite: process.env.NODE_ENV === "production" ? "Strict" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    });

    // 🔹 Remove password before sending response
    const userResponse = { ...user._doc };
    delete userResponse.password;

    return res.status(200).json({
      message: "Login successful",
      user: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
