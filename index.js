const express = require("express");
const cors = require("cors");
const dns = require("dns");
const bodyParser = require("body-parser");
const { URL } = require("url");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static("public"));

// Store URLs in memory (short_url -> original_url)
const urlDatabase = {};
let urlCounter = 1;

// Root page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// POST new URL
app.post("/api/shorturl", (req, res) => {
  let originalUrl = req.body.url;
  
  console.log("POST received:", originalUrl);

  try {
    // Validate URL format
    const urlObj = new URL(originalUrl);
    
    console.log("Protocol:", urlObj.protocol);
    console.log("Hostname:", urlObj.hostname);

    // Only allow http and https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      console.log("Invalid protocol");
      return res.json({ error: "invalid url" });
    }

    // DNS lookup to validate hostname with callback
    dns.lookup(urlObj.hostname, (err, address) => {
      if (err) {
        console.log("DNS lookup failed for:", urlObj.hostname, "Error:", err.code);
        return res.json({ error: "invalid url" });
      }
      
      console.log("DNS lookup successful:", address);
      
      // Save URL and return JSON
      const short_url = urlCounter++;
      urlDatabase[short_url] = originalUrl;
      
      console.log("Saved - short_url:", short_url, "original:", originalUrl);
      console.log("Database now contains:", urlDatabase);

      return res.json({
        original_url: originalUrl,
        short_url: short_url,
      });
    });
  } catch (err) {
    console.log("URL parsing error:", err.message);
    return res.json({ error: "invalid url" });
  }
});

// Redirect short URL
app.get("/api/shorturl/:short_url", (req, res) => {
  console.log("\n=== REDIRECT REQUEST ===");
  console.log("Param received:", req.params.short_url);
  
  const short_url = parseInt(req.params.short_url);
  console.log("Parsed to number:", short_url);
  console.log("Current database:", urlDatabase);
  console.log("Database keys:", Object.keys(urlDatabase));
  
  const originalUrl = urlDatabase[short_url];
  console.log("Looking up key", short_url, "found:", originalUrl);

  if (originalUrl) {
    console.log("SUCCESS - Redirecting to:", originalUrl);
    return res.redirect(originalUrl);
  } else {
    console.log("FAILED - URL not found in database");
    return res.json({ error: "No short URL found for given input" });
  }
});

// Start server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});