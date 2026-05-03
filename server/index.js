const path = require("path");
const express = require("express");
const env = require("./config/env");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const characterRoutes = require("./routes/characters");

const app = express();
const rootDir = path.join(__dirname, "..");
const staticOptions = {
  dotfiles: "ignore",
  extensions: false,
  index: "index.html",
};

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/characters", characterRoutes);

app.use(express.static(rootDir, staticOptions));

app.get("/health", (req, res) => {
  res.json({ ok: true, app: "outlandia" });
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API route not found." });
  }

  return next();
});

app.use((req, res) => {
  res.status(404).send("Page not found.");
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error." });
});

async function start() {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`Outlandia server listening on http://localhost:${env.PORT}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});

module.exports = app;
