const dotenv = require("dotenv");

dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  TOKEN_TTL: process.env.TOKEN_TTL || process.env.JWT_EXPIRES_IN || "12h",
};

module.exports = env;
