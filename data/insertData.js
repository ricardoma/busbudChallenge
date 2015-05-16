var tsv = require("node-tsv-json");
var Q = require('q');
var request = require('request');
var esClient = require('../esClient');

createIndex()
    .then(createCityMapping)
    .then(readTsv)
    .then(bulkInsert)
    .then(function(){
        console.log('Successfully created Index: "busbud", Mapping: "city" and inserted cities');
    }, function(error) {
        console.log('Error ocurred when creating and inserting the cities to ES: \n', error);
    });


function createIndex() {
    var query = {
        "settings": {
            "number_of_shards": 1,
            "analysis": {
                "filter": {
                    "autocomplete_filter": {
                        "type": "edge_ngram",
                        "min_gram": 1,
                        "max_gram": 20
                    }
                },
                "analyzer": {
                    "autocomplete": {
                        "type": "custom",
                        "tokenizer": "standard",
                        "filter": [
                            "lowercase",
                            "autocomplete_filter"
                        ]
                    }
                }
            }
        }
    };

    return esClient.post('busbud', query);
}

function createCityMapping() {
    var query = {
        "city": {
            "properties": {
                "name": {
                    "type": "string",
                    "analyzer": "autocomplete"
                },
                "location": {
                    "type": "geo_point"
                },
                "country": {
                    "type": "string"
                },
                "population": {
                    "type": "integer"
                },
                "tz": {
                    "type": "string"
                }
            }
        }
    };

    return esClient.post('busbud/_mapping/city', query);
}

function readTsv() {
    var deferred = Q.defer();
    tsv({
        input: __dirname + "/cities_canada-usa.tsv"
    }, function(err, results) {
        if(err) {
            console.error(err);
        }else {
            results = results.map(function(city){
                return {
                    _id: city.id,
                    name: city.name,
                    location: {
                        lat: Number(city.lat),
                        lon: Number(city.long)
                    },
                    country: city.country,
                    population: city.population,
                    tz: city.tz
                }
            });
            deferred.resolve(results);
        }
    });
    return deferred.promise;
}

function bulkInsert(cities) {
    return esClient.batchInsert('busbud', 'city', cities);
}
