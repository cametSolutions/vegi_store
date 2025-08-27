
import User from "../../model/auth/authSchema.js";
import bcrypt from "bcrypt";
export const Login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("email", email);
        console.log("pass", password);
        if (!email || !password) {
            return res.status(400).json({ message: "Email or password are required" });
        }
        const a = await User.find({});
        console.log("aaaaaaa", a);
        const user = await User.findOne({ email });
        console.log("user", user);
        if (!user) {
            return res.status(403).json({ message: "User not found" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        return res.status(200).json({ message: "Login succesful", user });
    }
    catch (error) {
        console.log("error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
