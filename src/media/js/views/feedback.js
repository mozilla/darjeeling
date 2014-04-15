define('views/feedback',
       ['capabilities', 'dom', 'indexing', 'log', 'notification', 'templating', 'url', 'utils',],
       function(caps, $, indexing, log, notification, templating, url, utils) {

  var console = log('feedback');
  var indexed = indexing.index();
  var gettext = templating._l;
  var notify = notification.notification;

  //TODO: This page badly needs a back button.

  function feedback() {
    templating.render('feedback', function(res) {
      $('main').innerHTML = res;
      console.log('Done rendering feedback template...');
    });
  }

  $.delegate('click', '.feedback button', function(e) {
    e.preventDefault();

    // Manual XHRs are joyous fun!
    var req = new XMLHttpRequest();
    req.addEventListener('load', success, false);
    req.addEventListener('error', error, false);

    var data = {
      chromeless: caps.chromeless,
      feedback: $('.feedback textarea').value || '',
      from_url: '/feedback/',
      sprout: 'potato',
      tuber: $('.feedback input[name=tuber]').value
    };

    req.open('POST', 'https://marketplace.firefox.com/api/v1/account/feedback/', true);
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
      notify({classes: 'success', message: gettext('Feedback successfully sent', 'feedbackSuccess')});
      disableForm();
    }

    function error() {
      utils.checkOnline().then(function() {
        notify({
          classes: 'error',
          message: gettext('Feedback was not sent successfully. Please try again later.', 'feedbackError')
        });
      }, function() {
        notify({
          classes: 'error',
          message: gettext('Sorry, you must be online to submit feedback.', 'feedbackOffline')
        });
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

    document.body.className = 'feedback';
    document.body.dataset.page = 'feedback';
    feedback();
  }

  return {
    init: init,
  };
});
