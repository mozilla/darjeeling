define('content-ratings', ['templating', 'utils'],
    function(templating, utils) {
    /* Fireplace's content_ratings.js stripped to only have Generic body. */
    'use strict';

    var format = utils.format;
    var gettext = templating._l;

    var detail_link = 'https://www.globalratings.com/ratings_guide.aspx';

    // L10n: For ages {0} and higher.
    var RATING_NAME = gettext('For ages {0}+', 'iarcRating');
    var names = {
        descriptors: {
            'discrimination': gettext('Discrimination', 'iarcDiscrimination'),
            'drugs': gettext('Drugs', 'iarcDrugs'),
            'gambling': gettext('Gambling', 'iarcGambling'),
            // L10n: `Language` as in foul language.
            'lang': gettext('Language', 'iarcLang'),
            'online': gettext('Online', 'iarcOnline'),
            'scary': gettext('Fear', 'iarcFear'),
            // L10n: `Sex` as in sexual, not as in gender.
            'sex-content': gettext('Sex', 'iarcSex'),
            'violence': gettext('Violence', 'iarcViolence'),
        },
        interactives: {
            'digital-purchases': gettext('Digital Purchases', 'iarcPurchases'),
            'shares-info': gettext('Shares Info', 'iarcInfo'),
            'shares-location': gettext('Shares Location', 'iarcLocation'),
            'users-interact': gettext('Users Interact', 'iarcInteract'),
        },
        ratings: function(age) {
            if (age === '0') {
                return gettext('Everyone', 'iarcEveryone');
            }
            return format(RATING_NAME, age);
        },
    };

    templating.env.addGlobal('iarc_names', names);

    return {
        detail_link: detail_link,
        names: names,
    };
});
