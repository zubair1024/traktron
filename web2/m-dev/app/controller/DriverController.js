Ext.define('Rms.controller.DriverController', {
    extend  : 'Ext.app.Controller',
    requires: [
        'Rms.view.driver.DriverView',
        'Rms.view.driver.DriverListPanel',
        'Rms.view.driver.DriverDetails',
        'Rms.store.DriverStore',
        'Rms.view.statistics.StatisticsView',
        'Rms.view.statistics.StatisticsList'
    ],
    config  : {
        refs   : {
            launchApp           : 'launchapp',
            driverView          : 'driverview',
            driverDetailsView   : 'driverview #driverDetails',
            driversListView     : 'driverview driver_list',
            driversList         : 'driverview driver_list list',
            driverDetailsBackBtn: 'driverview driver_details toolbar #back',
            driverListOptionsBtn: 'driverview driver_details toolbar #driverOptions',
            //Statistics
            statisticsView      : 'statistics_view',
            statisticsList      : 'statistics_view statistics_list list',
            statisticsBarView   : 'statistics_view statistics_bar',
            statisticsPieView   : 'statistics_view statistics_pie',
            statisticsGaugeView : 'statistics_view statistics_gauge'
        },
        control: {
            launchApp           : {
                initialize: 'createInstances'
            },
            driverView          : {
                show: 'showDriversList'
            },
            driversList         : {
                itemtap: 'driversListTapped'
            },
            driverDetailsBackBtn: {
                tap: function () {
                    this.domainObjectId = null;
                    if (!this.driverListTapped) {
                        this.getLaunchApp().setActiveItem('assetview');
                    }
                    //show grouper toolbar
                    this.getDriversListView().down('#driverListControls').show();

                    this.getDriverView().setActiveItem('#drivers');
                }
            },
            driverListOptionsBtn: {
                tap: function () {
                    this.getDriverDetailsView().addDriverOptions();
                }
            }
        }
    },

    /**
     * Create and save store instance once the application has started
     */
    createInstances: function () {
        this.driverStore     = Ext.create('Rms.store.DriverStore');
        this.mapController   = Rms.app.getController('MapController');
        this.assetController = Rms.app.getController('AssetController');
    },


    /**
     * Load list of drivers
     */
    showDriversList: function () {
        var me    = this,
            store = this.driverStore;

        //load list data only if needed
        if (!store.getCount()) {
            //Set params
            store.setParams(Ext.apply({}, {
                domainObjectType: 'driverOverview',
                domainObjectId  : App.config.rootDomainObjectId
            }, store.getParams()));

            //Load data
            store.load();

            //render view
            me.getDriversListView().renderList();

            //Update the count
            store.on('load', function () {
                //Unset load mask
                me.updateCount();
            });
        }
        //show grouper toolbar
        me.getDriversListView().down('#driverListControls').show();

        //Stop Map refresher
        if (me.mapController.refreshIntervalId) {
            clearInterval(me.mapController.refreshIntervalId);
        }
    },


    /**
     * Load the driver details for a given driver instance
     * @param record
     * @returns {*}
     */
    getDriverDetails: function (record) {
        var me                 = this,
            domainObjectId     = record.currentValues ? record.currentValues[0] : record.get('domainObjectId'),
            domainObjectType   = record.referenceType ? record.referenceType : record.get('domainObjectType'),
            domainDataView     = 'details',
            domainObjectValues = Rms.app.getController('CommonController').getDomainObjectValues(domainDataView, domainObjectType),
            url                = App.config.serviceUrl + 'caesarObject/objectDataProvider3',
            param              = {
                domainObjectId    : domainObjectId,
                domainObjectValues: JSON.stringify(domainObjectValues),
                domainObjectType  : domainObjectType,
                domainDataView    : domainDataView
            };
        this.detailsShown      = true;

        this.domainObjectId = domainObjectId;
        return Rms.app.getController('CommonController').getData(url, param, false);
    },


    /**
     * Driver list item tapped for which async load the driver
     * @param list
     * @param index
     * @param target
     * @param record
     */
    driversListTapped: function (list, index, target, record) {
        var me                = this,
            data              = me.getDriverDetails(record);
        this.driverListTapped = true;
        me.getDriverDetailsView().updateData(data, record.get('domainObjectType'), record.get('domainObjectId'));
        me.getDriverView().setActiveItem('#driverDetails');

        //Resetting the previous view
        //me.getAssetListSearch().setValue('');
        //hide grouper toolbar
        me.getDriversListView().down('#driverListControls').hide();

        //clear list search filter
        //me.driverStore.clearFilter();

    },

    /**
     * route to driver details
     * @param record
     */
    routeToDetails: function (record) {
        var me                = this,
            data              = me.getDriverDetails(record);
        this.driverListTapped = false;
        me.getDriverDetailsView().updateData(data);

        //go to drivers view
        this.getLaunchApp().setActiveItem('driverview');
        this.getDriverView().setActiveItem('#driverDetails');
        //hide grouper toolbar
        me.getDriversListView().down('#driverListControls').hide();
    },

    showLineGraph: function (reportType) {
        this.getDriverDetailsView().driverOptions.hide();
        this.getLaunchApp().setActiveItem(3);
        this.getStatisticsView().setActiveItem(2);
        this.getStatisticsView().setActiveItem('#lineView');
        this.getStatisticsView().down('#lineView').updateData(this.domainObjectId, reportType);
    },

    showGaugeGraph: function (reportType) {
        this.getDriverDetailsView().driverOptions.hide();
        this.getLaunchApp().setActiveItem(3);
        this.getStatisticsView().setActiveItem('#gaugeView');
        this.getStatisticsView().down('#gaugeView').updateData(this.domainObjectId, reportType);
    },

    showPieGraph: function (reportType) {
        this.getDriverDetailsView().driverOptions.hide();
        this.getLaunchApp().setActiveItem(3);
        this.getStatisticsView().setActiveItem('#pieView');
        this.getStatisticsView().down('#pieView').updateData(this.domainObjectId, reportType);
    },

    showBarGraph: function (reportType) {
        this.getDriverDetailsView().driverOptions.hide();
        this.getLaunchApp().setActiveItem(3);
        this.getStatisticsView().setActiveItem('#pieView');
        this.getStatisticsView().down('#pieView').updateData(this.domainObjectId, reportType);
    },

    /**
     * Update the count bar
     */
    updateCount: function () {
        this.getDriversListView().down('#driversCount').setTitle('<div style="font-size: 0.7em">'
                                                                 + this.driverStore.getCount() +
                                                                 ' Drivers</div>');
    }
});