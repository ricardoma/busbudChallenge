var express = require('express');
var app = express();
var esClient = require('./esClient');
var city = require('./city');

// BONSAI_URL will be supplied by heroku, locally user must pass ES url address. Ex: http://localhost:9200
var _elasticSearchUrl = process.env.BONSAI_URL || process.env.ES_URL;

if (!_elasticSearchUrl) {
    console.log('Missing ES_URL environment variable to connect to Elasticsearch');
    process.exit(1);
} else {
    esClient.setEsUrl(_elasticSearchUrl);
}

app.set('port', (process.env.PORT || 2345));

app.get('/suggestions', city.query);

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

module.exports = app;