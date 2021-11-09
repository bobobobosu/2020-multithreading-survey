// npm install express
var express = require('express');
var app = express();
var path = require('path');

app.use(function(req, res, next) {
    res.header("Cross-Origin-Embedder-Policy", "require-corp");
    res.header("Cross-Origin-Opener-Policy", "same-origin");
    next();
});

app.use(express.static(path.join(__dirname, 'src'))); //  "public" off of current is root

app.listen(8080);
console.log('Listening on port 8080');