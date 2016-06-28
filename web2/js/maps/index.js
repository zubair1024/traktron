/**
 * Created by glenn on 05/01/16.
 */

/**
 * Babel polyfill (adds Promise, Object.values() etc. if not supported (yet)).
 * @see https://babeljs.io/docs/usage/polyfill/
 */
import 'babel-polyfill';

/**
 * Set `__webpack_public_path__` on our entry point.
 * @see http://webpack.github.io/docs/configuration.html#output-publicpath
 */
const scripts           = document.getElementsByTagName('script');
const src               = _.last(_.toArray(scripts)).getAttribute('src');
__webpack_public_path__ = src.substr(0, src.lastIndexOf('/') + 1);

/**
 * The entry point of the maps module, expose the `require` function.
 * @see http://webpack.github.io/docs/webpack-for-browserify-users.html#external-requires
 */
module.exports = ((parentRequire) => (module) => {
  const requireActions = {
    'maps-initializer' : () => require('initializer').default,
    'maps-debugger'    : () => require('debugger').default,
    'heremaps-static'  : () => require('heremaps/static-map').default,
    'googlemaps-static': () => require('googlemaps/static-map').default,
    'es6-playground'   : () => require('es6.playground').default,
  };

  const requireAction = requireActions[module];

  if (!_.isFunction(requireAction)) {
    return parentRequire(module);
  }

  return requireAction();
})(_.isFunction(__non_webpack_require__) ?
   __non_webpack_require__ : (module) => {
  throw new Error(`Module ${module} not found`);
});
