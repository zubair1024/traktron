Ext.define('Rms.Util', {
    singleton  : true,
    config     : {
        baseUrl          : 'myBaseUrl',
        animationType    : 'slide',
        animationDuration: 100
    },
    constructor: function (config) {
        this.initConfig(config);
        this.callParent([config]);
    },
    navigate   : function (navView, view) {
        navView.animateActiveItem(view, this.animationType);
    }
});