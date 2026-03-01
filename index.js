require("dotenv").config();
var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
var dns = require("dns");

var app = express();
var port = process.env.PORT || 3000;

// In-memory storage — no database needed
var urls = [];
var id = 0;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// POST /api/shorturl
app.post("/api/shorturl", function (req, res) {
  var originalUrl = req.body.url;

  // Must match http(s)://something format
  var urlRegex = /^https?:\/\//;
  if (!urlRegex.test(originalUrl)) {
    return res.json({ error: "invalid url" });
  }

  // Parse and verify hostname with dns
  var parsedUrl;
  try {
    parsedUrl = new URL(originalUrl);
  } catch (e) {
    return res.json({ error: "invalid url" });
  }

  dns.lookup(parsedUrl.hostname, function (err) {
    if (err) {
      return res.json({ error: "invalid url" });
    }

    // Check if already stored
    var existing = urls.find(function (entry) {
      return entry.original_url === originalUrl;
    });
    if (existing) {
      return res.json({
        original_url: existing.original_url,
        short_url: existing.short_url
      });
    }

    // Store new URL
    id++;
    var newEntry = { original_url: originalUrl, short_url: id };
    urls.push(newEntry);

    return res.json({
      original_url: newEntry.original_url,
      short_url: newEntry.short_url
    });
  });
});

// GET /api/shorturl/:number
app.get("/api/shorturl/:number", function (req, res) {
  var shortUrl = parseInt(req.params.number);

  var entry = urls.find(function (u) {
    return u.short_url === shortUrl;
  });

  if (!entry) {
    return res.json({ error: "No short URL found" });
  }

  res.redirect(entry.original_url);
});

app.listen(port, function () {
  console.log("Node.js listening on port " + port);
});