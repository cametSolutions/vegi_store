
import mongoose from "mongoose";
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }
        const connect = await mongoose.connect(mongoUri);
        console.log(`MongoDB connected: ${connect.connection.host}`);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`❌ Mongo Connection failed: ${error.message}`);
        }
        else {
            console.error("❌ Unknown error occurred during Mongo connection");
        }
        process.exit(1);
    }
};
export default connectDB;
