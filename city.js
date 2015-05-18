var esClient = require('./esClient');

// Any city that's within 5km of the supplied coordinate will have a score of 1
var _offset = '5km';
// 50km is the rate of decay for the score, the farthest the lower the score will be
var _scale = '50km';
var _perPage = 20;

// Validate supplied parameters and return valid fields
function parseQuery(queryParams) {
    if ((queryParams.q === undefined && (queryParams.latitude === undefined || queryParams.longitude === undefined)) ||
        (queryParams.latitude === undefined && queryParams.longitude !== undefined) ||
        (queryParams.latitude !== undefined && queryParams.longitude === undefined) ||
        (queryParams.latitude !== undefined && isNaN(queryParams.latitude)) ||
        (queryParams.longitude !== undefined && isNaN(queryParams.longitude))) {
        return false;
    } else {
        return {
            name: queryParams.q || '',
            lat: queryParams.latitude,
            lon: queryParams.longitude,
            from: (queryParams.page || 0) * _perPage
        }
    }
}

// This query will be used if the users supplies coordinates, and it uses the gaussian function to rank cities
function queryWithCoordinates(lat, lon, name) {
    var query = {
        query: {
            function_score: {
                functions: [
                    {
                        "gauss": {
                            "location": {
                                "origin": {
                                    "lat": lat,
                                    "lon": lon
                                },
                                "offset": _offset,
                                "scale": _scale
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
                "names_array": {
                    "query": name,
                    "analyzer": "standard"
                }
            }
        }
    }

    return query;
}

// This query will be used if the user doesn't supply coordinates
function queryWithName(name) {
    return {
        query: {
            "match": {
                "names_array": {
                    "query": name,
                    "analyzer": "standard"
                }
            }
        }
    }
}

// This function filters documents with less than 5% accuracy, and maps the documents to the correct API format
function parseOutput(documents) {
    var maxScore = documents.hits.max_score;
    return documents.hits.hits
        .filter(function (doc) {
            return doc._score / maxScore > 0.05
        })
        .map(function (doc) {
            var source = doc._source;
            return {
                score: doc._score / maxScore,
                _id: source._id,
                name: source.name,
                latitude: source.location.lat,
                longitude: source.location.lon,
                country: source.country,
                population: source.population,
                tz: source.tz
            }
        })
}

// Builds query to be sent to ES, determines which query to use and append the size and from properties
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

    query: function (req, res) {
        var queryParams;
        var esQuery;

        queryParams = parseQuery(req.query);

        //Check if there is an error in the query params
        if (queryParams === false) {
            res.status(400).send('Bad request, expecting q or numerical latitude and longitude');
            return;
        }

        esQuery = buildESQuery(queryParams);
        esClient.post('busbud/city/_search', esQuery)
            .then(function (documents) {
                documents = parseOutput(documents);
                if (documents.length === 0) {
                    res.status(404);
                }
                res.json({suggestions: documents});
            }, function (err) {
                res.status(500).json({error: err});
            });
    }

};


