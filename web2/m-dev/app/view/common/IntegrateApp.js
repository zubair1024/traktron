Ext.define('Rms.view.common.IntegrateApp', {
    extend  : 'Ext.Panel',
    alias   : 'widget.integrate_app',
    requires: [
        'Rms.view.common.LoginPanel',
        'Rms.view.LaunchApp'
    ],
    config  : {
        layout: 'card',
        items : [
            {
                xtype: 'loginPage'
            }, {
                xtype: 'launchapp'
            }
        ]
    }
});