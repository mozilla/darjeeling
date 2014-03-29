define('cache', [], function() {
  function Cache() {
    var _cache = {};
    function _key(value) {
      return encodeURIComponent(value);
    }
    return {
      get: function(key) {
        return _cache[_key(key)];
      },
      exists: function(key) {
        return _key(key) in _cache;
      },
      set: function(key, value) {
        return _cache[_key(key)] = value;
      }
    };
  }

  return Cache;
});
