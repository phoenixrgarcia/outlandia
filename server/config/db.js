const mongoose = require("mongoose");
const env = require("./env");

async function connectDB() {
  if (!env.MONGODB_URI) {
    console.warn("MONGODB_URI is not set. Skipping MongoDB connection for now.");
    return null;
  }

  mongoose.set("strictQuery", true);

  const connection = await mongoose.connect(env.MONGODB_URI);
  console.log(`MongoDB connected: ${connection.connection.name}`);
  return connection;
}

module.exports = connectDB;
