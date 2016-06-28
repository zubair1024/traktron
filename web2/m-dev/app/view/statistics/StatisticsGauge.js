Ext.define('Rms.view.statistics.StatisticsGauge', {
    extend    : 'Ext.Panel',
    alias     : 'widget.statistics_gauge',
    requires  : [
        'Ext.chart.PolarChart',
        'Ext.chart.series.Gauge',
        'Ext.chart.SpaceFillingChart'
    ],
    config    : {
        store             : null,
        assetsInGroupStore: null,
        layout            : 'card',
        items             : [
            {
                xtype : 'toolbar',
                docked: 'top',
                items : [
                    {
                        xtype: 'button',
                        text : 'Back',
                        ui   : 'back',
                        id   : 'statisticsGaugeBckBtn'
                    }
                ]
            }
        ]
    },
    updateData: function (domainObjectId, reportType) {
        var me = this;
        Ext.Viewport.setMasked({
            xtype  : 'loadmask',
            message: 'Loading statistical data...'
        });
        Ext.Ajax.request({
            url    : App.config.serviceUrl + 'rbireports/createReport',
            method : App.config.ajaxType,
            async  : false,
            params : {
                reportId          : reportType,
                lastSelectedObject: domainObjectId
            },
            success: function (response) {
                var data   = (Ext.decode(response.responseText)).data;
                me.sectors = [];
                if (data.value) {
                    for (var i = 0; i < data.metadata.ranges.length; i++) {
                        me.sectors[i] = {
                            end  : data.metadata.ranges[i].to,
                            label: data.metadata.ranges[i].type
                        };
                    }
                    me.setItems(
                        {
                            xtype  : 'spacefilling',
                            animate: {
                                easing  : 'elasticIn',
                                duration: 1000
                            },
                            sprites: [{
                                type     : 'text',
                                x        : 50,
                                y        : 50,
                                text     : 'Value: ' + data.value,
                                fontSize : 18,
                                fillStyle: '#000'
                            }],
                            series : [
                                {
                                    type        : 'gauge',
                                    value       : data.value,
                                    needle      : true,
                                    showInLegend: true,
                                    minimum     : data.metadata.min,
                                    maximum     : data.metadata.max,
                                    colors      : ['#EFEFF1', '#157EFB', '#FDBC38', '#FC6B20', '#B20010'],
                                    sectors     : me.sectors,
                                    donut       : 60,
                                    style       : {
                                        miterLimit: 10,
                                        lineCap   : 'miter',
                                        lineWidth : 2
                                    }
                                }
                            ]
                        }
                    );
                } else {
                    Ext.Msg.alert('Alert', 'Data currently unavailable.');
                    Rms.app.getController('AssetController').domainObjectId = null;
                    Rms.app.getController('CommonController').statisticsBackBtn();
                }
            }
        });
    }
})
;