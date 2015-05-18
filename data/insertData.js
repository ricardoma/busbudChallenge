var tsv = require("node-tsv-json");
var Q = require('q');
var request = require('request');
var esClient = require('../esClient');

var _elasticSearchUrl = process.env.ES_URL;

if (!_elasticSearchUrl) {
    console.log('Missing ES_URL environment variable to connect to Elasticsearch');
    process.exit(1);
} else {
    esClient.setEsUrl(_elasticSearchUrl);
}

createIndex()
    .then(createCityMapping)
    .then(readTsv)
    .then(bulkInsert)
    .then(function(){
        console.log('Successfully created Index: "busbud", Mapping: "city" and inserted cities');
        process.exit(0);
    }, function(error) {
        console.log('Error ocurred when creating and inserting the cities to ES: \n', error);
        process.exit(1);
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
                "names_array": {
                    "type": "string",
                    "analyzer": "autocomplete"
                },
                "name": {
                    "type": "string"
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
                var names_array;

                if (city.name !== city.ascii) { names_array= [city.name, city.ascii]; }
                else { names_array = [city.name] }

                return {
                    _id: city.id,
                    names_array: names_array,
                    name: city.ascii,
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
