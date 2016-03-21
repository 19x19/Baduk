var express = require('express');
var app = express();

// Global controller. Basically being used as middleware.
app.get('/*', function(req, res, next) {
    // General headers for security, ranging from clickjacking protection to
    // anti-crawler protection. Note that the XSS protection only applies to
    // IE8+ and Chrome, so still sanitize all input.
    res.header('X-Frame-Options', 'DENY');
    res.header('X-Robots-Tag', 'noindex');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('X-Content-Type-Options', 'nosniff');

    next();
});

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
