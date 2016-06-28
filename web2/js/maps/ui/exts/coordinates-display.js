/**
 * Created by Glenn on 2015-04-27.
 */

import App from 'app';

const CoordinatesDisplay = stampit()
  .props({

    /**
     * Model
     */
    viewer: undefined,
  })
  .init(({ instance }) => {
    const { viewer } = instance;

    /* region private properties */

    /**
     *
     */
    let coordinatesDisplayView;

    /*
     * Controller
     */
    let controller;

    /* endregion private properties */

    /* region privileged methods */

    _.assign(instance, {

      /**
       *
       * @param mapController
       */
      setController(mapController) {
        controller = mapController;
      },

      /**
       *
       * @param longitude
       * @param latitude
       */
      setCoordinates(longitude, latitude) {
        coordinatesDisplayView.val(
          `${longitude.toFixed(8)}, ${latitude.toFixed(8)}`);
      },
    });

    /* endregion privileged methods */

    /* region init code */

    const { lat, lng } = viewer.getCenter();
    const defaultCoordinates = [lng.toFixed(8), lat.toFixed(8)];

    coordinatesDisplayView = $('<input>')
      .addClass('form-control input-sm map-coordinatesdisplay')
      .attr({
        type         : 'text',
        title        : App.translate('Enter "longitude, latitude" coordinates and press enter.'),
        'data-toggle': 'tooltip', // Make it a nice Bootstrap tooltip.
        size         : 24,
      })
      .on('keydown', (e) => {

        if (e.which === 13) {   // "Enter" key

          const inputText         = $(e.target);
          const coordinatesString = inputText.val();
          const coordinates       = coordinatesString.split(',');
          const lng               = parseFloat(coordinates[0].trim());
          const lat               = parseFloat(coordinates[1].trim());

          if (_.isFinite(lng) && _.isFinite(lat)) {
            inputText.data('coordinatesString', coordinatesString);
            viewer.panTo(lng, lat);
          } else {
            inputText.val(
              inputText.data('coordinatesString'));
          }
        }
      })
      .val(defaultCoordinates.join(', '))
      .appendTo(viewer.container);

    /* endregion init code */
  });

export { CoordinatesDisplay as default, CoordinatesDisplay };
