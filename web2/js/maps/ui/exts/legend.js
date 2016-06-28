/**
 * Created by Glenn on 2015-04-27.
 */

import App from 'app';
import { project as mapsProject } from '../../project';
import { Styler } from '../../styler';

const { config } = App;
const { serviceUrls } = mapsProject;
const styler = Styler.getInstance();

const Legend = stampit()
  .props({

    /**
     * Model
     */
    viewer: undefined,
  })
  .init(({ instance }) => {
    const { viewer } = instance;

    /* region private properties */

    /*
     *
     */
    let legendHook;
    let legendContent;

    /*
     * Default general legend symbols applied for all customers.
     */
    const pairs = [
      ['Current', 'ROAM - arrow-blue'],
      ['Historical', 'ROAM - arrow-green'],
      ['Selected', 'ROAM - arrow-orange'],
      ['Alarmed', 'ROAM - arrow-red'],
      ['Engine On', 'ROAM - arrow-purple'],
      ['Engine Off', 'ROAM - arrow-gray'],
    ];

    if (App.config.map.legend.isDEWA) {
      _.remove(pairs, function (pair) {
        return (pair[0] === 'Historical');
      });
    }

    const legendSymbols = _.fromPairs(pairs);

    /*
     * Controller
     */
    let controller;

    /* endregion private properties */

    /* region private methods */

    /**
     *
     */
    function buildLegend() {

      /**
       * Generate popover html.
       * @type {*|jQuery|HTMLElement}
       */
      const legendList = $('<ul>').addClass('list-unstyled legend-list');

      _.forOwn(legendSymbols, (symbol, meaning) => {
        const asSvg      = true;
        const symbolIcon = styler.getDirectionIcon({
          mapCurrentSymbol: symbol,
          heading         : 45,
        }, asSvg);

        const legendEntry        = $('<li>').addClass('row');
        const meaningPlaceholder = $('<div>').addClass('col-sm-8');
        const symbolPlaceholder  = $('<div>').addClass('col-sm-4');

        meaningPlaceholder
          .text(App.translate(meaning))
          .appendTo(legendEntry);

        symbolPlaceholder
          .append(asSvg ? symbolIcon : $('<img>').attr('src', symbolIcon))
          .appendTo(legendEntry);

        legendList.append(legendEntry);
      });
      legendContent = legendList[0].outerHTML;

      const mapCanvas = viewer.container;

      legendHook = $('<button>')
        .addClass('btn btn-default map-legend')
        .attr({
          title        : App.translate('Legend'),
          'data-toggle': 'tooltip',
        })
        .popover({
          content  : legendContent,
          html     : true,
          placement: 'bottom',
          template : `
            <div class="popover map-legend-popover" role="tooltip">
              <div class="arrow"></div>
              <h3 class="popover-title"></h3>
              <div class="popover-content"></div>
            </div>
          `,
          viewport : mapCanvas,
        })
        .append($('<span>').addClass('glyphicon glyphicon-list-alt map-legend-icon'))
        .appendTo(mapCanvas);
    }

    /* endregion private methods */

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
       * @param visible
       */
      setVisible(visible) {
        legendHook.toggleClass('hidden', !visible);
      },
    });

    /* endregion privileged methods */

    /* region init code */

    /*
     * Customer-defined color coding added to the legend symbols.
     */
    const backendServiceEnabled = false;

    if (backendServiceEnabled) {
      const { domainObjectType, domainObjectId } = viewer;

      $.ajax({
        url : `${config.serviceUrl}${serviceUrls.legend.read}`,
        data: {
          domainObjectType,
          domainObjectId,
        },

        success(data) {
          const { legendData } = data;

          _.forEach(legendData, (el) => {
            legendSymbols[el.k] = App.translate(el.v);
          });
        },

        error(jqXHR, textStatus, errorThrown) {
          controller.logError('Error retrieving legend data.',
            new Error(errorThrown));
        },

        complete() {
          buildLegend();
        },
      });
    } else {
      buildLegend();
    }

    /* endregion init code */

  });

export { Legend as default, Legend };
