define('views/detail',
       ['apps', 'content-ratings', 'cache', 'dom', 'install', 'log', 'notification', 'pages', 'settings', 'storage', 'templating', 'url', 'utils'],
       function(apps, Cache, iarc, $, install, log, notification, pages, settings, storage, templating, url, utils) {
  var console = log('detail');
  var doc;
  var activeThumbnail = 0;
  var lightbox = $('#lightbox');

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
    templating.render('nav', function(res) {
      $('body > nav').innerHTML = res;
    });
    templating.render('detail', {doc: doc}, function(res) {
      $('main').innerHTML = res;
    });
  }

  function init(params) {
    console.log('Initializing detail page...');
    if (document.body.dataset.page === 'detail-' + params.slug) {
      // Bail if we've already rendered this page.
      return;
    }
    install.init().then(function(data) {
      doc = find(data, params.slug);
      // FIXME: error if not found
      document.body.className = 'detail';
      document.body.dataset.page = 'detail-' + doc.slug;
      details();
      install.hideSplash();
    });
  }

  function switchThumb(index) {
    if (isNaN(index)) {
      return;
    }
    var link = $('.thumbnail-switcher a:nth-child(' + (index + 1) +')');
    var img = $('.thumbnail img');
    $.each('.thumbnail-switcher a', function(item) {
      item.classList.remove('active');
    });
    img.src = link.dataset.thumbnail;
    img.dataset.screenshot = link.dataset.screenshot;
    link.className = 'active';
    activeThumbnail = index;
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

  // Might be wise to make a module of these eventually.
  // Start of lightbox code.
  $.delegate('click', '.thumbnail a', function(e) {
    toggleLightbox();
    initImage(e.target);
  });

  function initImage(img) {
    var i = new Image();
    lightbox.classList.add('loading');

    // TODO: Loading animation? Might perform horribly.
    i.onload = function() {
        lightbox.classList.remove('loading');
        lightbox.appendChild(i);
    };
    i.onerror = function() {
        var b = document.createElement('b');
        b.classList.add('err');
        b.appendChild(document.createTextNode('&#x26A0;'))
        lightbox.classList.remove('loading');
        lightbox.appendChild(b);
    };

    // This will eventually need to use the data-screenshot attr.
    i.src = img.src;
  }

  $.delegate('click', '#lightbox', function() {
    toggleLightbox();
    while(lightbox.firstChild) {
      lightbox.removeChild(lightbox.firstChild);
    }
    lightbox.classList.remove('loading');
  });

  function toggleLightbox() {
    $('body').classList.toggle('overflowed');
    $('#lightbox').classList.toggle('active');
  }
  // End of lightbox code.

  return {
    init: init,
  };
});
