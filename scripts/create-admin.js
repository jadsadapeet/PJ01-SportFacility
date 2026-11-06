// Create (or promote) an admin account. Public sign-up can only create members.
// Usage: npm run create-admin -- "<name>" <email> <tel> <password>
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const User = require("../models/User");

(async () => {
  const [name, email, tel, password] = process.argv.slice(2);
  if (!name || !email || !tel || !password) {
    console.error('Usage: npm run create-admin -- "<name>" <email> <tel> <password>');
    process.exit(1);
  }

  await connectDB();
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    existing.role = "admin";
    await existing.save();
    console.log(`${existing.email} is now an admin`);
  } else {
    const user = await User.create({ name, email, tel, password, role: "admin" });
    console.log(`Admin created: ${user.email}`);
  }
  await mongoose.disconnect();
})().catch(async (error) => {
  console.error(`Failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
