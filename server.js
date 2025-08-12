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
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Handle POST request to shorten URL
app.post("/shorten", async (req, res) => {
  try {
    const { url, short } = req.body;
    if (!url || !short) {
      return res.status(400).json({ message: "URL and short code are required" });
    }

    const path_ = path.join(__dirname, "public", "data.json");
    const fileData = await fs.readFile(path_, "utf-8").catch(() => "{}");
    const jsondata = JSON.parse(fileData);

    jsondata[short] = url;

    await fs.writeFile(path_, JSON.stringify(jsondata, null, 2), "utf-8");

    console.log("✅ Data saved successfully to data.json 👍");
    res.json({ shortUrl: `${req.headers.host}/${short}` });

  } catch (error) {
    console.error("Error saving short URL:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Redirect short code to original URL
app.get("/:shortcode", async (req, res) => {
  try {
    const shortcode = req.params.shortcode;
    const path_json = path.join(__dirname, "public", "data.json");
    const json_data = await fs.readFile(path_json, "utf-8").catch(() => "{}");
    const parsed_data = JSON.parse(json_data);

    if (parsed_data[shortcode]) {
      res.redirect(parsed_data[shortcode]);
    } else {
      res.status(404).send("Short URL not found");
    }
  } catch (error) {
    console.error("Error reading data.json:", error);
    res.status(500).send("Server error");
  }
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
