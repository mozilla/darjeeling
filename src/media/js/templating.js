define('templating', ['settings', 'utils'], function(settings, utils) {
  var SafeString = window.nunjucks.require('runtime').SafeString;
  var env = window.nunjucks.configure({autoescape: true});
  var envGlobals = window.nunjucks.require('globals');

  env.addGlobal = function(name, func) {
    envGlobals[name] = func;
  };

  env.makeSafe = function(func) {
    return function() {
      return new SafeString(func.apply(this, arguments));
    };
  };

  function render(name, ctx, cb) {
    if (typeof ctx === 'function') {
      // If callback passed in as second arg, asume no context.
      cb = ctx;
      ctx = {};
    }

    if (!cb) {
      // If no callback, don't pass into Nunjucks render.
      return env.render(name + '.html', ctx);
    }

    return env.render(name + '.html', ctx, function(err, res) {
      if (err) {
        return console.error(err);
      }
      cb(res);
    });
  }

  function _l(str, id, opts) {
    // For pluralisation.
    var pluralOpts = {};
    if (opts && 'n' in opts) {
      pluralOpts = {n: opts.n};
    }
    if (!id) {
      console.warn('Missing `id` in `locales.ini` for "' + str + '"');
    }
    // Use webL10n to localise.
    str = window._(id, pluralOpts) || str;
    return opts ? utils.format(str, opts) : str;
  }

  function nl2br(obj) {
    if (typeof obj !== 'string') {
      return obj;
    }
    return obj.replace(/\n/g, '<br>');
  }

  function summarise(str, klass) {
    // Truncates a long description into a visible portion and hidden portion.
    // Clicking on a "more" link reveals the hidden portion.
    var lines = str.split('\n');
    var firstLine = lines[0].replace(/<(?:.|\n)*?>/g, '').replace(/\..*:\s+/g, '.');
    lines.splice(0, 1);  // Remove first line now that we've stored it.

    return render('truncated', {
        'class': klass,
        'hidden_lines': lines,
        'visible_line': firstLine,
    });
  }

  env.addFilter('floor', Math.floor);
  env.addFilter('format', utils.format);
  env.addFilter('translate', utils.translate);
  env.addFilter('nl2br', nl2br);
  env.addFilter('summarise', summarise);

  env.addGlobal('_', env.makeSafe(_l));
  env.addGlobal('settings', settings);

  return {
    _l: _l,
    env: env,
    render: render
  };
});
