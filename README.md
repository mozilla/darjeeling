# metropolis


# Installation

We use [grunt](http://gruntjs.com/):

    npm install grunt-cli -g

Then install our dependencies:

    npm install


# Development

To watch nunjucks templates and compile them on the fly:

    grunt

To minify the assets for the production-ready `prod.html`:

    grunt minify

To run the dev server:

    npm start

To run the production-ready server:

    DEBUG=0 npm start
