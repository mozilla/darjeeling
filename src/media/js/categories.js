define('categories', ['templating'], function(templating) {
    'use strict';
    var gettext = templating._l;

    var categories = [
      {
        name: gettext('categoryGames'),
        slug: 'games',
        components: ['games']
      },
      {
        name: gettext('categoryTools'),
        slug: 'tools',
        components: ['utilities', 'reference', 'productivity', 'education', 'business']
      },
      {
        name: gettext('categoryLifestyle'),
        slug: 'lifestyle',
        components: ['travel', 'sports', 'social', 'shopping', 'photo-video', 'news-weather', 'music',
                     'maps-navigation', 'lifestyle', 'health-fitness', 'entertainment', 'books']
      }
    ];

    // An object that maps slugs of <Zamboni category> => <Darjeeling category>.
    // Helpful for transforming data.
    var transformMap = {};
    for (var i = 0; i < categories.length; i++) {
      var cat = categories[i];
      for (var c = 0; c < cat.components.length; c++) {
        transformMap[cat.components[c]] = cat.slug;
      }
    }

    return {
      categories: categories,
      transformMap: transformMap
    };

});
