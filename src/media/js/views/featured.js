define('views/featured',
       ['dom', 'indexing', 'log', 'templating'],
       function($, indexing, log, templating) {

  var console = log('views/featured');
  var docs = [];
  var featured = [];
  var indexed = indexing.index();

  function init(params) {
    console.log('Initializing featured view');
    var page_name = 'featured';

    if (document.body.dataset.page === page_name) {
      console.log('Already loaded ' + page_name);
      return;
    }

    indexed.then(function(data) {

      docs = data;
      document.body.className = page_name;
      document.body.dataset.page = page_name;
      timeStart = window.performance.now();

      // This will eventually be replaced by real logic.
      Object.keys(docs).forEach(function(key) {
        if(Math.random() > 0.66) {
          featured.push({doc: docs[key]});
        }
      });

      // Render the document
      render(featured);

    });

  }

  function render(featured) {
    var data = {results: featured};
    templating.render('nav', {page: 'featured'}, function(res) {
      $('body > nav').innerHTML = res;
    });
    templating.render('browse', function(res) {
      $('main').innerHTML = res;
      templating.render('results-header', {data: data}, function(res) {
        $('main header').innerHTML = res;
      });
      templating.render('results', {data: data, docs: null}, function(res) {
        $('main ol').innerHTML = res;
        console.log('Finished rendering featured view.')
      });
    });
  }

  return {
    init: init,
  };

});
