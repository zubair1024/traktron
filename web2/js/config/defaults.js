/**
 * Contains default settings that can be overwritten in js/config/settings.js
 */
if (!window.App) {
    window.App = {};
}

App.config = {
    /**
     * Version number
     * @type {string}
     */
    version                   : '1.130 2016-04-12',
    domainObjectTypes         : {},
    /**
     * @type {{id:string, description: string, items:{id:string, name:string, widgetTypes:{id:string, name:string, icon:string}[]}[]}[]}
     */
    domainObjectTypesTree     : [],
    domainDataViews           : [],
    /**
     * This widgetType uses a parent panel (with a TabStrip inside) for rendering.
     * @type {string}
     */
    parentWidgetType          : 'widgetGroup',
    /**
     * cache for widgetConfigurations
     */
    widgets                   : {},
    /**
     * The widget containers are locations named like the following. Use those as constants in the app.
     */
    locationMainArea          : 'CENTER', // --> widget is located in App.view.mainArea
    locationSideBar           : 'RIGHT',  // --> widget is located inApp.view.sideBar
    locationNone              : 'NONE',   // --> widget is not displayed
    /**
     * The location where the alarmMap is being displayed. Choices: one of the above.
     * @type {string}
     */
    locationAlarmMap          : 'RIGHT',
    locationEventHistoryMap   : 'RIGHT',
    /**
     * Name of theme
     * @type {string|null} eg. 'a', 'b', 'default', null
     */
    theme                     : 'default',
    /**
     * copyright string
     * @type {string}
     */
    copyrights                : 'Powered by ROAM&trade;. Copyright &copy; 2001&ndash;2015. All rights reserved.',
    /**
     * Specific user settings
     */
    user                      : {
        /**
         * Default culture
         * @type {string}
         */
        culture           : 'en',
        dataGridPageSize  : 15,
        geoReferenceSystem: 'Global',
        id                : -1,
        language          : 'en',
        loginName         : null,
        measurementSystem : 'metric',
        timeZone          : 'GMT',
        /**
         * offset in minutes from GMT
         */
        timeZoneOffset    : 0
    },
    /**
     * Current session id
     * @type {string|null}
     */
    sessionId                 : null,
    /**
     * Name of cookie / sessionId variable
     * @type {string|null}
     */
    sessionName               : 'ROAMSESSIONKEY',
    /**
     * Current application id
     * @type {string|number|null}
     */
    appId                     : null,
    /**
     * E-mail to the helpdesk
     * @type {string|null}
     */
    mailHelpdesk              : 'helpdesk@roamworks.com',
    /**
     * dateFormat string that comes from / to the backend.
     * Kendo specific.
     * @type {string}
     */
    dateFormat                : 'yyyy\'-\'MM\'-\'dd',
    /**
     * dateTimeFormat string that comes from / to the backend.
     * Kendo specific.
     * @type {string}
     */
    dateTimeFormat            : 'yyyy\'-\'MM\'-\'dd\'T\'HH\':\'mm\':\'ss',
    timeFormatShort           : 'HH:mm',
    /**
     * displayed instead of empty values.
     * @type {string}
     */
    blankSign                 : '&ndash;',
    /**
     * Used to separate the breadcrumbs.
     * @type {string}
     */
    breadcrumbSeparator       : ' - ',
    /**
     * Name of application.
     * @type {string}
     */
    name                      : 'ROAM',
    /**
     * How often the alarms and notifications are refreshed?
     * in milli seconds
     * @type {number}
     */
    pollInterval              : 30000,
    /**
     * This is the service url. Trailing slash.
     * @type {string}
     */
    /**
     * Number of seconds from where to start displaying notifications. Only used for the first notification poll.
     * @type {number}
     */
    notificationThreshold     : 120,
    serviceUrl                : '../service/',
    logUrl                    : '../service/logger/logerror',
    ajaxType                  : 'POST',
    ajaxDataType              : 'json',
    /**
     * Timeout for all AJAX requests.
     * in milli seconds
     * If you set this to 0, then the browser's timeout is taken into account - whatever this is.
     * @type {number}
     */
    ajaxTimeout               : 0, // eg. 120000 = 2 minutes
    /**
     * This timeout is only used for the polling request.
     * in milli seconds
     * @type {number}
     */
    ajaxPingTimeout           : 20000, // 20 seconds
    /**
     * divider that concatenates objectType with objectId, eg. assetGroup_123
     * @type {string}
     */
    idDivider                 : '_',
    /**
     * route to login
     * @type {string}
     */
    routeLogin                : '/login',
    /**
     * set to true to see some details regarding the translation
     * @type {boolean}
     */
    debug_i18n                : true,
    /**
     * 2 = All errors are shown. Default.
     * 1 = Only application errors aka "500" will be shown. Timeouts will be ignored.
     * 0 = No errors are shown.
     * @type {number}
     */
    errorLevel                : 2,
    /**
     * Grid icons
     */
    icons                     : {
        'assetStateValue.normal'        : {
            url        : 'images/assetstatus/normal.png',
            description: 'Normal'
        },
        'assetStateValue.notOperational': {
            url        : 'images/assetstatus/notoperational.png',
            description: 'Not Operation'
        },
        'assetStateValue.notMoving'     : {
            url        : 'images/assetstatus/notmoving.png',
            description: 'Not Moving'
        },
        'assetStateValue.idling'        : {
            url        : 'images/assetstatus/idling.png',
            description: 'Idling'
        },
        'alarmStateValue.active'        : {
            url        : 'images/alarmstatus/active.png',
            description: 'Active'
        },
        'alarmStateValue.acknowledged'  : {
            url        : 'images/alarmstatus/acknowledged.png',
            description: 'Acknowledged'
        },
        'alarmStateValue.normal'        : {
            url        : 'images/alarmstatus/normal.png',
            description: 'Normal'
        },
        'driverScoreStateValue.0'       : {
            url        : 'images/threshold/good.png',
            description: 'Good'
        },
        'driverScoreStateValue.1'       : {
            url        : 'images/threshold/fair.png',
            description: 'Fair'
        },
        'driverScoreStateValue.2'       : {
            url        : 'images/threshold/bad.png',
            description: 'Bad'
        },
        'driverScoreStateValue.3'       : {
            url        : 'images/threshold/dangerous.png',
            description: 'Dangerous'
        },
        'driverScoreStateValue.4'       : {
            url        : 'images/threshold/none.png',
            description: 'None'
        },
        'thresholdValue.good'           : {
            url        : 'images/threshold/good.png',
            description: 'Good'
        },
        'thresholdValue.fair'           : {
            url        : 'images/threshold/fair.png',
            description: 'Fair'
        },
        'thresholdValue.bad'            : {
            url        : 'images/threshold/bad.png',
            description: 'Bad'
        },
        'thresholdValue.dangerous'      : {
            url        : 'images/threshold/dangerous.png',
            description: 'Dangerous'
        }
    },
    /**
     * Customer specific setting
     * @type {boolean}
     */
    alertJustificationRequired: false,
    /**
     * @type {Date|null}
     */
    lastTreeRefresh           : null,
    /**
     * Default settings for maps.
     * @see App.user for the update
     */
    map                       : {
        url                           : 'js/config/dewa.map.json',
        controlsUrl                   : 'js/ui/templates/map.controls.html',
        /**
         * default mapViewer implementation
         */
        viewer                        : 'HereMaps',
        appId                         : 'MHkEpbjxdKCX0U1tn9yy',
        appCode                       : 'uurLiQT0OyWEGUfQMBvjrw',
        /**
         * Contains all configured map projects.
         */
        projects                      : {},
        /**
         * the id of the defaultProject
         * App.config.map.projects[App.config.map.defaultId] returns the default project.
         */
        defaultId                     : null,
        /**
         * Cache some dataView configurations for the mapInfoBox.
         * @type {{}}
         */
        dataView                      : {},
        /**
         * Single source of relative time reference for "now". It is used to
         * uniformly determine the value of "now" in the interval selection model
         * of the new maps.
         * @returns {Date}
         */
        now                           : null,
        originalNow                   : new Date((new Date()).setSeconds(0, 0)),
        /**
         * Displays assets/asset history positions control in the form of category
         * tree (just like locations and geofences) instead of classic list-view.
         * @type {boolean}
         */
        assetCategoryFilter           : true,
        /**
         * Like `assetCategoryFilter` except that it constructs deeper hierarchy
         * of asset positions tree based on its "configuration", in which case
         * each category will be put under its corresponding asset configuration.
         * @type {boolean}
         */
        assetConfigurationFilter      : false,
        /**
         * Easter egg for Trafigura. :X
         */
        assetStatusFilters            : false,
        /**
         * Hide checkbox for activating automatic label placement for assets,
         * locations, and geofences in order to minimize the label collision.
         * Currently implemented using greedy algorithm. This ALP feature is
         * turned off by default as Rani requested.
         * @type {boolean}
         * @see https://en.wikipedia.org/wiki/Automatic_label_placement
         * @see http://www.cs.uu.nl/docs/vakken/gd/steven2.pdf
         */
        autoLabelingCheckboxHidden    : true,
        /**
         * Displays a date range slider instead of the Intervals panel in the
         * map controls.
         * @type {boolean}
         */
        dateRangeSlider               : true,
        /**
         * how many days back in time the dateRangeSlider can pick
         */
        dateRangeMinimum              : 60,
        /**
         * Display routing feature?
         * @type {boolean}
         */
        routing                       : true,
        /**
         * Displays the current coordinates (latitude, longitude) on the top-left
         * of the map as the cursor is moving on the canvas. It also enables user
         * to enter latitude and/or longitude value so that the map pans to that
         * certain coordinates.
         * @type {boolean}
         */
        coordinatesDisplay            : false,
        /**
         * HACK: Despair. This config introduced as a hack for removing the
         * green icon (historical) that is never displayed in DEWA system.
         * @see https://jira.roamworks.com/browse/DEWAII-46
         */
        legend                        : {isDEWA: false},
        /**
         * Set "satellite" as the default map type.
         * @type {boolean}
         */
        defaultMapTypeSatelliteEnabled: false,
    },
    /**
     * True if the app runs on a small device with screen.width < 768px, eg. SmartPhone.
     * @type {boolean}
     */
    isSmallDevice             : false,
    /**
     * default height of a widget in pixels
     */
    widgetHeight              : 500,
    /**
     * default grid horizontal scrollablility
     */
    scrollableGrid            : false,
    /**
     * Maximum amount of selected grid columns in widgets
     */
    maxGridColumnSize         : 7
};
