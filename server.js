require("dotenv").config();
const http = require("http");
const path = require("path");
const fs = require("fs").promises;
const { MongoClient } = require("mongodb");

const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI;
const client = new MongoClient(mongoURI);

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
    return client.db("urlShortener").collection("urls");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
}

const server = http.createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);
  const urlCollection = await connectDB();

  // Serve index.html
  if (req.method === "GET" && req.url === "/") {
    try {
      const data = await fs.readFile(path.join(__dirname, "public", "index.html"), "utf-8");
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("404 page not found");
    }
  }

  // Serve CSS
  else if (req.method === "GET" && req.url === "/style.css") {
    try {
      const data = await fs.readFile(path.join(__dirname, "public", "style.css"), "utf-8");
      res.writeHead(200, { "Content-Type": "text/css" });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("404 page not found");
    }
  }

  // Serve JS
  else if (req.method === "GET" && req.url === "/script.js") {
    try {
      const data = await fs.readFile(path.join(__dirname, "public", "script.js"), "utf-8");
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("404 page not found");
    }
  }

  // Handle shorten POST
  else if (req.method === "POST" && req.url === "/shorten") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      if (!body) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Empty request body" }));
        return;
      }

      try {
        const { url, short } = JSON.parse(body);
        const existing = await urlCollection.findOne({ short });

        if (existing) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Shortcode already exists" }));
          return;
        }

        await urlCollection.insertOne({ short, url });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Short URL saved!" }));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  }

  // Redirect short URL
  else if (req.method === "GET") {
    const shortcode = req.url.slice(1);

    try {
      const result = await urlCollection.findOne({ short: shortcode });

      if (result) {
        res.writeHead(302, { Location: result.url });
        res.end();
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Short URL not found");
      }
    } catch (error) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Server Error");
    }
  }
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
