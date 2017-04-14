// Dependencies
var express = require("express");

// Require request and cheerio. This makes the scraping possible
var request = require("request");
var cheerio = require("cheerio");

var bodyParser = require("body-parser");

var mongoose = require("mongoose");

// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

// Initialize Express
var app = express();

//use body parser with the app
app.use(bodyParser.urlencoded({
    extended: false
}));

// Make public a static dir
app.use(express.static("public"));

// Database configuration with mongoose
mongoose.connect("mongodb://localhost/scraperdb");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
    console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
    console.log("Mongoose connection successful.");
});

// Routes
// ======

// Main route (simple Hello World Message)
app.get("/", function(req, res) {
    res.send("Hello, User!");
});

// Retrieve data from the db
app.get("/all", function(req, res) {
    // Find all results from the scrapedData collection in the db
    db.scrapedData.find({}, function(error, found) {
        // Throw any errors to the console
        if (error) {
            console.log(error);
        }
        // If there are no errors, send the data to the browser as a json
        else {
            res.json(found);
        }
    });
});

// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function(req, res) {
    // Make a request for the news section of ycombinator
    request("https://www.cnet.com", function(error, response, html) {
        // Load the html body from request into cheerio
        var $ = cheerio.load(html);
        // For each element with a "title" class
        $(".tag-recency-1").each(function(i, element) {
            // Save the text of each link enclosed in the current element
            var title = $(this).children("a").text();
            // Save the href value of each link enclosed in the current element
            var link = $(this).children("a").attr("href");

            // If this title element had both a title and a link
            if (title && link) {
                // Save the data in the scrapedData db
                db.scrapedData.save({
                        title: title,
                        link: link
                    },
                    function(error, saved) {
                        // If there's an error during this query
                        if (error) {
                            // Log the error
                            console.log(error);
                        }
                        // Otherwise,
                        else {
                            // Log the saved data
                            console.log(saved);
                        }
                    });
            }
        });
    });

    // This will send a "Scrape Complete" message to the browser
    res.send("Your news belongs to Mongo.");
});


// Listen on port 3000
app.listen(3000, function() {
    console.log("App running on port 3000!");
});