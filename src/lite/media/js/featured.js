define('featured', ['settings', 'storage', 'log'], function(settings, storage, log) {

  var console = log('featured');

  // Constants representing cache keys.
  var ALL_FEATURED_APPS = 'featured_apps_all';
  var FEATURED_APPS = 'featured_apps_cached';
  var LAST_UPDATED = 'featured_apps_last_updated';

  return {

    all: function() {
      // This will eventually fetch from the JSON database. For now...
      var cached = JSON.parse(storage.getItem(ALL_FEATURED_APPS));
      if (!cached) {
        cached = [
          { name: 'trenta', weight: 10 },
          { name: 'venti', weight: 8 },
          { name: 'grande', weight: 6 },
          { name: 'tall', weight: 4 },
          { name: 'nessuno', weight: 2 }
        ];
        storage.setItem(JSON.stringify(ALL_FEATURED_APPS || {}), cached);
      }
      return cached;
    },

    get: function() {
      // Retrieve a subset of the featured apps from cache. If the cache has
      // expired, regenerate a random subset and return the featured apps.
      var today = new Date().toDateString();
      if (storage.getItem(LAST_UPDATED) === new Date().toDateString()) {
        console.log('Using featured apps from cache: ' + today);
        return JSON.parse(storage.getItem(FEATURED_APPS));
      }
      var regenerated = this.regenerate();
      storage.setItem(FEATURED_APPS, JSON.stringify(regenerated || {}));
      storage.setItem(LAST_UPDATED, today);
      return regenerated;
    },

    regenerate: function() {
      // From the pool of featured apps, return a randomized, weighted selection to be
      // displayed on the homepage.
      console.log('Generating a new selection of featured apps');
      var all = this.all();

      // Create a weighted array of all the available items' indexes in `all`.
      var weighted_index = [];
      for (var i = 0; i < all.length; i++) {
        for (var n = 0; n < Math.ceil(all[i].weight); n++) {
          weighted_index.push(i);
        }
      }

      // Choose the appropriate number of random unique indexes from the weighted array.
      var chosen_items = [];
      while (chosen_items.length < settings.numberFeatured && chosen_items.length < all.length) {
        var random = weighted_index[Math.floor(Math.random() * weighted_index.length)];
        if (chosen_items.indexOf(random) === -1) {
          chosen_items.push(random);
        }
      }

      // Map the chosen indexes back to their original objects.
      return chosen_items.map(function(item) {
        return all[item];
      });

    }

  };

});
