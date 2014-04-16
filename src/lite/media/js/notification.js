define('notification', ['dom'], function($) {
  var hideTimer;
  var showTimer;

  var notificationEl = document.createElement('div');
  notificationEl.setAttribute('class', 'notification hidden');

  var contentEl = document.createElement('div');
  contentEl.classList.add('notification-content');

  notificationEl.appendChild(contentEl);
  document.body.appendChild(notificationEl);

  // Allow *bolded* message text.
  var re = /\*([^\*]+)\*/g;
  function fancy(s) {
    if (!s) {
      return;
    }
    return s.replace(re, function(_, match) {
      return '<b>' + match + '</b>';
    });
  }

  function notificationShow() {
    if (hideTimer) {
      window.clearTimeout(hideTimer);
    }
    notificationEl.classList.remove('hidden');
    // Delay to ensure transition onto screen happens.
    showTimer = window.setTimeout(function() {
      notificationEl.classList.add('show');
    }, 700);
  }

  function notificationHide() {
    if (showTimer) {
      window.clearTimeout(showTimer);
    }
    notificationEl.classList.remove('show');
    // This needs to be greater than the transition timing defined in CSS.
    hideTimer = window.setTimeout(function() {
      notificationEl.classList.add('hidden');
    }, 400);
  }

  function notificationPromise(opts) {
    return new Promise(function(resolve, reject) {
      var addedClasses = '';

      notificationEl = $('.notification');
      contentEl = $('.notification-content');

      contentEl.innerHTML = '';

      if (typeof opts === 'string') {
        opts = {message: opts};
      }

      var message = opts.message;
      if (!message) {
        return;
      }

      if ('classes' in opts) {
        addedClasses = opts.classes;
      }
      if (opts.closable) {
        addedClasses += ' closable';
      }

      notificationEl.setAttribute('class',
        'notification hidden ' + addedClasses);

      var fancyMessage = fancy(message);
      if (fancyMessage === message) {
        contentEl.textContent = message;
      } else {
        contentEl.innerHTML = fancyMessage;
      }

      notificationShow();

      setTimeout(function () {
        reject();
      }, opts.timeout || 2000);
    });
  }

  // Start off with a promise that always resolves.
  var sequence = Promise.resolve();

  function notification(opts) {
    // Add these actions to the end of the sequence.
    sequence = sequence.then(function() {
      return notificationPromise(opts);
    }).then(notificationHide).catch(notificationHide);
    return sequence;
  }

  $.delegate('touchend click', '.notification', function () {
    // TODO: resolve notification so `notificationHide()` gets called but
    // for only this notificatoin.
    notificationHide();
  });

  $.delegate('notification', $.body, function (text) {
    notification(text);
  });

  return {
    notification: notification
  };
});
