/**
 * Alarm class
 * @type {*}
 */
App.ui.Alarm = App.ui.MenuBase.extend({

    /**
     * special meaning to the backend.
     */
    alarmTypeAll: 'All Alarms',

    /**
     * specific domainDataView for the Alarm Buttons
     */
    allAlarmsDomainDataView: 'allActiveAlarms',

    /**
     * Alarm Menu element
     */
    elMenu: null,

    /**
     * Alarm ButtonBar element
     */
    elButtonBar: null,

    /**
     * Contains the widget configuration for the alarms grid.
     */
    widgetData: null,

    /**
     * Contains name of domainDataView that has alarmActions as feature defined.
     */
    domainDataView: null,

    /**
     * domainObjectType used to get the alarms for that hierarchy level, eg. customer, group
     */
    objectType: null,

    /**
     * domainObjectId used to get the alarms for that hierarchy level, eg. 12345
     */
    objectId: null,

    /**
     * Used as the alarm widget's data id.
     */
    alarmWidgetDataId: 'alarms',

    alarmMapWidgetDataId: 'alarmMap',

    /**
     * @param config
     * @returns {*}
     */
    init: function (config) {
        'use strict';

        // Call parent constructor with config
        App.ui.MenuBase.fn.init.call(this, $.extend({}, config));

        // get references to important elements
        //noinspection JSJQueryEfficiency
        this.elMenu      = $('#menu-alarms > .dropdown-menu');
        //noinspection JSJQueryEfficiency
        this.elButtonBar = $('#alarmBar .alarm-items');

        return this;
    },

    /**
     * Fetches alarms and renders them accordingly.
     */
    refresh: function () {
        'use strict';

        var me = this;

        return $.ajax({
            url    : App.config.serviceUrl + 'caesarAssetAlarm/activeAlarms',
            success: function (response) {

                /** @namespace response.alarmTypes */
                var buttons = me.elButtonBar.find('li.alarm-button');
                buttons.remove();

                if (response.count) {
                    me.elButtonBar.append(me.buildAlarmButton(
                        me.alarmTypeAll,    // this has a special meaning to the backend.
                        response.count,
                        response.active     // amount of "not acknowledged" alarms
                    ));
                    for (var i = 0; i < response.alarmTypes.length; i++) {
                        var alarm = response.alarmTypes[i];
                        me.elButtonBar.append(me.buildAlarmButton(
                            alarm.name,
                            alarm.count,    // total count of alarms of that type
                            alarm.active    // amount of "not acknowledged" alarms of that type
                        ));
                    }
                    buttons = me.elButtonBar.find('li.alarm-button');
                    buttons.on('click', function () {
                        me.showWidget($(this).data('alarm-type'), $(this).data('alarm-filterstatus'));
                    });

                }
                // Call resize Handler - adjust navigationArea, mainArea and sideBar.
                if (App.application) {
                    App.application.resizeHandler();
                }

                me.buildAlarmMenu(response);
            }
        });
    },

    buildAlarmMenu: function (response) {

        var me = this;
        me.elMenu.empty();

        if (response.count) {
            var activeAlarms       = '',
                acknowledgedAlarms = '',
                alarm              = null;

            // Alarms are ALWAYS there as soon as there are more than data.count alarms in the response.
            for (var i = 0; i < response.alarmTypes.length; i++) {
                alarm = response.alarmTypes[i];

                activeAlarms += '<li class="item" data-alarm-type="' +
                    alarm.name + '" data-alarm-filterStatus="alarmStateValue.active">' +
                    App.translate(alarm.name) +
                    '<span class="badge pull-right">' +
                    kendo.toString(alarm.active, 'n0') +
                    '</span></li>';

                if (alarm.count - alarm.active > 0) {
                    acknowledgedAlarms += '<li class="item" data-alarm-type="' +
                        alarm.name + '" data-alarm-filterStatus="alarmStateValue.acknowledged">' +
                        App.translate(alarm.name) +
                        '<span class="badge pull-right">' +
                        kendo.toString(alarm.count - alarm.active, 'n0') +
                        '</span></li>';
                }
            }

            // Add "Active" menu column
            me.elMenu.append(this.renderMenuColumn(
                'alarmsmenu-active',
                App.translate('Active'),
                activeAlarms,
                null,
                null
            ));

            // Add "Acknowledged" menu column - if available.
            if (acknowledgedAlarms !== '') {
                me.elMenu.append(this.renderMenuColumn(
                    'alarmsmenu-acknowledged',
                    App.translate('Acknowledged'),
                    acknowledgedAlarms,
                    null,
                    null
                ));
            }

            me.elMenu.find('.item').on('click', function () {
                me.showWidget($(this).data('alarm-type'), $(this).data('alarm-filterstatus'));
            });

        } else {
            me.elMenu.html('<li class="no-items">' + App.translate('No alarms.') + '</li>');
        }

        // Set badge
        $('#menu-alarms a span.badge').html(response.count > 0 ? kendo.toString(response.count, 'n0') : '');
    },


    /**
     * Create clickable button for a specific alarm type.
     * @param {string} alarmType either "All Alarms" or another valid alarmType.
     * @param {int} total amount of alarms
     * @param {int} active count of not acknowledged alarms
     * @returns {*}
     */
    buildAlarmButton: function (alarmType, total, active) {
        'use strict';

        return '<li class="alarm-button alarmstatus-' + (active === 0 ? '' : 'not-') + 'all-acknowledged" ' +
            'data-alarm-type="' + alarmType + '">' +
            '<a>' +
            '<span class="pull-left icon-alert"></span>' +
            App.translate(alarmType) +
            '<span class="badge">' + kendo.toString(active, 'n0') + '/' + kendo.toString(total, 'n0') + '</span>' +
            '</a>' +
            '</li>';
    },

    /**
     * Fetches corresponding widget configuration in order to display alarm actions.
     * Usually, this is a grid configuration.
     * @param {string} type
     */
    getWidgetData: function (type) {
        'use strict';

        var me = this;

        // 1) Look up corresponding domainDataView for alarms grid.
        me.domainDataView = null;
        dataViewSearch:
            for (var i = 0; i < App.config.domainDataViews.length; i++) {
                var item = App.config.domainDataViews[i];

                if (item.features && item.features.length) {

                    for (var j = 0; j < item.features.length; j++) {

                        if (item.features[j] === 'alarmActions') {
                            me.domainDataView = item.id;
                            break dataViewSearch;
                        }
                    }
                }
            }

        // 2) Is there a DataView defined to display alarm Actions?
        if (me.domainDataView) {

            // 3) What is the current root domainObjectType of the tree?
            me.objectType = App.current.idPath[0].objectType;
            me.objectId   = App.current.idPath[0].objectId;

            // 4) Load widget configuration for this domainObjectType.
            $.ajax({
                url    : App.config.serviceUrl + 'caesarWidgetProvider/getWidgets2',
                data   : {
                    domainObjectType: me.objectType
                },
                success: function (response) {
                    var success = false;

                    // 5) Search alarm grid configuration.
                    for (var i = 0; i < response.data.length; i++) {
                        var item       = response.data[i],
                            widgetData = {};

                        // TODO find out why there is "null" in there sometimes.
                        if (item.widgetData && item.widgetData !== 'null') {
                            widgetData = $.parseJSON(item.widgetData);
                        }
                        if (widgetData.viewType === me.domainDataView) {
                            me.widgetData = widgetData;

                            // Now use the "allAlarms" domainDataView
                            me.widgetData.viewType = me.allAlarmsDomainDataView;

                            // 6) Call again with config loaded.
                            success = true;
                            me.showWidget(type);
                            // Stop here.
                            break;
                        }
                    }

                    if (!success) {
                        // Notify user that we have not found a valid alarm grid configuration.
                        me.notifyNoWidgetConfigFound();
                    }
                }
            });
        } else {
            // Notify user that we have not found a valid alarm grid configuration.
            me.notifyNoWidgetConfigFound();
        }
    },

    /**
     * creates a widget with a grid of alarms
     * @param {string} alarmType
     * @param alarmStatus
     */
    showWidget: function (alarmType, alarmStatus) {
        var me       = this,
            location = App.config.locationMainArea;

        // Check if grid config is already there
        if (me.widgetData) {

            // TODO look for better reuse mechanism of the grid.
            if (me.widget) {
                me.widget.destroy();
                me.widget = null;
            }

            var filters = [
                {
                    key  : 'assetList',
                    value: '',
                    type : 'selection'
                }
            ];

            if (alarmStatus) {
                filters.push({
                    key  : 'alarmStatus',
                    value: alarmStatus,
                    type : 'eq'
                });
            }

            if (alarmType !== me.alarmTypeAll) {
                filters.push({
                    key  : 'alarmName',
                    value: alarmType,
                    type : 'eq'
                });
            }

            me.widget = new App.ui.WidgetPanel({
                widgetType    : 'grid',
                location      : location,
                positionNumber: '-1',
                isTemporary   : true, // Adds a closer and set widget to "not configurable".
                name          : App.translate(alarmType),
                pictureName   : 'Time-8',
                id            : me.alarmWidgetDataId, // Only used for the settings dialog.
                widgetData    : me.widgetData,
                domainDataView: me.domainDataView,
                objectType    : me.objectType,
                domainObjectId: me.objectId,
                objectName    : null, // Maybe we can fill this with "3 objects" or so.
                sortAttribute : 'triggeredTime',
                filters       : filters
            });

            App.view.widgets.push(me.widget);
            me.widget.show();

        } else {
            me.getWidgetData(alarmType);
        }
    },

    /**
     * Open AlarmMap in new widget
     * @param {string[]} ids
     * @param {boolean} createRouteFromIds
     */
    showOnMap: function (ids, createRouteFromIds) {
        var me = this;

        // TODO look for better reuse mechanism of the map.
        if (me.mapWidget) {
            me.mapWidget.destroy();
            me.mapWidget = null;
        }

        var objectName = null;
        if (ids.length === 1) {
            // Display AlarmId for one item.
            objectName = ids[0];
        } else {
            // Display count of the selected objects.
            objectName = App.translate('{0} objects', ids.length);
        }

        me.mapWidget = new App.ui.WidgetPanel({
            widgetType        : 'map',
            location          : App.config.locationAlarmMap,
            positionNumber    : '-1',
            isTemporary       : true, // Adds a closer and set widget to "not configurable".
            name              : App.translate('Alarm Map'),
            pictureName       : App.util.widget.defaultIcon.alarmMap,
            height            : App.config.widgetHeight,
            displayMini       : true, // If displayMini is true, the splitter is collapsed.
            id                : me.alarmMapWidgetDataId, // Only used for the settings dialog and fade in of other widget.
            ids               : ids,
            createRouteFromIds: createRouteFromIds,
            widgetData        : {
                // This tells the alarm map to use the default mapProject.
                viewType: null
            },
            // If showOnMap is called directly from a grid, me.objectType is not populated. Fall back to the current selected objectType.
            objectType        : me.objectType || App.current.objectType,
            domainObjectId    : me.objectId || App.current.objectId,
            objectName        : objectName
        });

        App.view.widgets.push(me.mapWidget);
        me.mapWidget.show();
    },


    /**
     * Notify user that we have not found a valid alarm grid configuration.
     */
    notifyNoWidgetConfigFound: function () {
        App.log.error(App.translate('You need to configure an alarms grid in the Widget Catalog for this action.'), null, true);
    },

    /**
     * perform alarm actions
     * @param grid a Kendo grid
     * @param ids
     * @param {string} action reset or acknowledge
     * @param {string=} msg
     */
    doAction: function (grid, ids, action, msg) {
        'use strict';

        var me = App.view.Alarm; // as function is called from "outside"

        // Is there something selected - if not, do nothing.
        if (ids.length) {
            switch (action) {
                case 'reset':
                    $.ajax({
                        url    : App.config.serviceUrl + 'caesarAssetAlarm/resetMultipleAlarms',
                        data   : {
                            alarmIds     : JSON.stringify(ids),
                            justification: msg
                        },
                        success: function () {
                            grid.dataSource.read();
                            me.refresh();
                        }
                    });
                    break;
                case 'acknowledge':
                    $.ajax({
                        url    : App.config.serviceUrl + 'caesarAssetAlarm/acknowledgeMultipleAlarms',
                        data   : {
                            alarmIds     : JSON.stringify(ids),
                            justification: msg
                        },
                        success: function () {
                            grid.dataSource.read();
                            me.refresh();
                        }
                    });
                    break;
                case 'showOnMap':
                    me.showOnMap(ids);
                    break;
                case 'createRoute':
                    me.showOnMap(ids, true);
                    break;
                case 'showOnMapEventHistory':
                    me.showOnMap(ids);
                    break;
            }
        }
    }
});
