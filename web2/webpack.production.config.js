/**
 * Created by glenn on 05/01/16.
 */

const path    = require('path');
const webpack = require('webpack');

/**
 *
 * @see http://webpack.github.io/docs/configuration.html
 */
module.exports = {
  /**
   *
   * @see http://webpack.github.io/docs/configuration.html#devtool
   */
  devtool  : 'source-map',
  /**
   * Options affecting the resolving of modules.
   * @see http://webpack.github.io/docs/configuration.html#resolve
   */
  resolve  : {
    /**
     * The directory (absolute path) that contains your modules.
     * May also be an array of directories. This setting should be used to
     * add individual directories to the search path for resolving modules.
     * @see http://webpack.github.io/docs/configuration.html#resolve-root
     */
    root      : [
      path.resolve(__dirname, 'js'),
      path.resolve(__dirname, 'js/maps'),
      path.resolve(__dirname, 'js/maps/viewers'),
      path.resolve(__dirname, 'js/maps/ui'),
    ],
    /**
     * So that we can now require('file') instead of require('file.js')
     * @see https://github.com/petehunt/webpack-howto#4-compile-to-js-languages
     */
    extensions: ['', '.js', '.html', '.svg'],
  },
  /**
   * The entry point for the bundle. In our case, it's the entry point for
   * exposing `require` function of several public maps modules, which are:
   * 1) maps-initializer
   * 2) maps-debugger
   * 3) heremaps-static
   * 4) googlemaps-static
   * @see http://webpack.github.io/docs/configuration.html#entry
   */
  entry    : {
    maps: './js/maps/index.js',
  },
  output   : {
    path         : path.resolve(__dirname, 'js/maps/bundles'),
    filename     : '[name].bundle.js',
    chunkFilename: '[name].chunk.js',
    library      : 'require',
  },
  /**
   *
   * @see http://webpack.github.io/docs/library-and-externals.html#applications-and-externals
   */
  externals: {
    app               : 'App',
    heremaps          : 'H',
    googlemaps        : 'google.maps',
    'marker-clusterer': 'MarkerClusterer',
  },
  module   : {
    /**
     *
     * @see http://webpack.github.io/docs/loader-conventions.html
     * @see http://webpack.github.io/docs/list-of-loaders.html
     */
    loaders: [
      /*
       * ES6 (2015) for being cool of living on the edge, for later. ;)
       */
      {
        test  : /\.js$/,
        loader: 'babel',
        query : {
          presets: ['es2015', 'stage-2'],
        },
      },
    /**
     * Loader for HTML templates.
     * @see https://github.com/webpack/html-loader
     */
      {
        include: path.resolve(__dirname, 'js/maps/ui/tpl'),
        loader : 'html',
      },
    /**
     * Loader for SVG templates.
     * @see https://github.com/webpack/raw-loader
     */
      {
        include: path.resolve(__dirname, 'js/maps/ui/svg'),
        loader : 'raw',
      },
    /**
     * Shimming HERE and Google Maps modules.
     * @see http://webpack.github.io/docs/shimming-modules.html#script-loader
     */
      {
        test   : /\.js$/,
        loader : 'script',
        include: [
          path.resolve(__dirname, 'js/lib/heremaps'),
          path.resolve(__dirname, 'js/lib/googlemaps'),
        ],
      },
      {
        test   : /\.css$/,
        loader : 'style!css',
        include: path.resolve(__dirname, 'js/lib/heremaps'),
      },
    ],
  },
  plugins  : [
  /**
   * Move common modules from HERE and Google Maps chunks to the parent chunk.
   * @see http://webpack.github.io/docs/list-of-plugins.html#3-move-common-modules-into-the-parent-chunk
   * @see https://github.com/webpack/webpack/issues/1857
   */
    new webpack.optimize.CommonsChunkPlugin({

      // (select all children of chosen chunks)
      children: true,

      // (create an async commons chunk)
      //async: true
    }),
  /**
   * Assign the module and chunk ids by occurrence count. Ids that are used
   * often get lower (shorter) ids. This make ids predictable, reduces to
   * total file size and is recommended.
   * @see http://webpack.github.io/docs/list-of-plugins.html#occurrenceorderplugin
   */
    new webpack.optimize.OccurenceOrderPlugin(),
  /**
   *
   * @see http://webpack.github.io/docs/optimization.html#minimize
   */
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false,
      },
    }),
  ],
};
