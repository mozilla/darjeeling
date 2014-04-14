define('views/feedback',
       ['capabilities', 'dom', 'indexing', 'log', 'notification', 'templating', 'url'],
       function(caps, $, indexing, log, notification, templating, url) {

  var console = log('feedback');
  var indexed = indexing.index();
  var gettext = templating._l;
  var notify = notification.notification;

  //TODO: This page badly needs a back button.

  function feedback() {
    templating.render('feedback', {doc: doc}, function(res) {
      $('main').innerHTML = res;
      console.log('Done rendering feedback template...');
    });
  }

  $.delegate('submit', '.feedback-form', function(e) {
    e.preventDefault();

    // Manual XHRs are joyous fun!
    var req = new XMLHttpRequest();
    req.addEventListener('load', handler, false);
    req.addEventListener('error', error, false);

    var data = {
      chromeless: caps.chromeless,
      feedback: $('.feedback textarea').value || '',
      from_url: '/feedback/',
      sprout: 'potato',
      tuber: $('.feedback input[name=tuber]').value
    }

    req.open('POST', url('feedback'), true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.send(JSON.stringify(data));

    function handler() {
      if (this.readyState === 4) {
        if (this.status === 201) {
          success();
        } else {
          error();
        }
      }
    }

    function success() {
      notify({classes: 'success', message: gettext('Feedback sent')});
      disableForm();
    }

    function error() {
      notify({
        classes: 'error',
        message: gettext('Feedback was not sent successfully. Please try again later.')
      });
    }
  });

  function disableForm() {
    $('.feedback textarea').disabled = true;
    $('.feedback button').disabled = true;
  }

  function init(params) {
    console.log('Initializing feedback page...');
    if (document.body.dataset.page === 'feedback') {
      // Bail if we've already rendered this page.
      return feedback();
    }
    indexed.then(function(data) {
      doc = find(data, params.slug);
      // FIXME: error if not found
      document.body.className = 'feedback';
      document.body.dataset.page = 'feedback'; // FIXME: probably will need a different 'page' for each app. Use slug ?
      feedback();
    });
  }

  return {
    init: init,
  };
});
