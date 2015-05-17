var esClient = require('./esClient');

function parseQuery(queryParams) {
    return {
        name: queryParams.q || '',
        lat: queryParams.latitude,
        lon: queryParams.longitude,
        distance: queryParams.distance
    }
}

function withCoordinatesFilter(lat, lon, distance) {
    return {
        "geo_distance": {
            "distance": distance || '100km',
            "location": {
                "lat": lat,
                "lon": lon
            }
        }
    }
}

function withCityName(q) {
    return {
            "match": {
                "name": {
                    "query": q,
                    "analyzer": "standard"
                }
            }
        }
}

function buildESQuery(queryParams) {
    var query;
    if (queryParams.lat !== undefined && queryParams.lon !== undefined) {
        query = {
            query : {
                filtered: {
                    filter: withCoordinatesFilter(queryParams.lat, queryParams.lon, queryParams.distance)
                }
            }
        };
        if (queryParams.name) {
            query.query.filtered.query = withCityName(queryParams.name)
        }
    } else {
        query = {
            query: withCityName(queryParams.name)
        }
    }
    return query;
}

module.exports = {

    query: function(req, res) {
        var queryParams = parseQuery(req.query);
        var esQuery = buildESQuery(queryParams);

        console.log(JSON.stringify(esQuery));

        esClient.post('busbud/city/_search', esQuery)
            .then(function(result) {
                res.json(result);
            });
    }

};


