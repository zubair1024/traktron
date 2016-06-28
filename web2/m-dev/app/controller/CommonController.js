Ext.define('Rms.controller.CommonController', {
    extend: 'Ext.app.Controller',
    config: {
        refs   : {
            launchApp                 : 'launchapp',
            assetView                 : 'assetview',
            driverView                : 'driverview',
            statisticsView            : 'statistics_view',
            statisticsBarViewBackBtn  : 'statistics_view statistics_bar button[id=statisticsBarBckBtn]',
            statisticsPieViewBackBtn  : 'statistics_view statistics_pie button[id=statisticsPieBckBtn]',
            statisticsLineViewBackBtn : 'statistics_view statistics_line button[id=statisticsLineBckBtn]',
            statisticsGaugeViewBackBtn: 'statistics_view statistics_gauge button[id=statisticsGaugeBckBtn]'
        },
        control: {
            launchApp                 : {
                initialize: 'initialize'
            },
            statisticsBarViewBackBtn  : {
                tap: function () {
                    this.statisticsBackBtn();
                }
            },
            statisticsPieViewBackBtn  : {
                tap: function () {
                    this.statisticsBackBtn();
                }
            },
            statisticsLineViewBackBtn : {
                tap: function () {
                    this.statisticsBackBtn();
                }
            },
            statisticsGaugeViewBackBtn: {
                tap: function () {
                    this.statisticsBackBtn();
                }
            }

        }
    },

    /**
     * Initialize
     */
    initialize           : function () {
        this.assetController  = Rms.app.getController('AssetController');
        this.driverController = Rms.app.getController('DriverController');
    },
    /**
     * Get domain object values
     * @param domainDataView
     * @param domainOjectType
     * @returns {Array}
     */
    getDomainObjectValues: function (domainDataView, domainOjectType) {
        var values = [];
        if (App.domainDataViewModel[domainOjectType]) {
            values = App.domainDataViewModel[domainOjectType][domainDataView].domainObjectValues;
        }
        return values
    },

    /**
     * Perform an Ajax request to fetch data
     * @param url
     * @param params
     * @param async
     * @returns {{}}
     */
    getData: function (url, params, async) {
        var result = {};

        Ext.Ajax.request({
            url    : url,
            method : App.config.ajaxType,
            params : params,
            async  : async,
            success: function (response) {
                result = Ext.decode(response.responseText);
            }
        });

        return result;
    },

    format           : function (field, type, id) {
        var me    = this,
            value = '';
        /**
         * formatting based on the type of field
         */
        switch (field.type) {
            case 'domainObjectReferenceType':
                if (typeof field.displayValue !== 'undefined') {
                    var el       = document.createElement('span');
                    el.innerText = field.displayValue;
                    value        = el;
                    switch (field.id) {
                        case 'driver':
                            el.className = 'x-button x-button-action';
                            el.onclick   = function () {
                                Rms.app.getController('DriverController').routeToDetails(field);
                            };
                            break;
                    }
                }
                break;
            case 'vfsImage':
                if (typeof field.currentValues !== 'undefined' && field.currentValues[0] !== null) {
                    var params                     = {
                        domainObjectId  : field.domainObjectId ? field.domainObjectId : id,
                        domainObjectType: field.domainObjectType ? field.domainObjectType : type,
                        filename        : field.currentValues[0]
                    };
                    params[App.config.sessionName] = App.config.sessionId;

                    value = '<img class="img-thumbnail" src="' +
                            App.config.serviceUrl + 'caesarVfsResource/get?' + Ext.Object.toQueryString(params) +
                            '" alt="' + field.baseValue + '" title="' + field.currentValues[0] + '"/>';
                }
                break;
            case 'string':
                if (typeof field.currentValues[0] != 'undefined') {
                    value = field.currentValues[0];
                }
                break;
            case 'stateType':
                if (typeof field.currentValues[0] != 'undefined') {
                    var icon = App.icons[field.currentValues[0]];
                    if (icon) {
                        value = '<img src="' + icon.url +
                                '" alt="' + field.baseValue + '" title="' + icon.description + '"/>';

                    }
                }
                break;
            case 'date':
            case 'dateTime':
                if (field.currentValues[0] && typeof field.currentValues[0] !== 'undefined') {
                    var date = new Date((field.currentValues[0]).replace('T', ' ').replace(/-/g, '/'));
                    date.setMinutes(date.getMinutes() + App.config.user.timeZoneOffset);
                    value = field.type == 'date' ? Ext.Date.format(date, App.config.user.dateFormat) : Ext.Date.format(date, App.config.user.dateTimeFormat);
                }
                break;
            default:
                if (typeof field.currentValues[0] != 'undefined') {
                    value = field.currentValues[0];
                }
                break;
        }
        //Logger
        //if (typeof field.currentValues != 'undefined') {
        //    console.log(field.id + " = " + field.currentValues[0] + "(" + field.type + ")");
        //}
        //if (typeof field.displayValue != 'undefined') {
        //    console.log(field.id + " = " + field.displayValue + "(" + field.type + ")");
        //}
        /**
         * Specific formatting based on the id of the field
         */
        switch (field.id) {
            case'position':
                if (typeof field.displayValue !== 'undefined') {
                    var pos          = document.createElement('span');
                    pos.className    = 'x-button x-button-action';
                    pos.style.height = '3em';
                    pos.innerText    = field.displayValue;
                    positions        = field.displayValue;
                    pos.onclick      = function () {
                        Rms.app.getController('MapController').showSingleAssetOnMap();
                    };
                    value            = pos;
                }
                break;
            // Special handling for phone numbers.
            case 'driverMobile':
            case 'mobile':
                // Reformat Phone links in order to make them "dialable".
                if (typeof field.displayValue !== 'undefined') {
                    value = '<a href="tel:' + field.displayValue + '" class="x-button x-button-action" ' +
                            'style="text-decoration: none; height:3em">' + field.displayValue + '</a>';
                    Ext.getCmp('navBtn').setHidden(false);
                }
                break;
            case "faultAlert":
                if (typeof field.currentValues[0] !== 'undefined') {
                    var bool = field.currentValues[0];
                    if (bool === true) {
                        value = 'Yes';
                    } else {
                        value = 'No';
                    }
                }
                break;
            case "registrationExpiry":
                if (typeof field.currentValues[0] !== 'undefined') {
                    if (field.currentValues[0]) {
                        var myDate;
                        if (field.currentValues[0].indexOf('/') > -1) {
                            var from = (field.currentValues[0]).split('/');
                            tempDate = new Date(from[2], from[1] - 1, from[0]);
                            myDate   = new Date(tempDate);
                            value    = Ext.Date.format(myDate, App.config.user.dateFormat);
                        } else {
                            myDate = new Date(field.currentValues[0]);
                            value  = Ext.Date.format(myDate, App.config.user.dateFormat);
                        }
                    }
                }
                break;

        }
        return value;
    },
    /**
     * Go back from a graph page
     */
    statisticsBackBtn: function () {
        var me = this;
        if (!this.assetController.directStatsTapped) {
            if (me.assetController.domainObjectId) {
                this.getLaunchApp().setActiveItem('assetview');
            } else if (me.driverController.domainObjectId) {
                this.getLaunchApp().setActiveItem('driverview');
            }
            Ext.getCmp('statsview').setActiveItem(9);
        } else {
            this.assetController.directStatsTapped = false;
        }
        setTimeout(function(){ Ext.getCmp('statsview').setActiveItem(0); }, 500);
    }
});