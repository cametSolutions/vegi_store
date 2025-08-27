import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
const userSchema = new Schema({
    name: { type: String, required: [true, "Name is required"] },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
    },
    mobile: { type: String, match: /^[0-9]{10}$/ },
    password: { type: String, required: [true, "Password is required"] },
    role: { type: String },
    activeRole: { type: String },
    privilegeleavestartsfrom: { type: String },
    casualleavestartsfrom: { type: String },
    sickleavestartsfrom: { type: String },
    isVerified: { type: Boolean, default: true },
    dateofbirth: { type: String },
    bloodgroup: { type: String },
    gender: { type: String },
    address: { type: String },
    country: { type: String },
    state: { type: String },
    pincode: { type: String },
    joiningdate: { type: String },
    designation: { type: String },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null },
    assignedto: { type: mongoose.Schema.Types.ObjectId, refPath: "assignedtoModel" },
    assignedtoModel: { type: String, enum: ["Staff", "Admin"] },
    profileUrl: [{ type: String }],
    documentUrl: [{ type: String }],
    attendanceId: { type: Number, unique: true, index: true },
    callstatus: {
        totalCall: { type: Number, default: 0 },
        solvedCalls: { type: Number, default: 0 },
        colleagueSolved: { type: Number, default: 0 },
        pendingCalls: { type: Number, default: 0 },
        totalDuration: { type: Number, default: 0 },
    },
    permissions: [{}],
    permissionLevel: [{}],
    selected: [{}],
}, { timestamps: true });
userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
const User = mongoose.model("User", userSchema);
export default User;
