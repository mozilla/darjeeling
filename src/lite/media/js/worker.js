define('worker', ['log'], function(log) {
  var console = log('worker');

  var methods = {
    'log': console.log
  };

  var worker = new Worker(JSON.parse(document.body.dataset.prod || 'false') ?
                          '/lite/media/js/lib/worker.min.js' :
                          '/lite/media/js/lib/worker.js');
  worker.addEventListener('message', function(e) {
    if (e.data.type in methods) {
      methods[e.data.type](e.data.data);
    }
  });

  return worker;
});
