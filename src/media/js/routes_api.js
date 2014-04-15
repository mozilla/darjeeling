define('routes_api', [], function() {
  return {
    'feedback': 'https://marketplace.firefox.com/api/v1/account/feedback/',
    'search.docs.preloaded': '/db/preloaded.json',
    'search.docs.latest': '/db/latest-since-{hash}.json'
  };
});
