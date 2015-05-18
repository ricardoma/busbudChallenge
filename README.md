# Solution to Busbud Coding Challenge

## Description

Hi Busbud Team,

To solve the coding challenge I decided to use Elasticsearch, due to the following reasons:
- Designed to work with text indexes.
- Built in support for coordinates/location queries.
- Ability to scale horizontally by adding more nodes.
- I've experience using mongoDB and mySQL full text indexing, and it's nowhere near as strong as ES. MongoDB, is only able to index full words.
- Learn a new tool.

My first step was to familiarize myself with Elasticsearch API (it's really verbose).
Once I was familiar enough, I created a lightweight client to talk to Elasticsearch's http API, using the following node modules: 'request' and 'Q'.

After, I created a script called insertData.js which reads the cities from the tsv and inserts them into ES using the _bulk API.
The next step was to install express.js and create the city.js module which performs the queries to ES.

### Details about Elasticsearch index, mappings, queries and scores

- The field that's used to perform queries by name is called 'names_array'. It's an array because there are cities where the name and ascii fields are different, like Montreal and Montréal.
- I created a filter called autocomplete_filter which is indexed as an 'edge-gram'. This means that for each name, up to 20 edge-grams are created. Ex: When indexing Toronto the following entries would be created: [t], [to], [tor], [toro], [toron], [toront], [toronto]. The goal of this index is to provide extremely fast autocompletion.
- The locations are indexed as geo_points.
- There are two types of queries:
    - Only q: Queries that only contain the q parameter, the scores for this type of query are calculate automatically by ES.
    - By Location: Queries that contain latitude, longitude and/or q. These queries use a special function to calculate the score. I decided to use a gaussian function (https://www.elastic.co/guide/en/elasticsearch/reference/1.x/query-dsl-function-score-query.html#_decay_functions), this function uses two parameters offset and scale. If the coordinates of the point are within the offset radious, the score is 1. After, for each range factor the score goes down. This is combined with the text score in case q was supplied.

## Documentation

The project is live at: https://busbudchallenge.herokuapp.com/suggestions

To make queries the following parameters can be passed:

- q: Partial/full name of the city
- latitude: Latitude of interest
- longitude: Longitude of interest
- page: The API returns 20 elements per page, starting from page=0. To access the next 20 elements set page to 1, and so on.

Examples:

- By city name: https://busbudchallenge.herokuapp.com/suggestions?q=toron
- By city name and location: https://busbudchallenge.herokuapp.com/suggestions?q=toron&latitude=43.70011&longitude=-79.4163
- By location: https://busbudchallenge.herokuapp.com/suggestions?latitude=43.70011&longitude=-79.4163&page=1

To run the project locally:

- Install Elasticsearch (https://www.elastic.co/downloads)
- Start Elasticsearch: ./elasticsearch (From the installed directory)
- Insert data to ES: ES_URL=http://localhost:9200 node data/insertData.js
- Run application: ES_URL=http://localhost:9200 node app.js
- Open: http://localhost:2345/suggestions and start querying cities!!


## Requirements

Design an API endpoint that provides auto-complete suggestions for large cities.
The suggestions should be restricted to cities in the USA and Canada with a population above 5000 people.

- the endpoint is exposed at `/suggestions`
- the partial (or complete) search term is passed as a querystring parameter `q`
- the caller's location can optionally be supplied via querystring parameters `latitude` and `longitude` to help improve relative scores
- the endpoint returns a JSON response with an array of scored suggested matches
    - the suggestions are sorted by descending score
    - each suggestion has a score between 0 and 1 (inclusive) indicating confidence in the suggestion (1 is most confident)
    - each suggestion has a name which can be used to disambiguate between similarly named locations
    - each suggestion has a latitude and longitude
- all functional tests should pass (additional tests may be implemented as necessary).
- the final application should be [deployed to Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs).
- feel free to add more features if you like!

#### Sample responses

These responses are meant to provide guidance. The exact values can vary based on the data source and scoring algorithm

**Near match**

    GET /suggestions?q=Londo&latitude=43.70011&longitude=-79.4163

```json
{
  "suggestions": [
    {
      "name": "London, ON, Canada",
      "latitude": "42.98339",
      "longitude": "-81.23304",
      "score": 0.9
    },
    {
      "name": "London, OH, USA",
      "latitude": "39.88645",
      "longitude": "-83.44825",
      "score": 0.5
    },
    {
      "name": "London, KY, USA",
      "latitude": "37.12898",
      "longitude": "-84.08326",
      "score": 0.5
    },
    {
      "name": "Londontowne, MD, USA",
      "latitude": "38.93345",
      "longitude": "-76.54941",
      "score": 0.3
    }
  ]
}
```

**No match**

    GET /suggestions?q=SomeRandomCityInTheMiddleOfNowhere

```json
{
  "suggestions": []
}
```


### Non-functional

- All code should be written in Javascript
- Mitigations to handle high levels of traffic should be implemented
- Work should be submitted as a pull-request to this repo
- Documentation and maintainability is a plus

### References

- Geonames provides city lists Canada and the USA http://download.geonames.org/export/dump/readme.txt
- http://www.nodejs.org/
- http://ejohn.org/blog/node-js-stream-playground/


## Getting Started

Begin by forking this repo and cloning your fork. GitHub has apps for [Mac](http://mac.github.com/) and
[Windows](http://windows.github.com/) that make this easier.

### Setting up a Nodejs environment

Get started by installing [nodejs](http://www.nodejs.org).

For OS X users, use [Homebrew](http://brew.sh) and `brew install nvm`

Once that's done, from the project directory, run

```
nvm use
```

### Setting up the project

In the project directory run

```
npm install
```

### Running the tests

The test suite can be run with

```
npm test
```

### Starting the application

To start a local server run

```
PORT=3456 npm start
```

which should produce output similar to

```
Server running at http://127.0.0.1:2345/suggestions
```
