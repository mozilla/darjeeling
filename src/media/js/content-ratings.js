define('content-ratings', ['templating', 'utils'],
    function(templating, utils) {
    /* Fireplace's content_ratings.js stripped to only have Generic body. */
    'use strict';

    var format = utils.format;
    var gettext = templating._l;

    var detail_link = 'https://www.globalratings.com/ratings_guide.aspx';

    // L10n: For ages {0} and higher. (de) `ab {0} Jahren`.
    var RATING_NAME = gettext('For ages {0}+', 'iarc-rating');
    var names = {
        descriptors: {
            'discrimination': gettext('Discrimination', 'iarc-discrimination'),
            'drugs': gettext('Drugs', 'iarc-drugs'),
            'gambling': gettext('Gambling', 'iarc-gambling'),
            // L10n: `Language` as in foul language.
            'lang': gettext('Language', 'iarc-lang'),
            'online': gettext('Online', 'iarc-online'),
            'scary': gettext('Fear', 'iarc-fear'),
            // L10n: `Sex` as in sexual, not as in gender.
            'sex-content': gettext('Sex', 'iarc-sex'),
            'violence': gettext('Violence', 'iarc-violence'),
        },
        interactives: {
            'digital-purchases': gettext('Digital Purchases', 'iarc-purchases'),
            'shares-info': gettext('Shares Info', 'iarc-info'),
            'shares-location': gettext('Shares Location', 'iarc-location'),
            'users-interact': gettext('Users Interact', 'iarc-interact'),
        },
        ratings: {
            // L10n: (de) ab 0 Jahren.
            '0': gettext('For all ages', 'iarc-everyone'),
            '3': format(RATING_NAME, 3),
            '6': format(RATING_NAME, 6),
            '7': format(RATING_NAME, 7),
            '10': format(RATING_NAME, 10),
            '12': format(RATING_NAME, 12),
            '14': format(RATING_NAME, 14),
            '16': format(RATING_NAME, 16),
            '18': format(RATING_NAME, 18),
        },
    };

    return {
        detail_link: detail_link,
        names: names,
    };
});
