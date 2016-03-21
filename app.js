var express = require('express');
var app = express();

// Global controller. Basically being used as middleware.
// Currently used to add HTTP headers to all responses.
app.get('/*', function(req, res, next) {
    // HTTP headers to protect against general clickjacking
    res.header('X-Frame-Options', 'DENY');
    res.header('Content-Security-Policy', 'frame-ancestors: \'none\'');
    // No crawlers on this website, thanks
    res.header('X-Robots-Tag', 'noindex');
    // Anti-XSS protection (only works on Chrome and IE8+, so sanitize anyways)
    res.header('X-XSS-Protection', '1; mode=block');

    next();
});

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
