var esClient = require('./esClient');

var _offset = '5km';
var _scale = '50km';
var _perPage = 20;

function parseQuery(queryParams) {
    return {
        name: queryParams.q || '',
        lat: queryParams.latitude,
        lon: queryParams.longitude,
        distance: queryParams.distance,
        from: (queryParams.page || 0) * _perPage
    }
}

function queryWithCoordinates(lat, lon, name) {
    var query = {
        query: {
            function_score: {
                functions: [
                    {
                        "gauss": {
                            "location": {
                                "origin": {
                                    "lat":lat,
                                    "lon":lon
                                },
                                "offset":_offset,
                                "scale":_scale
                            }
                        }
                    }
                ]
            }
        }
    };

    if (name) {
        query.query.function_score.query = {
            "match": {
                "name": {
                    "query": name,
                    "analyzer": "standard"
                }
            }
        }
    }

    return query;
}

function queryWithName(name) {
    return {
        query: {
            "match": {
                "name": {
                    "query": name,
                    "analyzer": "standard"
                }
            }
        }
    }
}

function parseOutput(documents) {
    var maxScore = documents.hits.max_score;
    return documents.hits.hits
        .filter(function(doc) {
            return doc._score / maxScore > 0.05
        })
        .map(function(doc) {
            doc._source.score = doc._score / maxScore;
            return doc._source;
        })
}

function buildESQuery(queryParams) {
    var query;
    if (queryParams.lat !== undefined && queryParams.lon !== undefined) {
        query = queryWithCoordinates(queryParams.lat, queryParams.lon, queryParams.name);
    } else {
        query = queryWithName(queryParams.name);
    }
    query.size = 20;
    query.from = queryParams.from;
    return query;
}

module.exports = {

    query: function(req, res) {
        var queryParams = parseQuery(req.query);
        var esQuery = buildESQuery(queryParams);

        console.log(JSON.stringify(esQuery));

        esClient.post('busbud/city/_search', esQuery)
            .then(function(documents) {
                documents = parseOutput(documents);
                if (documents.length === 0) {
                    res.status(404);
                }
                res.json({suggestions: documents});
            }, function(err) {
                res.status(500).json({error: err});
            });
    }

};


