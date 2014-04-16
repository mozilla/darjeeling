define('views/category',
       ['categories', 'dom', 'install', 'log', 'templating'],
       function(categories, $, install, log, templating) {

  var console = log('views/category');
  var docs = [];

  function init(params) {
    console.log('Initializing category view: ' + params.slug);
    var category = categories[params.slug];
    var page_name = 'category-' + params.slug;
    var in_category = [];

    if (document.body.dataset.page === page_name) {
      console.log('Already loaded ' + page_name);
      return;
    }

    install.init().then(function(data) {
      docs = data;

      document.body.className = 'category';
      document.body.dataset.page = page_name;

      // Only show apps for this category.
      Object.keys(docs).forEach(function(key) {
        var app = docs[key];
        if (app.categories.indexOf(params.slug) > -1) {
          in_category.push({doc: app});
        }
      });

      // Render the document
      render(category, in_category);
    });
  }

  function render(category, apps) {
    var data = {results: apps};
    templating.render('nav', {page: category.slug}, function(res) {
      $('body > nav').innerHTML = res;
    });
    templating.render('browse', {page: category.slug}, function(res) {
      $('main').innerHTML = res;
      templating.render('results-header', {category: category}, function(res) {
        $('main header').innerHTML = res;
      });
      templating.render('results', {data: data, docs: docs}, function(res) {
        $('main ol').innerHTML = res;
      });
    });
    install.hideSplash();
  }

  return {
    init: init,
  };

});
