var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

var db;
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

MongoClient.connect(process.env.HEROKU_MONGO, function (err, database) {
    assert.equal(null, err);
    console.log("Connected successfully to server");
    db = database;
});

app.use(function(req, res, next){
    console.log((new Date()).toString() + " " + req.method + " " + req.url + " " + res.statusCode);
    next();
});

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/book', function(req, res){
    var query = req.query.title;
    if(typeof query == "undefined") {
        var errorobj = {"status": 404, "message": "No query parameter provided"};
        res.status(404).json(errorobj);
    } else {
        db.collection('books').findOne({ title: query }).then(function(doc) {
            res.status(200).json(doc);
        });
    }
});

app.post('/reaction', function(req, res) {
    var query = req.body;
    if(typeof query == "undefined") {
        var errorobj = {"status": 404, "message": "No data provided"};
        res.status(404).json(errorobj);
    } else {
        var book = query.book;
        var title = book.title;
        var reaction = book.reaction;
        var timestamp = book.timestamp;
        var user = book.user;
        var chapter = book.chapter;
        db.collection('books').findOneAndUpdate(
            { title: title },
            { $set: { title: title, user: user },
              $push:
                { reactions: { reaction: reaction, timestamp: timestamp, chapter: chapter }} },
            { upsert: true });
        res.status(200).json(book);
    }
});

/*
app.get('/timeframe', function(req, res) {
    var query = req.query.request;
});
*/

app.use(function(req, res) {
    res.status(404);
    var errorobj = {"status":404,"message":"Invalid URL"};
    res.json(errorobj);
});

app.listen(7000, function() {
    console.log("Server started, listening on port 7000");
});

