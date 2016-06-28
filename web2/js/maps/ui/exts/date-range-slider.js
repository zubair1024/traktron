/**
 * Created by Glenn on 2015-04-27.
 */

import App from 'app';

const { config, util } = App;

const DateRangeSlider = stampit()
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
    let sliderHook;
    let latestEventCheckbox;
    let slider;
    let fromDateTimePicker;
    let toDateTimePicker;
    let presetIntervalsDropDown;

    /*
     * Controller
     */
    let controller;

    /* endregion private properties */

    /* region private methods */

    /**
     *
     */
    function buildLatestEventCheckbox() {
      latestEventCheckbox = $('<input>')
        .attr({
          type: 'checkbox',
        })
        .on('click', (e) => {
          const checked = $(e.target).is(':checked');

          controller.onDataSelectionOptionsUpdated({ latest: checked });

          controller.onPositionsFetchingRequested(
            viewer.getLayerManager().getPositionLayerName());
        });

      const latestEventView = $('<div>')
        .addClass('checkbox map-drs-latestevent')
        .attr({
          title        : App.translate('Select this option to view the latest event(s).'),
          'data-toggle': 'tooltip',
        })
        .append($('<label>')
          .append(latestEventCheckbox)
          .append($('<span>')
            .addClass('checkbox-name')
            .text(App.translate('Latest'))));

      sliderHook.append(latestEventView);
    }

    /**
     *
     */
    function buildRangeSlider() {
      slider = $('<div>').addClass('map-drs-slider');

      const now               = config.map.now();
      const today             = viewer.selectIntervalRange('TODAY');
      const tomorrow          = {

        /*
         * tomorrow.min = tomorrow 12:00 AM
         * (12 midnight).
         */
        min: new Date((new Date(today.min))
          .setDate(today.min.getDate() + 1)),
      };
      const oneDay            = 86400000;
      const sliderGranularity = 60000;  // one minute granularity
      const dataSelectionOptions = viewer.getDataSelectionOptions();
      const { from, to } = dataSelectionOptions;
      const { min } = tomorrow;

      const noUiSliderOptions = {
        //margin   : oneDay,
        start    : [from.getTime(), to.getTime()],
        connect  : true,
        behaviour: 'tap-drag',
        step     : sliderGranularity,
        range    : {
          min  : min.getTime() - config.map.dateRangeMinimum * oneDay,
          '64%': min.getTime() - 2 * oneDay,
          '82%': min.getTime() - oneDay,
          max  : now.getTime(),
        },
        format   : wNumb({
          decimals: 0,
        }),
      };
      slider
        .noUiSlider(noUiSliderOptions)

        /**
         * TODO: Use `mode: 'values'` for better pips labeling.
         * @see: http://refreshless.com/nouislider/pips/
         * § Values
         */
        .noUiSlider_pips({
          mode   : 'range',
          density: 6,
          format : {
            to(value) {
              let pipsLabelText = util.format.date(
                util.dateToGMT(new Date(value)));

              //if (value === today.max.getTime()) {
              //    value = tomorrow.min.getTime();
              //}

              if (value === now.getTime()) {
                pipsLabelText = 'now';
              }

              return pipsLabelText;
            },
          },
        });

      /**
       * 'change' event are fired when the handle is released,
       * even though the values don't change. This would cause
       * a useless expensive call to .onPositionsFetchingRequested().
       * These lines below serve as a little workaround for it.
       *
       * @see: http://refreshless.com/nouislider/events-callbacks/
       */
      const isSliderValueChanged = (from, to) => {
        const dataSelectionOptions = viewer.getDataSelectionOptions();
        const deltaFrom            = Math.abs(dataSelectionOptions.from - from);
        const deltaTo              = Math.abs(dataSelectionOptions.to - to);
        const changed              = (deltaFrom >= sliderGranularity ||
                                      deltaTo >= sliderGranularity);

        return changed;
      };

      slider.on('change', (e) => {
        const values = $(e.currentTarget).val();
        const from   = new Date(_.parseInt(values[0]));
        const to     = new Date(_.parseInt(values[1]));

        if (isSliderValueChanged(from, to)) {
          controller.onDataSelectionOptionsUpdated({
            from,
            to,
          });

          controller.onPositionsFetchingRequested(
            viewer.getLayerManager().getPositionLayerName());
        }
      });

      /* region handle label */

      /*
       * Setup handle labels.
       */
      const linkMethod = function (value, handle) {
        const handleLabel = handle.children('.map-drs-handlelabel');

        //var whichHandle = (handle.find('.map-drs-handlelabel-lower').length > 0) ?
        //                  'lower' : 'upper';
        //console.log('view - ' + whichHandle + ': ' + value);

        handleLabel
          .children('.map-drs-handlelabel-text').remove();

        handleLabel
          .prepend($('<span>')
            .addClass('map-drs-handlelabel-text')
            .text(util.format.dateTime(
              util.dateToGMT(new Date(_.parseInt(value))), 'g')));
      };

      /**
       *
       * @see http://refreshless.com/nouislider/examples/
       * § Slider with Tooltips - Tooltip with custom HTML
       */
      _.forEach(['lower', 'upper'],
        tooltipPos => slider.Link(tooltipPos).to(`-inline-
          <div class="label label-default map-drs-handlelabel
          map-drs-handlelabel-${tooltipPos}"></div>`, linkMethod));

      /*
       * Add KendoDateTimePicker widget for both handle labels.
       */
      const buildHandleLabelDateTimePicker = (slider, whichHandle) => {
        const handleLabel = slider.find(`.map-drs-handlelabel-${whichHandle}`);

        const handleLabelControls = $('<div>')
          .addClass(`map-drs-handlelabel-controls
          map-drs-handlelabel-controls-${whichHandle}`);

        const dateIcon = $('<span>')
          .addClass('glyphicon glyphicon-calendar map-drs-handlelabel-controls-icon');

        const timeIcon = $('<span>')
          .addClass('glyphicon glyphicon-time map-drs-handlelabel-controls-icon');

        const invisibleInput = $('<input>')
          .addClass('map-drs-handlelabel-controls-datetimepicker invisible');

        if (whichHandle === 'lower') {
          fromDateTimePicker = invisibleInput;
        } else {
          toDateTimePicker = invisibleInput;
        }

        handleLabelControls.append([dateIcon, timeIcon, invisibleInput]);

        const { range, start } = noUiSliderOptions;

        const kDateTimePicker = invisibleInput
          .kendoDateTimePicker({
            //footer  : false,
            min     : (whichHandle === 'lower') ?
                      new Date(range.min) : new Date(start[0]),
            max     : (whichHandle === 'lower') ?
                      new Date(start[0]) : new Date(range.max),
            value   : (whichHandle === 'lower') ?
                      new Date(start[0]) : new Date(start[1]),
            interval: 1,
          })
          .data('kendoDateTimePicker');

        kDateTimePicker
          .bind('change', (e) => {
            const picker   = e.sender;
            let pickedDate = picker.value();

            if (whichHandle === 'lower') {

              /*
               * Handle invalid 'from' date: from > to.
               */
              if (!pickedDate) {
                pickedDate = picker.max();
              }

              controller.onDataSelectionOptionsUpdated({ from: pickedDate });
            } else {

              /*
               * Handle invalid 'to' date: to < from.
               */
              if (!pickedDate) {
                pickedDate = picker.min();
              }

              controller.onDataSelectionOptionsUpdated({ to: pickedDate });
            }

            controller.onPositionsFetchingRequested(
              viewer.getLayerManager().getPositionLayerName());
          });

        dateIcon.on('click', () => {

          if (instance.isSliderEnabled()) {
            kDateTimePicker.close('time');
            kDateTimePicker.open('date');
          }
        });

        timeIcon.on('click', () => {

          if (instance.isSliderEnabled()) {
            kDateTimePicker.close('date');
            kDateTimePicker.open('time');
          }
        });

        handleLabel.append(handleLabelControls);
      };

      buildHandleLabelDateTimePicker(slider, 'lower');
      buildHandleLabelDateTimePicker(slider, 'upper');

      /* endregion handle label */

      sliderHook.append(slider);
    }

    /**
     *
     */
    function buildPresetIntervalsDropDown() {
      presetIntervalsDropDown = $('<select>')
        .addClass('map-drs-presetintervals')
        .on('change', (e) => {
          const presetInterval = $(e.target).val();

          if (presetInterval && presetInterval !== '-') {
            const intervalRange = viewer
              .selectIntervalRange(presetInterval);

            const { min, max } = intervalRange;

            controller.onDataSelectionOptionsUpdated({
              from: min,
              to  : max,
            });

            controller.onPositionsFetchingRequested(
              viewer.getLayerManager().getPositionLayerName());
          }
        })
        .kendoDropDownList({
          dataTextField : 'text',
          dataValueField: 'value',
          dataSource    : [
            {
              text : App.translate('Choose interval'),
              value: '-',
            },
            {
              text : App.translate('Today'),
              value: 'TODAY',
            },
            {
              text : App.translate('Yesterday'),
              value: 'YESTERDAY',
            },
            {
              text : App.translate('Last 24 Hours'),
              value: 'LAST_24H',
            },
            {
              text : App.translate('Last 48 Hours'),
              value: 'LAST_48H',
            },
          ],
        });

      sliderHook.append(
        presetIntervalsDropDown.data('kendoDropDownList').wrapper);
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
       * @param options
       */
      onDataSelectionOptionsChanged(options) {
        const { latest, from, to } = options;

        latestEventCheckbox.prop('checked', latest);
        instance.setSliderVisible(!latest);

        slider.val([from.getTime(), to.getTime()]);

        const kFromDateTimePicker = fromDateTimePicker.data('kendoDateTimePicker');
        const kToDateTimePicker   = toDateTimePicker.data('kendoDateTimePicker');

        kFromDateTimePicker.max(to);
        kFromDateTimePicker.value(from);
        kToDateTimePicker.min(from);
        kToDateTimePicker.value(to);

        const kPresetIntervalsDropDown =
                presetIntervalsDropDown.data('kendoDropDownList');
        const presetInterval           = viewer
          .selectPresetInterval({ min: from, max: to });

        kPresetIntervalsDropDown.value(presetInterval);
      },

      /**
       *
       * @returns {boolean}
       */
      isSliderEnabled() {
        return !Boolean(slider.attr('disabled'));
      },

      /**
       *
       * @param enabled
       */
      setSliderEnabled(enabled) {

        if (enabled) {
          slider.removeAttr('disabled');
        } else {
          slider.attr('disabled', true);
        }
      },

      /**
       *
       * @param visible
       */
      setSliderVisible(visible) {
        slider.toggleClass('hidden', !visible);
        presetIntervalsDropDown
          .data('kendoDropDownList')
          .wrapper.toggleClass('hidden', !visible);

        if (visible) {
          sliderHook.css('right', 0);
        } else {
          sliderHook.css('right', 'auto');
        }
      },

      /**
       *
       * @param enabled
       */
      setEnabled(enabled) {
        latestEventCheckbox.prop('disabled', !enabled);
        instance.setSliderEnabled(enabled);
        presetIntervalsDropDown
          .data('kendoDropDownList').enable(enabled);

        kendo.ui.progress(
          viewer.container.closest('.map-display'), !enabled);
      },

      /**
       *
       * @param visible
       */
      setVisible(visible) {
        sliderHook.toggleClass('hidden', !visible);
      },
    });

    /* endregion privileged methods */

    /* region init code */

    if ($.fn.noUiSlider) {
      sliderHook = $('<div>').addClass('map-drs');

      buildLatestEventCheckbox();
      buildRangeSlider();
      buildPresetIntervalsDropDown();

      viewer.container.append(sliderHook);

      /*
       * Since currently the date range slider considered
       * as an "extension" and loaded after the map
       * initialization process, we gotta call this
       * .onDataSelectionOptionsChanged() manually after
       * initializing the date range slider in order to
       * sync. the default state of data selection options.
       */
      instance.onDataSelectionOptionsChanged(viewer.getDataSelectionOptions());
    } else {
      throw new Error('$.noUiSlider plugin not exist.');
    }

    /* endregion init code */
  });

export { DateRangeSlider as default, DateRangeSlider };
