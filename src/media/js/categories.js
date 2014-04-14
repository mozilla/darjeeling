define('categories', ['templating'], function(templating) {
  'use strict';
  var gettext = templating._l;

  return {
    'games': {
      name: gettext('categoryGames'),
      slug: 'games',
      components: ['games']
    },
    'tools': {
      name: gettext('categoryTools'),
      slug: 'tools',
      components: ['utilities', 'reference', 'productivity', 'education', 'business']
    },
    'lifestyle': {
      name: gettext('categoryLifestyle'),
      slug: 'lifestyle',
      components: ['travel', 'sports', 'social', 'shopping', 'photo-video', 'news-weather', 'music',
                   'maps-navigation', 'lifestyle', 'health-fitness', 'entertainment', 'books']
    }
  };
});
