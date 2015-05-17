var expect = require('chai').expect;
var app = require('../app');
var request = require('supertest')(app);

describe('GET /suggestions', function () {
    describe('with a non-existent city', function () {
        var response;

        before(function (done) {
            request
                .get('/suggestions?q=SomeRandomCityInTheMiddleOfNowhere')
                .end(function (err, res) {
                    response = res;
                    response.json = JSON.parse(res.text);
                    done(err);
                });
        });

        it('returns a 404', function () {
            expect(response.statusCode).to.equal(404);
        });

        it('returns an empty array of suggestions', function () {
            expect(response.json.suggestions).to.be.instanceof(Array);
            expect(response.json.suggestions).to.have.length(0);
        });
    });

    describe('with incorrect parameters', function () {
        var cases = {
            responseWithoutParams: {url: '/suggestions', response: undefined},
            responseWithoutLatitude: {url: '/suggestions?longitude=67.3', response: undefined},
            responseWithoutLongitude: {url: '/suggestions?latitude=67.3', response: undefined},
            responseWithNonNumericalLatitude: {url: '/suggestions?latitude=notANumber&longitude=67.3', response: undefined},
            responseWithNonNumericalLongitude: {url: '/suggestions?longitude=notANumber&latitude=67.3', response: undefined}
        };

        before(function (done) {
            var counter = 0;

            function completed() {
                counter++;
                if (counter === 5) done();
            }

            function makeRequest(c) {
                request
                    .get(c.url)
                    .end(function (err, res) {
                        c.response = res;
                        completed();
                    });
            }

            for (var key in cases) {
                makeRequest(cases[key]);
            }
        });

        it('returns a 400', function () {
            for (var key in cases) {
                var c = cases[key];
                expect(c.response.statusCode).to.equal(400);
            }
        });

    });

    describe('with a valid city', function () {
        var response;

        before(function (done) {
            request
                .get('/suggestions?q=Montreal')
                .end(function (err, res) {
                    response = res;
                    response.json = JSON.parse(res.text);
                    done(err);
                });
        });

        it('returns a 200', function () {
            expect(response.statusCode).to.equal(200);
        });

        it('returns an array of suggestions', function () {
            expect(response.json.suggestions).to.be.instanceof(Array);
            expect(response.json.suggestions).to.have.length.above(0);
        });

        it('contains a match', function () {
            expect(response.json.suggestions).to.satisfy(function (suggestions) {
                return suggestions.some(function (suggestion) {
                    return /montreal/i.test(suggestion.name);
                });
            })
        });

        it('contains latitudes and longitudes', function () {
            expect(response.json.suggestions).to.satisfy(function (suggestions) {
                return suggestions.every(function (suggestion) {
                    return suggestion.latitude && suggestion.longitude;
                });
            })
        });

        it('contains scores', function () {
            expect(response.json.suggestions).to.satisfy(function (suggestions) {
                return suggestions.every(function (suggestion) {
                    return suggestion.latitude && suggestion.longitude;
                });
            })
        });
    });
});