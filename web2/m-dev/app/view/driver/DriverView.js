Ext.define('Rms.view.driver.DriverView', {
    extend  : 'Ext.Panel',
    alias   : 'widget.driverview',
    requires: [
        'Rms.view.driver.DriverListPanel',
        'Rms.view.driver.DriverDetails'
    ],
    config  : {
        layout: {
            type     : 'card',
            animation: {
                type: 'fade'
            }
        },
        items : [
            {
                xtype: 'driver_list',
                id   : 'drivers'
            },
            {
                xtype: 'driver_details',
                id   : 'driverDetails'
            }
        ]
    }
});