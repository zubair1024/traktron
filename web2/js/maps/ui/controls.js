/**
 * Created by Glenn on 2015-02-06.
 */

import App from 'app';
import { LayerManager } from '../viewers/manager/layer-manager';
import { AnimationManager } from '../viewers/manager/animation-manager';
import { Styler } from '../styler';

const viewTemplate = require('./tpl/controls.tpl');

const { ROAM_LAYERS }      = LayerManager;
const { ROAM_ASSETS,
        ROAM_ASSETS_HISTORY,
        ROAM_LOCATIONS,
        ROAM_GEOFENCES,
        ROAM_ASSETS_ANIMATION, } = ROAM_LAYERS;
const { PAUSE, STOP } = AnimationManager.ANIMATION_STATES;
const styler = Styler.getInstance();

const Controls = stampit()
  .props({

    /**
     *
     */
    controlsView: undefined,
    /**
     * Model
     */
    viewer      : undefined,
  })
  .methods({

    /**
     *
     * @param enabled
     */
    setProgressOverlayEnabled(enabled) {
      kendo.ui.progress(this.controlsView, enabled);
    },

    /**
     *
     */
    destroy() {
      const { controlsView } = this;

      if (controlsView) {
        kendo.destroy(controlsView);
        controlsView.empty();
      }

    },

  })
  .init(({ instance }) => {
    const { controlsView, viewer } = instance;

    /* region private properties */

    /*
     * Controller
     */
    let controller;

    /*
     *
     */
    let objectsLoadedActions                 = {};
    let objectAddedActions                   = {};
    let objectsVisibilityChangedActions      = {};
    let objectLabelsVisibilityChangedActions = {};

    /*
     *
     */
    let dropDownLists;
    let dateTimePickers;
    let goToIcon;
    let objectTrees;
    let objectEditors;
    let editModeActivators;
    let editableObjectNameTextboxes;
    let editableObjectConfigNameDropDowns;
    let confirmObjectCreationButtons;
    let cancelObjectCreationButtons;

    /*
     *
     */
    let autoRefreshCheckbox;
    let autoFocusCheckbox;
    let autoLabelingCheckbox;
    let saveViewportButton;
    let restoreViewportButton;

    /*
     *
     */
    let zoomToScaleDropDown;
    let zoomToLevelDropDown;

    //let zoomToRegionDropDown;
    //let saveRegionButton;

    /*
     *
     */
    let historyModeRadio;
    let presetIntervalsDropDown;
    let intervalSelectionFieldset;
    let fromDateTimePicker;
    let toDateTimePicker;
    let fetchPositionsButton;

    /*
     *
     */
    let positionList;
    let positionsVisibilityCheckbox;
    let positionTree;
    let positionCountBadge;
    let assetLabelsCheckbox;
    let useClustersCheckbox;
    let positionsConnectorCheckbox;
    let statusFiltersMultiSelect;
    let animationButton;

    /*
     *
     */
    let animationPanel;
    let animationCurrentStepText;
    let animationMaxStepText;
    let animationInfoText;
    let animationPauseButton;
    let animationStopButton;
    let animationPlayButton;
    let animationSlider;
    let animationSpeedDropDown;
    let trailLengthDropDown;

    /*
     *
     */
    let locationTree;
    let locationCountBadge;
    let locationLabelsCheckbox;
    let locationCoordinatesTextbox;
    let locationNameTextbox;
    let locationConfigNameDropDown;

    /*
     *
     */
    let geofenceTree;
    let geofenceCountBadge;
    let geofenceLabelsCheckbox;
    let geofenceShapeTypeButtons;
    let geofenceBufferDistanceTextboxes;
    let geofenceNameTextbox;
    let geofenceConfigNameDropDown;

    /* endregion private properties */

    /* region private methods */

    /**
     *
     */
    function setupMethodLookups() {
      const { onPositionsLoaded, onLocationsLoaded, onGeofencesLoaded,
              onLocationAdded, onGeofenceAdded,
              onPositionsVisibilityChanged,
              onLocationsVisibilityChanged,
              onGeofencesVisibilityChanged,
              onAssetLabelsVisibilityChanged,
              onLocationLabelsVisibilityChanged,
              onGeofenceLabelsVisibilityChanged, } = instance;

      objectsLoadedActions = {
        [ROAM_ASSETS]          : onPositionsLoaded,
        [ROAM_ASSETS_HISTORY]  : onPositionsLoaded,
        [ROAM_LOCATIONS]       : onLocationsLoaded,
        [ROAM_GEOFENCES]       : onGeofencesLoaded,
        [ROAM_ASSETS_ANIMATION]: _.noop,
      };

      objectAddedActions = {
        [ROAM_ASSETS]          : _.noop,
        [ROAM_ASSETS_HISTORY]  : _.noop,
        [ROAM_LOCATIONS]       : onLocationAdded,
        [ROAM_GEOFENCES]       : onGeofenceAdded,
        [ROAM_ASSETS_ANIMATION]: _.noop,
      };

      objectsVisibilityChangedActions = {
        [ROAM_ASSETS]          : onPositionsVisibilityChanged,
        [ROAM_ASSETS_HISTORY]  : onPositionsVisibilityChanged,
        [ROAM_LOCATIONS]       : onLocationsVisibilityChanged,
        [ROAM_GEOFENCES]       : onGeofencesVisibilityChanged,
        [ROAM_ASSETS_ANIMATION]: _.noop,
      };

      objectLabelsVisibilityChangedActions = {
        [ROAM_ASSETS]          : onAssetLabelsVisibilityChanged,
        [ROAM_ASSETS_HISTORY]  : onAssetLabelsVisibilityChanged,
        [ROAM_LOCATIONS]       : onLocationLabelsVisibilityChanged,
        [ROAM_GEOFENCES]       : onGeofenceLabelsVisibilityChanged,
        [ROAM_ASSETS_ANIMATION]: _.noop,
      };
    }

    /**
     *
     */
    function buildGeneralControls() {
      dropDownLists   = controlsView.find('select:not([multiple])');
      dateTimePickers = controlsView.find('.datetime-picker');
      objectTrees     = controlsView.find('.object-tree');

      objectEditors                     = controlsView.find('.object-editor');
      editModeActivators                = objectEditors.prev('.editmode-activator');
      editableObjectNameTextboxes       = objectEditors.find('.editableobject-objectname');
      editableObjectConfigNameDropDowns = objectEditors.find('.editableobject-configname');
      confirmObjectCreationButtons      = objectEditors.find('.confirm-object-creation');
      cancelObjectCreationButtons       = objectEditors.find('.cancel-object-creation');

      goToIcon = $('<span>')
        .addClass('mc-icon mc-icon-goto')
        .attr('title', App.translate('Go to this map object'));

      /* region Build Kendo controls */

      dropDownLists.kendoDropDownList({
        dataTextField : 'text',
        dataValueField: 'value',
      });

      dateTimePickers.kendoDateTimePicker({
        format: App.config.user.dateTimeFormat,
      });

      objectTrees.kendoTreeView({
        loadOnDemand: true,
        checkboxes  : {
          checkChildren: true,
        },
      });

      /* endregion Build Kendo controls */

      /* region Setup event listeners */

      goToIcon.on('click', (e) => {
        e.stopPropagation();

        const icon      = $(e.target);
        const layerName = icon.data('layerName');
        const id        = icon.data('id');

        controller.onObjectZoomingRequested(layerName, id);
      });

      objectTrees.on({
        mouseenter(e) {
          const item     = $(e.currentTarget);
          const dataItem = item.closest('.object-tree')
                               .data('kendoTreeView')
                               .dataItem(item);

          if (dataItem.leaf) {
            const { layerName, id } = dataItem;

            goToIcon
              .data({
                layerName,
                id,
              })

              /*
               * Append it to the container of
               * the tree item's text.
               */
              .appendTo(item.find('div > .k-in'));
          }

        },

        mouseleave() {
          goToIcon.detach();
        },

      }, '.k-item');

      _.forEach(objectTrees, (objectTree) => {
        const treeView  = $(objectTree);
        const kTreeView = treeView.data('kendoTreeView');

        kTreeView
          .bind('check', (e) => {
            const checkedItem = e.sender;
            const dataItem    = checkedItem.dataItem(e.node);
            const { layerName, objectIds, checked } = dataItem;

            controller.onObjectsVisibilityToggled(layerName, objectIds, checked);
          });

        if (treeView.hasClass('position-tree')) {
          kTreeView
            .bind('select', (e) => {
              const selectedItem = e.sender;
              controller.onPositionSelectionToggled(
                selectedItem.dataItem(e.node).id, true);
            });
        }

      });

      editModeActivators.on('click', (e) => {
        const activator    = $(e.currentTarget);
        const objectEditor = activator.next('.object-editor');
        const editManager  = viewer.getEditManager();

        controller.onEditableObjectTypeSelected(
          objectEditor.data('objecttype'));

        controller.onEditableObjectShapeTypeSelected(
          editManager.getEditableObjectShapeType());
      });

      editableObjectNameTextboxes.on('blur', (e) => {
        controller.onEditableObjectNameEntered($(e.target).val());
      });

      editableObjectConfigNameDropDowns.on('change', (e) => {
        controller.onEditableObjectConfigNameSelected($(e.target).val());
      });

      confirmObjectCreationButtons.on('click', () => {
        const editManager     = viewer.getEditManager();
        const targetLayerName = editManager.getTargetLayerName();

        if (editManager.isEditableObjectPropertiesValid()) {
          const editableObjectProperties = editManager
            .getSanitizedEditableObjectProperties();

          controller.onObjectCreationRequested(
            targetLayerName, editableObjectProperties);
        }

      });

      cancelObjectCreationButtons.on('click', () =>
        controller.onEditModeDeactivated());

      /* endregion Setup event listeners */
    }

    /**
     *
     */
    function buildMapViewPanelControls() {
      const viewBehaviorPanel = controlsView.find('.mc-panel-viewbehavior');
      const viewAreaPanel     = controlsView.find('.mc-panel-viewarea');

      autoRefreshCheckbox   = viewBehaviorPanel.find('[name="auto-refresh"]');
      autoFocusCheckbox     = viewBehaviorPanel.find('[name="auto-focus"]');
      autoLabelingCheckbox  = viewBehaviorPanel.find('[name="auto-labeling"]');
      saveViewportButton    = viewBehaviorPanel.find('[name="save-viewport"]');
      restoreViewportButton = viewBehaviorPanel.find('[name="restore-viewport"]');

      zoomToScaleDropDown = viewAreaPanel.find('[name="zoom-to-scale"]');
      zoomToLevelDropDown = viewAreaPanel.find('[name="zoom-to-level"]');

      /* region Reformat scales number */

      _.forEach(zoomToScaleDropDown.children('option'), (opt) => {
        const option      = $(opt);
        const scaleTextRe = /1 : (\d+)/i;

        if (option.text().match(scaleTextRe)) {
          const value     = _.parseInt(option.val());
          const scaleText = `1 : ${kendo.toString(value, 'n0')}`;

          option.text(scaleText);
        }

      });

      /*
       * Rebuild after reformat; Meh.
       */
      zoomToScaleDropDown.kendoDropDownList({
        dataTextField : 'text',
        dataValueField: 'value',
      });

      /* endregion Reformat scales number */

      /* region Setup event listeners */

      /* region View behavior */

      autoRefreshCheckbox.on('click', (e) => {
        controller.onAutoRefreshToggled($(e.target).is(':checked'));
      });

      autoFocusCheckbox.on('click', (e) => {
        controller.onAutoFocusToggled($(e.target).is(':checked'));
      });

      autoLabelingCheckbox.on('click', (e) => {
        controller.onAutoLabelingToggled($(e.target).is(':checked'));
      });

      saveViewportButton.on('click', () =>
        controller.onViewportSaved(viewer.getBoundingBox()));

      restoreViewportButton.on('click', () =>
        controller.onViewportRestored(localStorage.getItem('USER_BBOX')));

      /* endregion View behavior */

      /* region View area */

      zoomToScaleDropDown.on('change', (e) => {
        controller.onScaleZoomingSelected($(e.target).val());
      });

      zoomToLevelDropDown.on('change', (e) => {
        controller.onLevelZoomingSelected($(e.target).val());
      });

      /* endregion View area */

      /* endregion Setup event listeners */
    }

    /**
     *
     */
    function buildIntervalsPanelControls() {
      const intervalsPanel = controlsView.find('.mc-panel-intervals');

      historyModeRadio          = intervalsPanel.find('[name="history-mode"]');
      presetIntervalsDropDown   = intervalsPanel.find('[name="preset-intervals"]');
      intervalSelectionFieldset = intervalsPanel.find('[name="interval-selection"]');
      fromDateTimePicker        = intervalsPanel.find('[name="datetime-from"]');
      toDateTimePicker          = intervalsPanel.find('[name="datetime-to"]');
      fetchPositionsButton      = intervalsPanel.find('[name="fetch-positions"]');

      /* region Setup event listeners */

      historyModeRadio.on('click', (e) => {
        const historyMode = $(e.target).val();
        const latest      = (historyMode === 'CURRENT');

        controller.onDataSelectionOptionsUpdated({ latest });
      });

      const kFromDateTimePicker = fromDateTimePicker.data('kendoDateTimePicker');
      const kToDateTimePicker   = toDateTimePicker.data('kendoDateTimePicker');

      presetIntervalsDropDown.on('change', (e) => {
        const presetInterval = $(e.target).val();

        if (presetInterval && (presetInterval !== '-')) {
          const { min, max } = viewer.selectIntervalRange(presetInterval);

          controller.onDataSelectionOptionsUpdated({
            from: min,
            to  : max,
          });
        }

      });

      kFromDateTimePicker
        .bind('change', (e) => {

          /*
           * Pick the value; fallback to max if from > to.
           */
          const picker = e.sender;
          const from   = picker.value() || picker.max();
          controller.onDataSelectionOptionsUpdated({ from });
        });

      kToDateTimePicker
        .bind('change', (e) => {

          /*
           * Pick the value; fallback to min if to < from.
           */
          const picker = e.sender;
          const to     = picker.value() || picker.min();

          controller.onDataSelectionOptionsUpdated({ to });
        });

      fetchPositionsButton.on('click', () => {
        instance.onPositionsFetchingRequested();
      });

      /* endregion Setup event listeners */
    }

    /**
     *
     */
    function buildNavigationPanelControls() {
      const navigationPanel = controlsView.find('.mc-panel-navigation');

      positionList                = navigationPanel.find('.position-list');
      positionsVisibilityCheckbox = navigationPanel.find('[name="positions-visibility"]');
      positionTree                = navigationPanel.find('.position-tree');
      positionCountBadge          = navigationPanel.find('.position-count');
      assetLabelsCheckbox         = navigationPanel.find('[name="asset-labels"]');
      useClustersCheckbox         = navigationPanel.find('[name="use-clusters"]');
      positionsConnectorCheckbox  = navigationPanel.find('[name="positions-connector"]');
      statusFiltersMultiSelect    = navigationPanel.find('[name="status-filters"]');
      animationButton             = navigationPanel.find('[name="animation"]');

      /* region Setup event listeners */

      positionList.on({
        click(e) {
          const item = $(e.currentTarget);

          item.toggleClass('active');

          controller.onPositionSelectionToggled(
            item.data('id'), item.is('.active'));
        },

        mouseenter(e) {
          const item = $(e.currentTarget);

          goToIcon
            .data({
              layerName: item.data('layerName'),
              id       : item.data('id'),
            })
            .appendTo(item);
        },

        mouseleave() {
          goToIcon.detach();
        },

      }, '.list-group-item');

      const layerManager = viewer.getLayerManager();

      positionsVisibilityCheckbox.on('click', (e) => {
        const positionLayerName = layerManager.getPositionLayerName();
        const objectIds         = _.map(
          layerManager.getObjectsByLayer(positionLayerName),
          'roamObject.domainObjectTypeId');

        controller.onObjectsVisibilityToggled(
          positionLayerName, objectIds, $(e.target).is(':checked'));
      });

      assetLabelsCheckbox.on('click', (e) => {
        controller.onObjectLabelsVisibilityToggled(
          layerManager.getPositionLayerName(), $(e.target).is(':checked'));
      });

      useClustersCheckbox.on('click', (e) => {
        controller.onUseClustersStatusToggled($(e.target).is(':checked'));
      });

      positionsConnectorCheckbox.on('click', (e) => {
        controller.onConnectHistoryPositionsStatusToggled($(e.target).is(':checked'));
      });

      statusFiltersMultiSelect
        .kendoMultiSelect()
        .data('kendoMultiSelect')
        .bind('change', (e) => {
          controller.onAssetStatusFiltersChanged(e.sender.value());
        });

      animationButton.on('click', () =>
        controller.onAnimationPositionsLoadingRequested());

      /* endregion Setup event listeners */
    }

    /**
     *
     */
    function buildAnimationPanelControls() {
      animationPanel           = controlsView.find('.mc-panel-animation');
      animationCurrentStepText = animationPanel.find('.step-current');
      animationMaxStepText     = animationPanel.find('.step-max');
      animationInfoText        = animationPanel.find('.animation-info');
      animationPauseButton     = animationPanel.find('[name="animation-pause"]');
      animationStopButton      = animationPanel.find('[name="animation-stop"]');
      animationPlayButton      = animationPanel.find('[name="animation-play"]');
      animationSlider          = animationPanel.find('[name="animation-slider"]');
      animationSpeedDropDown   = animationPanel.find('[name="animation-speed"]');
      trailLengthDropDown      = animationPanel.find('[name="trail-length"]');

      /* region Build Kendo controls */

      rebuildAnimationSlider();

      /* endregion Build Kendo controls */

      /* region Setup event listeners */

      animationPauseButton.on('click', () => controller.onAnimationPaused());

      animationStopButton.on('click', () => controller.onAnimationStopped());

      animationPlayButton.on('click', () => controller.onAnimationStarted());

      animationSpeedDropDown.on('change', (e) => {
        controller.onAnimationSpeedSelected($(e.target).val());
      });

      trailLengthDropDown.on('change', (e) => {
        controller.onAnimationTrailLengthSelected($(e.target).val());
      });

      /* endregion Setup event listeners */
    }

    /**
     *
     */
    function buildLocationsPanelControls() {
      const locationsPanel = controlsView.find('.mc-panel-locations');

      locationTree               = locationsPanel.find('.location-tree');
      locationCountBadge         = locationsPanel.find('.location-count');
      locationLabelsCheckbox     = locationsPanel.find('[name="location-labels"]');
      locationCoordinatesTextbox = locationsPanel.find('[name="location-coordinates"]');
      locationNameTextbox        = locationsPanel.find('[name="location-objectname"]');
      locationConfigNameDropDown = locationsPanel.find('[name="location-configname"]');

      /* region Setup event listeners */

      locationLabelsCheckbox.on('click', (e) => {
        controller.onObjectLabelsVisibilityToggled(
          ROAM_LOCATIONS, $(e.target).is(':checked'));
      });

      locationCoordinatesTextbox.on('blur', (e) => {
        controller.onEditableObjectLatLngEntered($(e.target).val());
      });

      /* endregion Setup event listeners */
    }

    /**
     *
     */
    function buildGeofencesPanelControls() {
      const geofencesPanel = controlsView.find('.mc-panel-geofences');

      geofenceTree                    = geofencesPanel.find('.geofence-tree');
      geofenceCountBadge              = geofencesPanel.find('.geofence-count');
      geofenceLabelsCheckbox          = geofencesPanel.find('[name="geofence-labels"]');
      geofenceShapeTypeButtons        = geofencesPanel.find('[name="geofence-shapetype"]');
      geofenceBufferDistanceTextboxes = geofencesPanel.find('[name="geofence-bufferdistance"]');
      geofenceNameTextbox             = geofencesPanel.find('[name="geofence-objectname"]');
      geofenceConfigNameDropDown      = geofencesPanel.find('[name="geofence-configname"]');

      /* region Setup event listeners */

      geofenceLabelsCheckbox.on('click', (e) => {
        controller.onObjectLabelsVisibilityToggled(
          ROAM_GEOFENCES, $(e.target).is(':checked'));
      });

      geofenceShapeTypeButtons.on('click', (e) => {
        const shapeType         = $(e.currentTarget).data('shapetype');
        const selectedShapeType = viewer.getEditManager().getEditableObjectShapeType();

        if (shapeType !== selectedShapeType) {
          controller.onEditableObjectShapeTypeSelected(shapeType);
        }

      });

      geofenceBufferDistanceTextboxes.on('blur', (e) => {
        controller.onEditableObjectBufferDistanceEntered($(e.target).val());
      });

      /* endregion Setup event listeners */
    }

    /**
     *
     * @param fieldsetSelector
     * @param enabled
     */
    function setFieldsetEnabled(fieldsetSelector, enabled) {
      const fieldset = controlsView.find(fieldsetSelector);

      fieldset
        .prop('disabled', !enabled)
        .find('input, select, button, fieldset')
        .prop('disabled', !enabled);

      _(fieldset.find('input.datetime-picker'))
        .map(dateTimePicker => $(dateTimePicker).data('kendoDateTimePicker'))
        .compact()
        .forEach(kDateTimePicker => kDateTimePicker.enable(enabled));

      _(fieldset.find('select:not([multiple])'))
        .map(dropDownList => $(dropDownList).data('kendoDropDownList'))
        .compact()
        .forEach(kDropDownList => kDropDownList.enable(enabled));
    }

    /**
     *
     * @param buttonsState
     */
    function setAnimationButtonsEnabled(buttonsState) {
      animationPauseButton.prop('disabled', !buttonsState.pause);
      animationStopButton.prop('disabled', !buttonsState.stop);
      animationPlayButton.prop('disabled', !buttonsState.play);
    }

    /**
     *
     */
    function rebuildAnimationSlider() {
      let kAnimationSlider = animationSlider.data('kendoSlider');

      if (kAnimationSlider) {
        const animationSliderContainer = animationSlider
          .closest('.animation-slider-container');

        /**
         * Destroy Kendo widgets manually.
         * Point 3) is our case, since we'd like to change
         * the maximum value of the slider.
         * @see http://docs.telerik.com/kendo-ui/framework/widgets/destroy
         */
        kAnimationSlider.destroy();
        animationSliderContainer.empty();

        animationSlider = $('<input>')
          .attr('name', 'animation-slider')
          .appendTo(animationSliderContainer);
      }

      const maxStep = viewer.getAnimationManager().getMaxStep();
      const ready   = (maxStep > 0);

      kAnimationSlider = animationSlider
        .kendoSlider({
          //showButtons  : false,
          tickPlacement: 'none',
          max          : maxStep,
        })
        .data('kendoSlider');

      if (ready) {
        kAnimationSlider
          .bind('change', (e) => {
            const step = e.value;

            controller.onAnimationPaused();
            controller.onAnimationStepSelected(step);
          });
      }

      kAnimationSlider.enable(ready);
    }

    /**
     *
     * @param objectTypeName
     * @param objects
     * @returns {Array}
     */
    function createTreeViewDataSource(objectTypeName, objects) {
      const layerName = ROAM_LAYERS[`ROAM_${objectTypeName.toUpperCase()}`];
      const data      = [];
      const root      = {
        layerName,
        root     : true,
        id       : objectTypeName.toLowerCase(),
        text     : App.translate(objectTypeName),
        items    : [],
        objectIds: [],
        expanded : true,
      };

      const configurationFilterEnabled =
              viewer.testIsAssetConfigurationFilterEnabled(layerName);
      const configurations             = {};
      const categories                 = {};

      _.forEach(objects, (o) => {

        /*
         * Leaf nodes
         */
        const { domainObjectTypeId, asset, name } = o;
        const leaf = {
          layerName,
          leaf     : true,
          id       : domainObjectTypeId,
          text     : asset ? asset.name : name,
          objectIds: [domainObjectTypeId],
        };

        if (layerName === ROAM_ASSETS_HISTORY) {
          leaf.text = `${asset.name} ${name}`;
        }

        /*
         * Category nodes
         */
        const { locationType, fenceType, assetCategory } = o;
        const categoryName = locationType || fenceType || assetCategory || 'Unknown';
        let category       = categories[categoryName];

        if (!category) {
          category = categories[categoryName] = {};

          _.assign(category, {
            layerName,
            category : true,
            name     : App.translate(categoryName),
            id       : categoryName.toLowerCase(),
            imageUrl : styler.getObjectCategoryIcon(o),
            items    : [],
            objectIds: [],
          });
        }

        const categoryItems = category.items;

        categoryItems.push(leaf);
        category.objectIds.push(leaf.id);
        category.text = `${category.name} (${categoryItems.length})`;

        /*
         * Configuration nodes
         */
        if (configurationFilterEnabled) {
          const configName = o.configurationName || 'Unknown';
          let config       = configurations[configName];

          if (!config) {
            config = configurations[configName] = {};

            _.assign(config, {
              layerName,
              configuration: true,
              name         : App.translate(configName),
              items        : [],
              objectIds    : [],
            });
          }

          const configItems = config.items;

          if (!_.find(configItems, { id: category.id })) {
            configItems.push(category);
            config.text = `${config.name} (${configItems.length})`;
          }

          config.objectIds.push(leaf.id);
        }

      });

      const rootItems = !_.isEmpty(configurations) ?
                        configurations : categories;

      root.items = _(rootItems)
        .map()
        .compact()
        .forEach((rootItem) => {
          root.objectIds = [...root.objectIds, ...rootItem.objectIds];
        });

      data.push(root);

      return data;
    }

    /**
     *
     * @param options
     */
    function rebuildTreeView(options) {
      const { objectTree, objectTypeName, objects, countBadge } = options;
      const kObjectTree = objectTree.data('kendoTreeView');

      if (kObjectTree) {
        const dataSource = new kendo.data.HierarchicalDataSource({
          data: createTreeViewDataSource(objectTypeName, objects),
        });

        kObjectTree.setDataSource(dataSource);
      }

      countBadge.text(objects.length);
    }

    /**
     *
     * @param options
     */
    function addTreeViewItem(options) {
      const { layerName } = options;

      /*
       * We don't currently support creating (adding) asset
       * position, the below mechanism applies only for adding
       * a location or geofence object.
       */
      if (!viewer.getLayerManager().testIsPositionLayerName(layerName)) {
        const { objectTree, object, countBadge } = options;
        const kTreeView    = objectTree.data('kendoTreeView');
        const { locationType, fenceType } = object;
        const categoryName = locationType || fenceType;

        if (kTreeView) {
          const { dataSource }   = kTreeView;
          let category = dataSource.get(categoryName.toLowerCase());
          let categoryNode;

          if (category) {
            categoryNode = kTreeView.findByUid(category.uid);
          } else {
            categoryNode = kTreeView.append({
              layerName,
              category : true,
              name     : categoryName,
              id       : categoryName.toLowerCase(),
              imageUrl : styler.getObjectCategoryIcon(object),
              items    : [],
              objectIds: [],
            }, objectTree.find('.k-item:first'));

            category = kTreeView.dataItem(categoryNode);
          }

          /**
           * Make sure the child nodes loaded.
           * @see http://docs.telerik.com/kendo-ui/api/javascript/data/node#methods-loaded
           * @see http://docs.telerik.com/kendo-ui/api/javascript/data/node#methods-load
           */
          if (!category.loaded()) {
            category.load();
          }

          const categoryItems = category.items;
          const { domainObjectTypeId, name } = object;

          if (!_.find(categoryItems, { id: domainObjectTypeId })) {
            const root     = dataSource.at(0);
            const itemNode = kTreeView.append({
              layerName,
              leaf     : true,
              id       : domainObjectTypeId,
              text     : name,
              objectIds: [domainObjectTypeId],
            }, categoryNode);

            root.objectIds.push(domainObjectTypeId);
            category.objectIds.push(domainObjectTypeId);

            kTreeView.expandTo(itemNode);
            kTreeView.select(itemNode);

            kTreeView.text(categoryNode,
              `${categoryName} (${categoryItems.length})`);

            countBadge.text(_.parseInt(countBadge.text()) + 1);
          }
        }
      }
    }

    /**
     *
     * @param options
     */
    function handleTreeObjectsVisibilityChanged(options) {
      const { objectIds, visibility, objectTree } = options;

      if (!_.isEmpty(objectIds)) {
        const kTreeView = objectTree.data('kendoTreeView');

        if (kTreeView) {
          const root = kTreeView.dataSource.at(0);

          /**
           * REVIEW: Is there a better way to do this?
           * Item nodes need to be loaded if asset status
           * filters feature is enabled (applied for position
           * "assetmessageevent" layer only).
           */
          const forceItemNodesLoadingEnabled =
                  (viewer.isAssetStatusFiltersEnabled() &&
                   viewer.getLayerManager().testIsPositionLayerName(root.layerName));

          /*
           * Programmatically (recursively) update the checked
           * state of the nodes.
           */
          function updateCheckedState(item) {

            if (_.isEmpty(_.difference(item.objectIds, objectIds))) {
              item.set('checked', visibility);

              return;
            }

            if (forceItemNodesLoadingEnabled && !item.loaded()) {
              item.load();
            }

            const children = item.items;

            if (_.isEmpty(children)) {
              return;
            }

            _.forEach(children, child => updateCheckedState(child));
          }

          updateCheckedState(root);

          /**
           * REVIEW: May not needed anymore.
           * When the checkbox is programmatically checked
           * through code, e.g. (in our case) when zooming
           * to object, there is a need to update indeterminate
           * state of its parents.
           * @see http://docs.telerik.com/kendo-ui/api/javascript/ui/treeview#methods-updateIndeterminate
           */

          //kTreeView.updateIndeterminate();
        }
      }
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
       * @param listener
       */
      setListener(listener) {
        instance.setController(listener);
      },

      /**
       *
       * @param max
       */
      setDateTimePickerMaxDate(max) {

        _(dateTimePickers)
          .map(dateTimePicker => $(dateTimePicker).data('kendoDateTimePicker'))
          .compact()
          .forEach(kDateTimePicker => kDateTimePicker.max(max));
      },

      /**
       *
       * @param hidden
       */
      setAutoLabelingCheckboxHidden(hidden) {
        autoLabelingCheckbox
          .closest('.checkbox')
          .toggleClass('hidden', hidden);
      },

      /**
       *
       * @param enabled
       */
      setUseClustersCheckboxEnabled(enabled) {
        useClustersCheckbox
          .prop('disabled', !enabled)
          .closest('.checkbox')
          .toggleClass('disabled', !enabled);
      },

      /**
       *
       * @param visible
       */
      setAssetStatusFiltersVisible(visible) {
        statusFiltersMultiSelect
          .closest('.status-filters-container')
          .toggleClass('hidden', !visible);
      },

      /**
       *
       * @param filtersValues
       */
      setAssetStatusFiltersValues(filtersValues) {
        const kStatusFiltersMultiSelect =
                statusFiltersMultiSelect.data('kendoMultiSelect');

        if (kStatusFiltersMultiSelect) {
          kStatusFiltersMultiSelect.setDataSource(new kendo.data.DataSource({
            data: _.compact(filtersValues),
          }));
        }
      },

      /**
       *
       * @param locationConfigNames
       */
      setLocationConfigNames(locationConfigNames) {
        const klocationConfigNameDropDown =
                locationConfigNameDropDown.data('kendoDropDownList');

        if (klocationConfigNameDropDown) {
          klocationConfigNameDropDown.setDataSource(new kendo.data.DataSource({
            data: locationConfigNames,
          }));
        }

      },

      /**
       *
       * @param layerName
       * @param objects
       */
      onObjectsLoaded(layerName, objects) {
        const objectsLoadedAction = objectsLoadedActions[layerName];

        if (!_.isFunction(objectsLoadedAction)) {
          throw new Error(`Invalid layer name: ${layerName}.`);
        }

        objectsLoadedAction(objects);
      },

      /**
       *
       * @param positions
       */
      onPositionsLoaded(positions) {
        const positionLayerName          = viewer.getLayerManager().getPositionLayerName();
        const assetCategoryFilterEnabled = viewer.isAssetCategoryFilterEnabled();

        positionTree
          .parent()
          .toggleClass('hidden', !assetCategoryFilterEnabled);

        positionList
          .parent()
          .toggleClass('hidden', assetCategoryFilterEnabled);

        positionsVisibilityCheckbox
          .closest('.checkbox')
          .toggleClass('hidden', assetCategoryFilterEnabled);

        if (assetCategoryFilterEnabled) {
          rebuildTreeView({
            objectTypeName: 'Assets',
            objects       : positions,
            objectTree    : positionTree,
            countBadge    : positionCountBadge,
          });
        } else {
          positionList.empty();

          _.forEach(positions, (position) => {
            const { asset, eventTime, name, domainObjectTypeId } = position;
            let itemText = asset.name;

            if (eventTime) {
              position.formattedEventTime =
                App.util.format.dateTime(eventTime);
            }

            if (positionLayerName === ROAM_ASSETS_HISTORY) {
              itemText = `${position.formattedEventTime} ${name}`;
            }

            const positionItem = $('<a>')
              .addClass('list-group-item')
              .text(itemText)
              .data({
                layerName: positionLayerName,
                id       : domainObjectTypeId,
              });

            positionList.append(positionItem);
          });
        }

        positionCountBadge.text(positions.length);
      },

      /**
       *
       * @param locations
       */
      onLocationsLoaded(locations) {
        rebuildTreeView({
          objectTypeName: 'Locations',
          objects       : locations,
          objectTree    : locationTree,
          countBadge    : locationCountBadge,
        });
      },

      /**
       *
       * @param geofences
       */
      onGeofencesLoaded(geofences) {
        rebuildTreeView({
          objectTypeName: 'Geofences',
          objects       : geofences,
          objectTree    : geofenceTree,
          countBadge    : geofenceCountBadge,
        });
      },

      /**
       *
       * @param layerName
       * @param object
       */
      onObjectAdded(layerName, object) {
        const objectAddedAction = objectAddedActions[layerName];

        if (!_.isFunction(objectAddedAction)) {
          throw new Error(`Invalid layer name: ${layerName}.`);
        }

        objectAddedAction(object);
      },

      /**
       *
       * @param location
       */
      onLocationAdded(location) {
        addTreeViewItem({
          layerName : ROAM_LOCATIONS,
          object    : location,
          objectTree: locationTree,
          countBadge: locationCountBadge,
        });
      },

      /**
       *
       * @param geofence
       */
      onGeofenceAdded(geofence) {
        addTreeViewItem({
          layerName : ROAM_GEOFENCES,
          object    : geofence,
          objectTree: geofenceTree,
          countBadge: geofenceCountBadge,
        });
      },

      /**
       *
       * @param layerName
       * @param object
       */
      onObjectRemoved(layerName, object) {
        _.noop();
      },

      /**
       *
       * @param location
       */
      onLocationRemoved(location) {
        //console.log('location removed');
      },

      /**
       *
       * @param geofence
       */
      onGeofenceRemoved(geofence) {
        //console.log('geofence removed');
      },

      /**
       *
       * @param enabled
       */
      onSingleAssetModeStatusChanged(enabled) {
        assetLabelsCheckbox
          .prop('disabled', enabled)
          .closest('.checkbox')
          .toggleClass('disabled', enabled);

        positionsConnectorCheckbox
          .prop('disabled', !enabled)
          .closest('.checkbox')
          .toggleClass('disabled', !enabled);

        animationButton.prop('disabled', !enabled);

        const navigationText = enabled ? 'Asset Positions' : 'Assets';
        controlsView
          .find('[data-phrase="Navigation"]')
          .text(App.translate(navigationText));

        instance.setAssetStatusFiltersVisible(
          viewer.isAssetStatusFiltersEnabled() && !enabled);
      },

      /**
       *
       * @param activated
       */
      onAutoRefreshChanged(activated) {
        autoRefreshCheckbox.prop('checked', activated);
      },

      /**
       *
       */
      onPositionsFetchingRequested(polling) {
        const positionLayerName = viewer.getLayerManager().getPositionLayerName();

        controller.onPositionsFetchingRequested(positionLayerName, polling);
      },

      /**
       *
       * @param activated
       */
      onAutoFocusChanged(activated) {
        autoFocusCheckbox.prop('checked', activated);
      },

      /**
       *
       * @param activated
       */
      onAutoLabelingStatusChanged(activated) {
        autoLabelingCheckbox.prop('checked', activated);
      },

      /**
       *
       * @param options
       */
      onDataSelectionOptionsChanged(options) {
        const { latest, from, to } = options;
        const historyMode = latest ? 'CURRENT' : 'INTERVAL';

        historyModeRadio
          .filter(`[value=${historyMode}]`)
          .prop('checked', true);

        setFieldsetEnabled(intervalSelectionFieldset, !latest);

        intervalSelectionFieldset
          .parent('.panel')
          .toggleClass('hidden', latest);

        const kFromDateTimePicker = fromDateTimePicker.data('kendoDateTimePicker');
        const kToDateTimePicker   = toDateTimePicker.data('kendoDateTimePicker');

        if (kFromDateTimePicker && kToDateTimePicker) {
          kFromDateTimePicker.max(to);
          kFromDateTimePicker.value(from);
          kToDateTimePicker.min(from);
          kToDateTimePicker.value(to);
        }

        const presetInterval = viewer
          .selectPresetInterval({ min: from, max: to });

        const kPresetIntervalsDropDown = presetIntervalsDropDown
          .data('kendoDropDownList');

        if (kPresetIntervalsDropDown) {
          kPresetIntervalsDropDown.value(presetInterval);
        }
      },

      /**
       *
       * @param layerName
       * @param objectIds
       * @param visibility
       */
      onObjectsVisibilityChanged(layerName, objectIds, visibility) {
        const objectsVisibilityChangedAction =
                objectsVisibilityChangedActions[layerName];

        if (!_.isFunction(objectsVisibilityChangedAction)) {
          throw new Error(`Invalid layer name: ${layerName}.`);
        }

        objectsVisibilityChangedAction(objectIds, visibility);
      },

      /**
       *
       * @param objectIds
       * @param visibility
       */
      onPositionsVisibilityChanged(objectIds, visibility) {
        const assetCategoryFilterEnabled = viewer.isAssetCategoryFilterEnabled();

        if (assetCategoryFilterEnabled) {
          handleTreeObjectsVisibilityChanged({
            objectIds,
            visibility,
            objectTree: positionTree,
          });
        } else {
          positionsVisibilityCheckbox.prop('checked', visibility);
        }

      },

      /**
       *
       * @param objectIds
       * @param visibility
       */
      onLocationsVisibilityChanged(objectIds, visibility) {
        handleTreeObjectsVisibilityChanged({
          objectIds,
          visibility,
          objectTree: locationTree,
        });
      },

      /**
       *
       * @param objectIds
       * @param visibility
       */
      onGeofencesVisibilityChanged(objectIds, visibility) {
        handleTreeObjectsVisibilityChanged({
          objectIds,
          visibility,
          objectTree: geofenceTree,
        });
      },

      /**
       *
       * @param layerName
       * @param visibility
       */
      onObjectLabelsVisibilityChanged(layerName, visibility) {
        const objectLabelsVisibilityChangedAction =
                objectLabelsVisibilityChangedActions[layerName];

        if (!_.isFunction(objectLabelsVisibilityChangedAction)) {
          throw new Error(`Invalid layer name: ${layerName}.`);
        }

        objectLabelsVisibilityChangedAction(visibility);
      },

      /**
       *
       * @param visibility
       */
      onAssetLabelsVisibilityChanged(visibility) {

        if (!assetLabelsCheckbox.prop('disabled')) {
          assetLabelsCheckbox.prop('checked', visibility);
        }

      },

      /**
       *
       * @param visibility
       */
      onLocationLabelsVisibilityChanged(visibility) {

        if (!locationLabelsCheckbox.prop('disabled')) {
          locationLabelsCheckbox.prop('checked', visibility);
        }

      },

      /**
       *
       * @param visibility
       */
      onGeofenceLabelsVisibilityChanged(visibility) {

        if (!geofenceLabelsCheckbox.prop('disabled')) {
          geofenceLabelsCheckbox.prop('checked', visibility);
        }

      },

      /**
       *
       * @param objectId
       * @param highlighted
       */
      onPositionHighlightChanged(objectId, highlighted) {

        if (objectId) {
          const assetCategoryFilterEnabled = viewer.isAssetCategoryFilterEnabled();

          if (assetCategoryFilterEnabled) {
            const kTreeView   = positionTree.data('kendoTreeView');
            const selectedUid = kTreeView.dataSource.get(objectId).uid;

            kTreeView.select(kTreeView.findByUid(selectedUid));
          } else {
            const targetItem = $(_.find(
              positionList.children('.list-group-item'),
              listItem => ($(listItem).data('id') === objectId))
            );

            targetItem.toggleClass('active', highlighted);
          }
        }

      },

      /**
       *
       * @param activated
       */
      onUseClustersStatusChanged(activated) {

        if (!useClustersCheckbox.prop('disabled')) {
          useClustersCheckbox.prop('checked', activated);
        }

      },

      /**
       *
       * @param activated
       */
      onConnecinstancetoryPositionsStatusChanged(activated) {

        if (!positionsConnectorCheckbox.prop('disabled')) {
          positionsConnectorCheckbox.prop('checked', activated);
        }

      },

      /**
       *
       * @param filters
       */
      onAssetStatusFiltersChanged(filters) {
        const kStatusFiltersMultiSelect =
                statusFiltersMultiSelect.data('kendoMultiSelect');

        if (kStatusFiltersMultiSelect) {
          kStatusFiltersMultiSelect.value(filters);
        }
      },

      /**
       *
       * @param activated
       */
      onAnimationFeatureStatusChanged(activated) {

        if (animationPanel) {
          animationPanel
            .fadeIn(1000)
            .toggleClass('hidden', !activated);
        }
      },

      /**
       *
       * @param currentStep
       */
      onAnimationCurrentStepChanged(currentStep) {
        animationCurrentStepText.text(currentStep);
        animationSlider
          .data('kendoSlider')
          .value(currentStep);
      },

      /**
       *
       * @param maxStep
       */
      onAnimationMaxStepChanged(maxStep) {
        animationMaxStepText.text(maxStep);
        rebuildAnimationSlider();
      },

      /**
       *
       * @param animationInfo
       */
      onAnimationInfoChanged(animationInfo) {
        animationInfoText.text(animationInfo);
      },

      /**
       *
       * @param animationSpeed
       */
      onAnimationSpeedChanged(animationSpeed) {
        animationSpeedDropDown
          .data('kendoDropDownList')
          .value(animationSpeed);
      },

      /**
       *
       * @param trailLength
       */
      onAnimationTrailLengthChanged(trailLength) {
        trailLengthDropDown
          .data('kendoDropDownList')
          .value(trailLength);
      },

      /**
       *
       * @param animationState
       */
      onAnimationStateChanged(animationState) {

        if (animationState === PAUSE) {
          setAnimationButtonsEnabled({
            pause: false,
            stop : true,
            play : true,
          });
        } else if (animationState === STOP) {
          setAnimationButtonsEnabled({
            pause: false,
            stop : false,
            play : true,
          });
        } else {
          setAnimationButtonsEnabled({
            pause: true,
            stop : true,
            play : false,
          });
        }

      },

      /**
       *
       * @param objectType
       */
      onEditableObjectTypeChanged(objectType) {

        _.forEach(objectEditors, (oEditor) => {
          const objectEditor = $(oEditor);

          const editModeActivator = objectEditor.prev('.editmode-activator');
          const editorFieldset    = objectEditor.find('.editor-fieldset');
          const editModeActivated = (objectEditor.data('objecttype') === objectType);

          editModeActivator.toggleClass('hidden', editModeActivated);
          objectEditor.toggleClass('hidden', !editModeActivated);
          setFieldsetEnabled(editorFieldset, editModeActivated);

          if (!editModeActivated) {
            objectEditor
              .find('.form-group')
              .toggleClass('has-error', false);

            objectEditor
              .find('.invalid-block')
              .toggleClass('hidden', true);
          }
        });
      },

      /**
       *
       * @param shapeType
       */
      onEditableObjectShapeTypeChanged(shapeType) {
        const objectType             = viewer.getEditManager().getEditableObjectType();
        const objectEditor           = objectEditors.filter(`[data-objecttype="${objectType}"]`);
        const shapeTypeButtons       = objectEditor.find('.editableobject-shapetype');
        const shapeParameterFieldset = objectEditor.find('.shapeparameter-fieldset');

        _.forEach(shapeTypeButtons,
          (btn) => {
            const button = $(btn);

            const active = (button.data('shapetype') === shapeType);
            button.toggleClass('active', active);
          });

        _.forEach(shapeParameterFieldset.children('.form-group'),
          (frmGroup) => {
            const formGroup = $(frmGroup);

            const shown = (formGroup.data('shapetype') === shapeType);
            formGroup.toggleClass('hidden', !shown);
          });
      },

      /**
       *
       * @param lat
       * @param lng
       */
      onEditableObjectLatLngChanged(lat, lng) {
        locationCoordinatesTextbox.val(`${lat}, ${lng}`);
      },

      /**
       *
       * @param coordinates
       */
      onEditableObjectCoordinatesChanged(coordinates) {
        const objectType         = viewer.getEditManager().getEditableObjectType();
        const objectEditor       = objectEditors.filter(`[data-objecttype="${objectType}"]`);
        const coordinatesTextbox = objectEditor.find('.editableobject-coordinates');

        // Default value of coordinates property.
        coordinatesTextbox.val('');

        if (!_.isEmpty(coordinates)) {
          const coordinatesValid = _.every(coordinates, _.isFinite);

          if (coordinatesValid) {
            coordinatesTextbox.val(coordinates.join(', '));
          }
        }
      },

      /**
       *
       * @param bufferDistance
       */
      onEditableObjectBufferDistanceChanged(bufferDistance) {
        const objectType            = viewer.getEditManager().getEditableObjectType();
        const objectEditor          = objectEditors.filter(`[data-objecttype="${objectType}"]`);
        const bufferDistanceTextbox = objectEditor.find('.editableobject-bufferdistance');

        bufferDistanceTextbox.val(_.round(bufferDistance));
      },

      /**
       *
       * @param objectName
       */
      onEditableObjectNameChanged(objectName) {
        const objectType        = viewer.getEditManager().getEditableObjectType();
        const objectEditor      = objectEditors.filter(`[data-objecttype="${objectType}"]`);
        const objectNameTextbox = objectEditor.find('.editableobject-objectname');

        objectNameTextbox.val(objectName);
      },

      /**
       *
       * @param configName
       */
      onEditableObjectConfigNameChanged(configName) {
        const objectType         = viewer.getEditManager().getEditableObjectType();
        const objectEditor       = objectEditors.filter(`[data-objecttype="${objectType}"]`);
        const configNameDropDown = objectEditor.find('select.editableobject-configname');

        configNameDropDown
          .data('kendoDropDownList')
          .value(configName);
      },

      /**
       *
       * @param propertyName
       * @param validity
       */
      onEditableObjectPropertyValidityChanged(propertyName, validity) {
        const objectType   = viewer.getEditManager().getEditableObjectType();
        const objectEditor = objectEditors.filter(`[data-objecttype="${objectType}"]`);

        const propName = propertyName.toLowerCase();

        const editableObjectFormGroup =
                objectEditor
                  .find('.form-group:visible')
                  .has(`.editableobject-${propName}`);

        const editableObjectInvalidBlock =
                editableObjectFormGroup.find(`.invalid-${propName}`);

        const { valid, invalidText }  = validity;

        editableObjectFormGroup.toggleClass('has-error', !valid);
        editableObjectInvalidBlock.toggleClass('hidden', valid);

        if (invalidText) {
          editableObjectInvalidBlock
            .find('.invalid-text')
            .text(invalidText);
        }
      },
    });

    /* endregion privileged methods */

    /* region init code */

    controlsView.html(viewTemplate);
    App.i18n.translateContent(controlsView);

    setupMethodLookups();

    buildGeneralControls();
    buildMapViewPanelControls();
    buildIntervalsPanelControls();
    buildNavigationPanelControls();
    buildAnimationPanelControls();
    buildLocationsPanelControls();
    buildGeofencesPanelControls();

    setFieldsetEnabled('fieldset:disabled', false);

    /* endregion init code */
  });

export { Controls as default, Controls };
