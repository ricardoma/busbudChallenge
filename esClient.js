// Lightweight client to query elasticsearch, makes requests and returns promises
var Q = require('Q');
var request = require('request');

// URL of elasticsearch
var ES_URL;

function post(path, body, isJson) {
    var deferred = Q.defer();
    request({
        url: ES_URL + path,
        method: "POST",
        json: !!isJson,
        body: body
    }, function(err, response, body) {
        if (err) {
            console.log(err);
            deferred.reject(err);
        } else {
            deferred.resolve(body);
        }
    });
    return deferred.promise;
}

// To use elasticsearch bulk API, the body of the request must be in plain text.
// Composed of: operation \n document \n operation \n document
function batchInsert(index, type, documents) {
    var body = '';
    var insertTemplate = { "create":  { "_index": index, "_type": type, "_id": undefined }};

    documents.forEach(function(doc) {
        insertTemplate.create._id = doc._id;
        body += JSON.stringify(insertTemplate) + '\n' + JSON.stringify(doc) + '\n';
    });

    return post('_bulk', body, false);
}


module.exports = {

    post: function (path, body) {
        return post(path, body, true);
    },

    setEsUrl: function(url) {
        ES_URL = url
        console.log(ES_URL);
    },

    batchInsert: batchInsert
};


