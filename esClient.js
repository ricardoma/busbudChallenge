var Q = require('Q');
var request = require('request');

var ES_HOST = 'https://y12oj0lb:l4qi1edxatymw658@cypress-1961501.us-east-1.bonsai.io/';

function post(path, body, isJson) {
    var deferred = Q.defer();
    request({
        url: ES_HOST + path,
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

    batchInsert: batchInsert
};


