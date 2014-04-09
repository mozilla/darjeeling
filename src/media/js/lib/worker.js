function log() {
  var msg = Array.prototype.slice.call(arguments, 0).join(' ');
  postMessage({type: 'log', data: msg});
}

var index;

function index(data) {
  // TODO: Have uglify inline these scripts when minfied.
  importScripts(data.min ? '../../../media/js/lib/lunr.min.js' :
                           '../../../media/js/lib/lunr.js');
  importScripts(data.min ? '../../../media/js/lib/lunr.unicodeNormalizer.min.js' :
                           '../../../media/js/lib/lunr.unicodeNormalizer.js');

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
  xhr.onload = function () {
    loadDocs(this.responseText);
  };
  xhr.open('get', data.url, true);
  xhr.send();
}

function reindex_latest(data) {
  log('GET', data.url);
  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    loadDocs(this.responseText, true);
  };
  xhr.open('get', data.url, true);
  xhr.send();
}

function reindex_cached(data) {
  log('Using cached docs');
  loadDocs(data.data, false, true);
}

var docs = {};
var docsList = [];

function loadDocs(response, latest, cached) {
  var list = JSON.parse(response);

  var _id;
  var cnt = 0;
  list.forEach(function indexDoc(doc) {
    if (Object.keys(doc).length) {
      _id = doc[index._ref].toString();
      if (_id in docs) {
        // Bail out if we've already indexed this doc.
        return;
      }
      docs[_id] = doc;
      docsList.push(doc);
      index.add(doc);
      cnt++;
    }
  });

  var where = 'preloaded';
  var indexType = 'indexed';

  if (latest) {
    where = 'online';
    indexType = 'reindexed_latest';
  } else if (cached) {
    where = 'cached';
    indexType = 'reindexed_cached';
  }

  log('Indexed ' + cnt + ' doc' + (cnt === 1 ? '' : 's') + ' from ' +
      where + ' database');
  postMessage({type: indexType, data: docs});
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
  search: searchDocs,
  reindex_cached: reindex_cached,
  reindex_latest: reindex_latest
};

addEventListener('message', function(e) {
  var method = methods[e.data.type];
  if (method) {
    method(e.data.data);
  }
}, false);
