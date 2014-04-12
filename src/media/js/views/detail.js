define('views/detail',
       ['apps', 'content-ratings', 'cache', 'dom', 'indexing', 'log', 'notification', 'pages', 'settings', 'storage', 'templating', 'url', 'utils'],
       function(apps, Cache, iarc, $, indexing, log, notification, pages, settings, storage, templating, url, utils) {

  var console = log('detail');
  var indexed = indexing.index();
  var doc;
  var activeThumbnail = 0;

  /* FIXME: more hacking. maintaining a list of slugs->ids would probably be a good idea */
  function find(data, slug) {
    var ids = Object.keys(data);
    var length = ids.length;
    for (var i = 0; i < length; i++) {
      if (data[ids[i]].slug === slug) {
        return data[ids[i]];
      }
    }
    return null;
  }

  function details() {
    templating.render('detail', {doc: doc}, function(res) {
      $('main').innerHTML = res;
      console.log('Done rendering detail template...');
    });
  }

  function init(params) {
    console.log('Initializing detail page...');
    if (document.body.dataset.page === 'detail') {
      // Bail if we've already rendered this page.
      return details();
    }
    indexed.then(function(data) {
      doc = find(data, params.slug);
      // FIXME: error if not found
      document.body.className = 'detail';
      document.body.dataset.page = 'detail'; // FIXME: probably will need a different 'page' for each app. Use slug ?
      details();
    });
  }

  function switchThumb(index) {
    if (isNaN(index)) {
      return;
    }
    var sel = '.thumbnail-switcher a:nth-child(' + (index + 1) +')';
    var link = $(sel);
    console.log(sel);
    console.log(link);
    var img = $('.thumbnail img');
    $.each('.thumbnail-switcher a', function(item) {
      item.classList.remove('active');
    });
    img.src = link.dataset.thumbnail;
    img.dataset.screenshot = link.dataset.screenshot;
    link.className = 'active';
    activeThumbnail = index;
    console.log('Setting active to ' + activeThumbnail);
  }

  $.delegate('click', '.thumbnail-switcher a', function(e) {
    e.preventDefault();
    switchThumb(parseInt(e.delegateTarget.dataset.index, 10));
  }, false);

  $.delegate('click', '.thumbnail button', function(e) {
    e.preventDefault();
    var idx = activeThumbnail + ((e.delegateTarget.dataset.action === 'prev') ? -1 : 1);
    switchThumb(utils.mod(idx, doc.previews.length));
  }, false);

  return {
    init: init,
  };
});
