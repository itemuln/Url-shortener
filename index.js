"use strict";

require("dotenv").config();
var express = require("express");
var { MongoClient } = require("mongodb");
var bodyParser = require("body-parser");
var cors = require("cors");

var app = express();
var port = process.env.PORT || 3000;

// MongoDB setup
var MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://itemulnl:Pedri6895@backlearndb.wt3xfdr.mongodb.net/?appName=BackLearnDB";

var client = new MongoClient(MONGO_URI);
var db, urlsCollection;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("url_service");
    urlsCollection = db.collection("urls");
    console.log("MongoDB connected!");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
  }
}
connectDB();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// POST /api/shorturl - create a short URL
app.post("/api/shorturl", function (req, res) {
  var originalUrl = req.body.url;

  // Validate URL format: must start with http:// or https://
  var urlRegex = /^https?:\/\/.+/;
  if (!urlRegex.test(originalUrl)) {
    return res.json({ error: "invalid url" });
  }

  try {
    new URL(originalUrl);
  } catch (e) {
    return res.json({ error: "invalid url" });
  }

  (async function () {
    try {
      // Check if URL already exists in DB
      var existing = await urlsCollection.findOne({
        original_url: originalUrl,
      });
      if (existing) {
        return res.json({
          original_url: existing.original_url,
          short_url: existing.short_url,
        });
      }

      // Get next short_url number
      var count = await urlsCollection.countDocuments();
      var shortUrl = count + 1;

      await urlsCollection.insertOne({
        original_url: originalUrl,
        short_url: shortUrl,
      });

      res.json({ original_url: originalUrl, short_url: shortUrl });
    } catch (dbErr) {
      console.error(dbErr);
      res.json({ error: "server error" });
    }
  })();
});

// GET /api/shorturl/:number - redirect to original URL
app.get("/api/shorturl/:number", async function (req, res) {
  var shortUrl = parseInt(req.params.number);
  if (isNaN(shortUrl)) {
    return res.json({ error: "invalid short url" });
  }

  try {
    var entry = await urlsCollection.findOne({ short_url: shortUrl });
    if (!entry) {
      return res.json({ error: "No short URL found" });
    }
    res.redirect(entry.original_url);
  } catch (err) {
    console.error(err);
    res.json({ error: "server error" });
  }
});

app.listen(port, function () {
  console.log("Node.js listening on port " + port);
});