var express = require('express');
var app = express();
var location = require('./esClient');
var city = require('./city');

app.set('port', (process.env.PORT || 2345));

app.get('/suggestions', city.query);

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

module.exports = app;