const { environment } = require('@rails/webpacker');

// Add .jsx extension resolution
environment.config.resolve.extensions.push('.jsx');

// Configure sass-loader to use Dart Sass instead of node-sass
const sassLoader = environment.loaders.get('sass');
sassLoader.use.find(x => x.loader === 'sass-loader').options.implementation = require('sass');

module.exports = environment;
