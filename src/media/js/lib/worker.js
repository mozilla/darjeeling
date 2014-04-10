function log() {
  var msg = Array.prototype.slice.call(arguments, 0).join(' ');
  postMessage({type: 'log', data: msg});
}

var index;

function index(data) {
  // TODO: Have uglify inline these scripts when minfied.
  importScripts(data.min ? 'lunr.min.js' : 'lunr.js');
  importScripts(data.min ? 'lunr.unicodeNormalizer.min.js' : 'lunr.unicodeNormalizer.js');

  log('Loaded lunr v' + lunr.version);

  log('GET', data.url);

  // Define fields to index in lunr.
  index = lunr(function() {
    var that = this;
    Object.keys(data.fields).forEach(function(k) {
      that.field(k, data.fields[k]);
    });
    that.ref(data.ref || '_id');
  });

  // Fetch JSON of all the documents.
  var xhr = new XMLHttpRequest();
  xhr.onload = loadDocs;
  xhr.open('get', data.url, true);
  xhr.send();
}

var docs = {};
var docsList = [];

function loadDocs() {
  var list = JSON.parse(this.responseText);

  var _id;
  list.forEach(function indexDoc(doc) {
    if (Object.keys(doc).length) {
      _id = doc[index._ref].toString();
      docs[_id] = doc;
      docsList.push(doc);
      index.add(doc);
    }
  });

  log('Indexed ' + list.length +
      ' doc' + (list.length === 1 ? '' : 's'));

  postMessage({type: 'indexed', data: docs});
}

function searchDocs(data) {
  var results;
  var timeStart = data.timeStart;
  var query = data.query;
  log('Searching lunr for "' + query + '"');

  if (query) {
    // Return document for each match.
    results = index.search(query).map(function(v) {
      return {
        doc: docs[v.ref],
        score: v.score
      };
    });
  } else {
    // Return all documents if no query was provided.
    results = docsList.map(function(v) {
      return {
        doc: v
      };
    });
  }

  postMessage({
    type: 'results',
    data: {
      query: query,
      results: results,
      timeStart: timeStart
    }
  });
}

var methods = {
  index: index,
  search: searchDocs
};

addEventListener('message', function(e) {
  var method = methods[e.data.type];
  if (method) {
    method(e.data.data);
  }
}, false);
