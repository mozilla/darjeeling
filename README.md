# metropolis


# Installation

We use [grunt](http://gruntjs.com/):

    npm install grunt-cli -g

Then install our dependencies:

    npm install

Copy over default settings:

    cp settings_local.js.dist settings_local.js


# Development

To watch nunjucks templates and compile them on the fly:

    grunt

To minify the assets for the production-ready `prod.html`:

    grunt minify

To run the dev server:

    npm start

Or

    node app.js

To load `settings.js` and then override those settings with those defined
in `settings_local.js`:

    npm start --settings=settings_local

To load `settings.js` and then override those settings with those defined
in `settings_prod.js`:

    npm start --settings=settings_prod

By default if the `--settings` flag is omitted, we default to loading
`settings_local`. If you specify a setting other than `settings_local`,
then `settings_local` will not get loaded and instead only that new setting
file will get loaded.
