define('capabilities', [], function() {
  return {
    'chromeless': !!(window.locationbar && !window.locationbar.visible),
    'firefoxAndroid': navigator.userAgent.indexOf('Firefox') !== -1 && navigator.userAgent.indexOf('Android') !== -1,
    'firefoxOS': navigator.mozApps && navigator.mozApps.installPackage &&
                 navigator.userAgent.indexOf('Android') === -1 &&
                 navigator.userAgent.indexOf('Mobile') !== -1,
    'webApps': !!(navigator.mozApps),
    'packagedWebApps': !!(navigator.mozApps && navigator.mozApps.installPackage),
    'phantom': navigator.userAgent.match(/Phantom/),  // Don't use this if you can help it.
    'webactivities': !!(navigator.setMessageHandler || navigator.mozSetMessageHandler)
  };
});
