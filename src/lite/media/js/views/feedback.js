define('views/feedback',
       ['capabilities', 'dom', 'indexing', 'log', 'notification', 'routes_api', 'templating', 'url', 'utils',],
       function(caps, $, indexing, log, notification, routes_api, templating, url, utils) {

  var console = log('feedback');
  var indexed = indexing.index();
  var gettext = templating._l;
  var notify = notification.notification;

  //TODO: This page badly needs a back button.

  function feedback() {
    templating.render('nav', function(res) {
      $('body > nav').innerHTML = res;
    });
    templating.render('feedback', function(res) {
      $('main').innerHTML = res;
      console.log('Done rendering feedback template...');
    });
  }

  $.delegate('click', '.feedback button', function(e) {
    e.preventDefault();

    var data = {
      chromeless: caps.chromeless,
      feedback: $('.feedback textarea').value || '',
      from_url: '/feedback/',
      sprout: 'potato',
      tuber: $('.feedback input[name=tuber]').value
    };

    $.post(routes_api.feedback, data).then(function() {
      // Success handler.
      notify({classes: 'success', message: gettext('Feedback successfully sent', 'feedbackSuccess')});
      $('.feedback-form').reset();
    }, function() {
      // Error handler.
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
    });
  });

  function init() {
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
