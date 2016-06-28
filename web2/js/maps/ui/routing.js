/**
 * Created by Glenn on 2015-05-11.
 */

import App from 'app';

const viewTemplate = require('./tpl/routing.tpl');
const { util, i18n } = App;

const RoutingControls = stampit()
  .props({

    /**
     *
     */
    routingView   : undefined,
    /**
     *
     */
    controlsView  : undefined,
    /**
     * Model
     */
    routingManager: undefined,
  })
  .methods({

    /**
     *
     * @param enabled
     */
    setProgressOverlayEnabled(enabled) {
      kendo.ui.progress(this.routingView, enabled);
    },

    /**
     *
     */
    expandRoutingPanel() {
      const { controlsView } = this;
      const panelBar = controlsView.data('kendoPanelBar');

      if (panelBar) {
        panelBar
          .expand('.mc-panel-routing');
      } else {
        controlsView
          .children('.mc-panelbar')
          .children('.mc-panel')
          .removeClass('k-state-active')
          .filter('.mc-panel-routing')
          .addClass('k-state-active');
      }
    },
  })
  .init(({ instance }) => {
    instance.routingView = $(viewTemplate);
    const { routingView, controlsView, routingManager } = instance;

    /* region private properties */

    /*
     * Controller
     */
    let controller;

    /*
     *
     */
    let waypointList;
    let addWaypointButton;
    let routeFeatures;
    let routeSummaryText;
    let maneuverList;
    let printRouteIcon;
    let saveRouteButton;

    /*
     *
     */
    let targetInputWidget;

    /* endregion private properties */

    /* region private methods */

    /**
     *
     * @param waypoint
     * @returns {*|jQuery|HTMLElement}
     */
    function createWaypointItem(waypoint) {
      const waypointItem = $('<li>')
        .addClass('waypoint-item');

      const waypointLabel = $('<span>')
        .addClass('label label-primary waypoint-label')
        .text(waypoint.label);

      const waypointInput = $('<input>')
        .addClass('waypoint-input')
        .val(waypoint.name)
        .on('input', _.debounce((e) => {
          const textbox        = $(e.target);
          const query          = textbox.val();
          const clearInputIcon = textbox.siblings('.waypoint-input-clear');

          targetInputWidget = textbox.data('kendoAutoComplete');

          if (query.length === 0) {
            clearInputIcon.fadeOut(200);
            textbox.width('100%');

            /*
             * Make waypoint value invalid,
             * but not removing it.
             */
            targetInputWidget.select(null);
            targetInputWidget.trigger('select');

          } else if (query.length >= 3) {
            textbox.width('85%');
            clearInputIcon.fadeIn(200);

            controller.onPlacesSearchRequested(query);

          } else {

            /*
             * Not a limbo; query's length is
             * between 1-2.
             */
            _.noop();
          }
        }, 600 /* Only consider input after this ms. */));

      const waypointRemover = $('<button>')
        .addClass('btn btn-link waypoint-remover')
        .attr('title', App.translate('Remove stop over'))
        .on('click', (e) => {
          const item = $(e.target).parent('.waypoint-item');

          controller.onWaypointItemRemovalRequested(item.index());
          controller.onRouteCalculationRequested();
        })
        .append($('<span>')
          .addClass('glyphicon glyphicon-remove'));

      waypointItem.append(
        [waypointLabel, waypointInput, waypointRemover]);

      const kWaypointInput = waypointInput.kendoAutoComplete({
        dataSource   : routingManager.getPlaces(),
        dataTextField: 'name',
        delay        : 1200,
        minLength    : 3,
        placeholder  : App.translate('Select stop over...'),
        template     : '<span class="mc-icon #=data.icon#"></span><span>#=data.name#</span>',
        /**
         *
         */
        filtering(e) {

          /*
           * No need to do filtering again as the data
           * that we received from the services is
           * already filtered; just return "as-is" and
           * show everything.
           */
          e.filter.value = '';
        },

        select(e) {
          const { item, sender } = e;
          const selectedItem = item;
          const widget       = sender;
          /*
           *
           */
          const waypointModel = {
            lat             : NaN,
            lng             : NaN,
            name            : '',
            domainObjectType: '',
            domainObjectId  : '',
          };
          const index         = widget.wrapper
                                      .parent('.waypoint-item')
                                      .index();

          if (selectedItem) {
            const selectedItemIndex = selectedItem.index();

            /*
             * Make sure the data source of the
             * widget is refreshed, because most of
             * time it is not. Ok, this is becoming
             * more like a "in-between" move in chess.
             */
            sender.dataSource.read();

            const dataItem = widget.dataItem(selectedItemIndex);
            const { lat, lng, name, domainObjectType, domainObjectId } = dataItem;

            _.assign(waypointModel, {
              lat,
              lng,
              name,
              domainObjectType,
              domainObjectId,
            });
          }

          controller.onWaypointItemSelected(waypointModel, index);
          controller.onRouteCalculationRequested();
        },
      }).data('kendoAutoComplete');

      // clearInputIcon
      $('<span>')
        .addClass('k-icon k-i-close waypoint-input-clear')
        .on('click', (e) => {
          const icon    = $(e.target);
          const textbox = icon.siblings('.waypoint-input');

          textbox
            .val('')
            .trigger('input')
            .data('kendoAutoComplete')
            .close();
        })
        .appendTo(kWaypointInput.wrapper)
        .hide();

      return waypointItem;
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
       */
      updateSaveRouteButton() {
        saveRouteButton.prop('disabled', !routingManager.routeExists());
      },

      /**
       * The waypoints render quite dodgy when adding or removing
       * a waypoint, and/or after rendering route. Duck-punch it.
       * @see https://en.wikipedia.org/wiki/Monkey_patch
       */
      duckPunchWaypoints() {

        if (!kendo.support.browser.msie) {
          const win        = $(window);
          const scrollTop0 = win.scrollTop();

          /*
           * Doing this in IE wrongly triggers Kendo UI
           * AutoComplete's select event on the waypoint input
           * element :|
           */
          waypointList
            .children('.waypoint-item')
            .find('input.waypoint-input')
            .focus().blur();

          win.scrollTop(scrollTop0);
        }
      },

      /**
       *
       * @param waypoint
       * @param index
       */
      onWaypointAdded(waypoint, index) {
        const waypointItems = waypointList.children('li');
        const waypointItem  = createWaypointItem(waypoint);
        const len           = waypointItems.length;

        if (index >= len) {
          waypointList.append(waypointItem);
        } else {
          waypointItems.eq(index).before(waypointItem);
        }

        const removerHidden = (index === 0) || (index === len);
        waypointItem
          .children('.waypoint-remover')
          .toggleClass('hidden', removerHidden);

        waypoint.listItem = waypointItem;

        instance.duckPunchWaypoints();
      },

      /**
       *
       * @param waypoint
       */
      onWaypointRemoved(waypoint) {
        waypoint.listItem.remove();

        instance.duckPunchWaypoints();
      },

      /**
       *
       * @param waypoint
       * @param toIndex
       */
      onWaypointReordered(waypoint, toIndex) {
        let waypointItem       = waypoint.listItem;
        const waypointItemData = waypointItem.data();
        const moved            = (waypointItemData.toIndex === toIndex);

        if (!moved) {
          waypointItem = waypointItem.detach();

          const waypointItems = waypointList.children('li');
          const len           = waypointItems.length;

          if (toIndex >= len) {
            toIndex = len;
            waypointList.append(waypointItem);
          } else {
            waypointItems.eq(toIndex).before(waypointItem);
          }

          waypointItemData.toIndex = toIndex;
        }
      },

      /**
       *
       * @param waypoint
       */
      onWaypointChanged(waypoint) {
        const { listItem } = waypoint;

        if (listItem) {
          listItem
            .find('input.waypoint-input')
            .data('kendoAutoComplete')
            .value(waypoint.name);
        }
      },

      /**
       *
       * @param waypoints
       */
      onWaypointsLabelChanged(waypoints) {
        const len = waypoints.length;

        _.forEach(waypoints, (waypoint, i) => {
          const { listItem } = waypoint;

          if (listItem) {
            listItem
              .children('.waypoint-label')
              .text(waypoint.label);

            const removerHidden = (i === 0) || (i === len - 1);
            listItem
              .children('.waypoint-remover')
              .toggleClass('hidden', removerHidden);
          }
        });
      },

      /**
       *
       * @param places
       */
      onPlacesChanged(places) {

        if (targetInputWidget) {

          /*
           * Kendo's way of refreshing the data source properly
           * for the AutoComplete widget. :o
           */
          targetInputWidget.setDataSource(
            new kendo.data.DataSource({ data: places }));

          targetInputWidget.dataSource.read();
        }
      },

      /**
       *
       * @param featureName
       * @param avoided
       */
      onRouteFeatureChanged(featureName, avoided) {
        routeFeatures
          .find(`[data-featurename="${featureName}"]`)
          .prop('checked', !avoided);
      },

      /**
       *
       * @param summary
       */
      onRouteSummaryChanged(summary) {
        const { distance, duration } = summary;
        const summaryExists = Boolean(distance && duration);

        if (summaryExists) {
          routeSummaryText.html(util.format.routeSummary(summary));
        }

        routeSummaryText
          .closest('.route-summary')
          .toggleClass('hidden', !summaryExists);
      },

      /**
       *
       * @param maneuvers
       */
      onManeuversChanged(maneuvers) {
        maneuverList.empty();

        _.forEach(maneuvers, (maneuver) => {
          const maneuverItem = $('<li>')
            .addClass('list-group-item')
            .html(maneuver.instruction);

          const { baseCssAction, action } = maneuver;

          if (baseCssAction && action) {
            maneuverItem
              .prepend($('<span>')
                .addClass(baseCssAction)
                .addClass(action));
          }

          maneuverList.append(maneuverItem);
        });

        maneuverList
          .closest('.route-directions')
          .toggleClass('hidden', _.isEmpty(maneuvers));
      },
    });

    /* endregion privileged methods */

    /* region init code */

    controlsView
      .find('.mc-panelbar:first')
      .append(routingView);
    i18n.translateContent(routingView);

    waypointList      = routingView.find('.waypoint-list');
    addWaypointButton = routingView.find('[name="add-waypoint"]');
    routeFeatures     = routingView.find('.route-features');
    routeSummaryText  = routingView.find('.route-summary-text');
    maneuverList      = routingView.find('.maneuver-list');
    printRouteIcon    = routingView.find('.print-route');
    saveRouteButton   = routingView.find('[name="save-route"]');

    waypointList.sortable({
      cursor: 'move',

      start(e, ui) {
        const { item } = ui;
        const itemData = item.data();

        itemData.fromIndex = item.index();
      },

      stop(e, ui) {
        const { item } = ui;
        const itemData = item.data();

        itemData.toIndex = item.index();
        const { fromIndex, toIndex } = itemData;
        controller.onWaypointItemReorderingRequested(fromIndex, toIndex);
        controller.onRouteCalculationRequested();
      },
    });

    addWaypointButton.on('click', () => {
      controller.onWaypointItemAdditionRequested(
        routingManager.getWaypoints().length - 1);
    });

    routeFeatures
      .find('.route-feature')
      .each((e) => {
        const feature = $(e.target);

        if (routingManager.getViewerModuleName().match(/googlemaps/i)) {
          const featureName        = feature.data('featurename');
          const googleMapsFeatures = ['tollroad', 'motorway', 'boatFerry'];
          const featureEnabled     = _.includes(googleMapsFeatures, featureName);

          feature
            .prop('disabled', !featureEnabled)
            .closest('.checkbox')
            .toggleClass('disabled', !featureEnabled);
        }
      })
      .on('click', (e) => {
        const feature = $(e.target);

        controller.onRouteFeatureToggled(
          feature.data('featurename'), feature.is(':checked'));
        controller.onRouteCalculationRequested();
      });

    printRouteIcon.on('click', () => controller.onMapsPrintRequested(true));

    saveRouteButton.on('click', () => controller.onRouteSavingRequested());

    /* endregion init code */
  });

export { RoutingControls as default, RoutingControls };
