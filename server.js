const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3002;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json()); // for JSON body parsing
app.use(express.static(path.join(__dirname, "public"))); // serve static files

// ===== ROUTES =====

// Serve index.html
app.get("/", (req, res) => {
  console.log("📄 GET / - Serving index.html");
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Handle POST request to shorten URL
app.post("/shorten", async (req, res) => {
  console.log("📩 POST /shorten called");
  console.log("📦 Request body:", req.body);

  try {
    const { url, short } = req.body;

    if (!url || !short) {
      console.warn("⚠️ Missing URL or shortcode in request");
      return res.status(400).json({ message: "URL and short code are required" });
    }

    const path_ = path.join(__dirname, "public", "data.json");

    console.log(`📂 Reading data.json from: ${path_}`);
    const fileData = await fs.readFile(path_, "utf-8").catch(() => "{}");
    console.log("📄 Current file data:", fileData);

    const jsondata = JSON.parse(fileData);

    console.log(`🆕 Adding shortcode: ${short} => ${url}`);
    jsondata[short] = url;

    await fs.writeFile(path_, JSON.stringify(jsondata, null, 2), "utf-8");
    console.log("✅ Data saved successfully to data.json 👍");

    const shortUrl = `${req.headers.host}/${short}`;
    console.log("🔗 Generated short URL:", shortUrl);

    res.json({ shortUrl });

  } catch (error) {
    console.error("❌ Error saving short URL:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Redirect short code to original URL
app.get("/:shortcode", async (req, res) => {
  const shortcode = req.params.shortcode;
  console.log(`🔍 GET /${shortcode} - Checking redirect`);

  try {
    const path_json = path.join(__dirname, "public", "data.json");
    console.log(`📂 Reading data.json from: ${path_json}`);

    const json_data = await fs.readFile(path_json, "utf-8").catch(() => "{}");
    console.log("📄 File content:", json_data);

    const parsed_data = JSON.parse(json_data);

    if (parsed_data[shortcode]) {
      console.log(`➡️ Redirecting to: ${parsed_data[shortcode]}`);
      res.redirect(parsed_data[shortcode]);
    } else {
      console.warn(`⚠️ Shortcode not found: ${shortcode}`);
      res.status(404).send("Short URL not found");
    }
  } catch (error) {
    console.error("❌ Error reading data.json:", error);
    res.status(500).send("Server error");
  }
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
