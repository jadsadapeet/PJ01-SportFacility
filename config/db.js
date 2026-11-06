const mongoose = require("mongoose");
const dns = require("node:dns");

// Local machines: use public DNS resolvers for MongoDB Atlas SRV lookups.
// On Vercel (VERCEL is set) keep the platform's own resolver.
if (!process.env.VERCEL) {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
}

let connecting = null;

// Connects once and reuses the connection. Safe to call on every request,
// which is how serverless hosts like Vercel use it.
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connecting) {
    mongoose.set("strictQuery", true);
    connecting = mongoose
      .connect(process.env.MONGO_URI)
      .then((conn) => {
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn.connection;
      })
      .catch((error) => {
        connecting = null; // allow a retry on the next request
        throw error;
      });
  }
  return connecting;
};

module.exports = connectDB;
