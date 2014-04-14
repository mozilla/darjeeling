define('routes_api', [], function() {
  return {
    'search.docs.preloaded': '/db/preloaded.json',
    'search.docs.latest': '/db/latest-since-{hash}.json',
    'feedback': '/api/v1/account/feedback/'
  };
});
