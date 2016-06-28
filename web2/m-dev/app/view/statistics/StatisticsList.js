Ext.define('Rms.view.statistics.StatisticsList', {
    extend    : 'Ext.navigation.View',
    requires  : ['Ext.navigation.View'],
    alias     : 'widget.statistics_list',
    config    : {
        fullscreen: true,
        items     : [{
            xtype : 'toolbar',
            docked: 'top',
            title : 'Stats'
        }, {
            xtype : 'container',
            layout: 'vbox',
            title : 'Stats',
            items : []
        }]
    },
    initialize: function () {
        this.on('painted', this.showItems);
        this.getNavigationBar().hide();
    },
    showItems : function () {
        var me = this;
        Ext.Viewport.setMasked({
            xtype  : 'loadmask',
            message: 'Loading statistical data...'
        });
        Ext.Ajax.request({
            url    : App.config.serviceUrl + 'rbireports/availableReports',
            method : App.config.ajaxType,
            async  : false,
            params : {
                domainObjectType: 'customer'
            },
            success: function (response) {
                var data = Ext.decode(response.responseText);
                //This has to be done on the back-end
                data.reports[data.reports.length] = {
                    name              : 'Live Asset Status',
                    id                : 'liveAssetStatus',
                    supportedViewTypes: ['pie']
                };
                me.setItems(
                    {
                        xtype    : 'list',
                        id   : 'statistics_list',
                        flex : 1,
                        listeners: {
                            order  : 'after',
                            painted: function () {
                                Ext.Viewport.setMasked(false);
                            }
                        },
                        store    : {
                            fields: ['name', 'supportedViewTypes'],
                            data  : data.reports
                        },
                        //itemTpl: '<span class="iconlist ao-{this.setIcon}">{name}'
                        itemTpl  : Ext.create('Ext.XTemplate',
                            '<span class="iconlist ao-{[this.setIcon(values.supportedViewTypes)]}">{name}', {
                                setIcon: function (icon) {
                                    return icon[0]
                                }
                            }
                        )
                    }
                );
            },
            failure: function () {
                me.setItems({
                    html            : '<h3>Unable to retrieve data from the server.</h3>',
                    styleHtmlContent: true
                });
                Ext.Viewport.setMasked(false);
            }
        });
    }
});