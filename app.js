var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 2345));

app.get('/suggestions', function(request, response) {
    response.json([]);
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});