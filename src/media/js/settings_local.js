define('settings_local', [], function() {
    // Override settings here!
    return {
        // No trailing slash, please./
        apiURL: window.location.origin,
        numberFeatured: 3
    };
});
