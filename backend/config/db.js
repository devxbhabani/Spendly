import mongoose from 'mongoose';

export async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in backend environment variables.');
    }
    const conn = await mongoose.connect(uri);
    console.log(`✓ MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
}
