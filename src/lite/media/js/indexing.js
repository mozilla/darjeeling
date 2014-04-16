define('indexing',
       ['cache', 'log', 'storage', 'url', 'worker'],
       function(Cache, log, storage, url, worker) {

  var cache = new Cache();
  var console = log('indexing');

  function index() {
    var promise = new Promise(function (resolve) {
      worker.addEventListener('message', function (e) {
        switch (e.data.type) {
        case 'indexed':
          return resolve(e.data.data);
        case 'reindexed_latest':
          return reindex_latest(e.data.data);
        case 'reindexed_cached':
          return reindex_cached(e.data.data);
        }
      });

      // Index the apps from the preloaded DB we have in appcache.
      worker.postMessage({
        type: 'index',
        data: {
          min: !!JSON.parse(document.body.dataset.prod || 'false'),
          url: url('search.docs.preloaded'),
          fields: {
            name_search: {boost: 25},
            app_url: {boost: 25},
            author: {boost: 20},
            slug: {boost: 20},
            description_search: {boost: 15},
            keywords: {boost: 14},
            category: {boost: 10}
          },
          ref: '_id'
        }
      });

      // Index the apps from the latest DB that contains apps added since the
      // user fetched the previous appcached, preloaded DB.
      worker.postMessage({
        type: 'reindex_latest',
        data: {
          url: url('search.docs.latest').replace('{hash}', document.body.dataset.preloaded_hash)
        }
      });

      // Index the apps from the preloaded DB we have in appcache.
      worker.postMessage({
        type: 'reindex_cached',
        data: {
          data: storage.getItem('docs:' + document.body.dataset.preloaded_hash) || '[]'
        }
      });
    });
    return promise;
  }

  function reindex_latest(newDocs) {
    console.log('Reindex from latest online DB successful');

    // TODO: Re-render current search view, if visible.

    cache.clear();

    var toCache = [];
    // mozAdd seems to want absolute URLs with domain, otherwise throws
    // NS_ERROR_MALFORMED_URI.
    var prefix = window.location.protocol + '//' + window.location.host;

    Object.keys(newDocs).forEach(function (key) {
      toCache.push(newDocs[key]);

      // Add icons and 1st screenshot thumbnail to Firefox's appcache.
      // See https://developer.mozilla.org/en-US/docs/nsIDOMOfflineResourceList
      if (window.applicationCache.mozAdd) {
        window.applicationCache.mozAdd(prefix + newDocs[key].icon);
        if (newDocs[key].previews.length > 0) {
          window.applicationCache.mozAdd(prefix + newDocs[key].previews[0].thumbnail_url);
        }
      }
    });

    // Store the new search docs in localStorage so these get indexed when we
    // are offline.
    storage.setItem('docs:' + document.body.dataset.preloaded_hash,
      JSON.stringify(toCache));
  }

  function reindex_cached(reindexedDocs) {
    console.log('Reindex from locally cached DB successful');

    // TODO: Re-render current search view, if visible.

    cache.clear();
  }

  return {
    index: index,
    cache: cache
  };
});
