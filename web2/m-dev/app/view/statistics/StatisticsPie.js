Ext.define('Rms.view.statistics.StatisticsPie', {
    extend: 'Ext.Panel',
    alias: 'widget.statistics_pie',
    requires: [
        'Ext.chart.PolarChart',
        'Ext.chart.series.Pie',
        'Ext.chart.interactions.Rotate',
        'Ext.carousel.Carousel',
        'Ext.chart.CartesianChart',
        'Ext.chart.axis.Numeric',
        'Ext.chart.axis.Category',
        'Ext.chart.series.Bar',
        'Ext.chart.series.Line',
        'Ext.chart.interactions.PanZoom',
        'Ext.chart.interactions.ItemInfo'
    ],
    config: {
        store: null,
        assetsInGroupStore: null,
        layout: 'card',
        items: [
            {
                xtype: 'toolbar',
                docked: 'top',
                items: [
                    {
                        xtype: 'button',
                        text: 'Back',
                        ui: 'back',
                        id: 'statisticsPieBckBtn'
                    }
                ]
            }
        ]
    },
    updateData: function (record, domainObjectId) {
        var me = this;
        Ext.Viewport.setMasked({
            xtype: 'loadmask',
            message: 'Loading statistical data...'
        });
        var complete = [];
        var oneColumn = true;
        var data;
        if (record.get('id') == 'liveAssetStatus') {
            oneColumn = true;
            var normal = 0;
            var idling = 0;
            var notMoving = 0;
            var notOperational = 0;
            var assetStore = Ext.getStore('assetStore');
            assetStore.each(function (record) {
                var state = record.get('assetStatus');
                switch (state) {
                    case'normal':
                        ++normal;
                        break;
                    case 'idling':
                        ++idling;
                        break;
                    case 'notOperational':
                        ++notOperational;
                        break;
                    case 'notMoving':
                        ++notMoving;
                        break;
                }
            });
            complete = [{
                'name': 'Normal (' + normal + ')',
                'data1': normal
            },
                {
                    'name': 'Idle (' + idling + ')',
                    'data1': idling
                },
                {
                    'name': 'Not Operational (' + notOperational + ')',
                    'data1': notOperational
                },
                {
                    'name': 'Not Moving (' + notMoving + ')',
                    'data1': notMoving
                }
            ]

        } else {
            Ext.Ajax.request({
                url: App.config.serviceUrl + 'rbireports/createReport',
                method: App.config.ajaxType,
                async: false,
                params: {
                    reportId: record.get('id'),
                    lastSelectedObject: domainObjectId
                },
                success: function (response) {
                    data = Ext.decode(response.responseText);
                    if (data.data.metadata.rows.length > 1) {
                        oneColumn = false;
                    }
                    for (var i = 0; i < data.data.metadata.columns.length; i++) {
                        complete[i] = {
                            'name': data.data.metadata.columns[i][0] + ' (' + data.data.tabledata.rows[0][i] + ')',
                            data1: data.data.tabledata.rows[0][i]
                        };
                    }
                }
            });
        }
        if (oneColumn) {
            this.setItems({
                xtype: 'polar',
                id:'pie',
                shadow: true,
                theme: 'Base:gradients',
                showInLegend: true,
                animate: true,
                interactions: ['rotate'],
                colors: ["#115fa6", "#94ae0a", "#a61120", "#ff8809", "#ffd13e"],
                store: {
                    fields: ['name', 'data1'],
                    data: complete
                },
                legend: {
                    docked: 'top',
                    verticalWidth: 100
                },
                series: [{
                    type: 'pie',
                    showInLegend: true,
                    labelField: 'name',
                    xField: 'data1',
                    tips: {
                        trackMouse: true,
                        width: 140,
                        height: 28,
                        renderer: function (storeItem, item) {
                            //calculate percentage.
                            var total = 0;
                            store1.each(function (rec) {
                                total += rec.get('data1');
                            });
                            this.setTitle(storeItem.get('name') + ': ' + Math.round(storeItem.get('data1') / total * 100) + '%');
                        }
                    },
                    interactions: [{
                        type: 'panzoom',
                        zoomOnPanGesture: true
                    }, {
                        type: 'iteminfo',
                        listeners: {
                            show: function (me, item, panel) {
                                panel.getDockedItems()[0].setTitle("Info");
                                panel.setHtml('<h3>' + title + '</h3><hr><span><b>' + item.field.toUpperCase() + '</b> : ' + item.record.get(item.field) + '</span><br><span><b>TIME : </b>' + item.record.get('Time') + '</span>');
                            }
                        }
                    }],

                    highlight: {
                        segment: {
                            margin: 20
                        }
                    },
                    label: {
                        field: 'name',
                        display: 'rotate',
                        contrast: true,
                        font: '18px Arial'
                    }
                }]
            });
            var pie = Ext.getCmp('pie');
        }
        else{
            me.setItems({
                xtype:'carousel',
                id:'myCarousel',
                fullscreen: true,
                defaults: {
                    styleHtmlContent: true
                } // defaults
            });
            var carousel = Ext.getCmp('myCarousel');
            for(var j = 0; j< data.data.metadata.columns.length; j++ ){
                for (var i = 0; i < data.data.metadata.rows.length; i++) {
                    complete[i] = {
                        'name': data.data.metadata.rows[0][i] + ' (' + data.data.tabledata.rows[j][i] + ')',
                        data1: data.data.tabledata.rows[j][i]
                    };
                }
                carousel.add({
                    xtype: 'polar',
                    html:'<h3>'+(data.data.metadata.columns[j][0]).replace('Count','')+'</h3>',
                    shadow: true,
                    theme: 'Base:gradients',
                    showInLegend: false,
                    animate: true,
                    interactions: ['rotate'],
                    colors: ["#115fa6", "#94ae0a", "#a61120", "#ff8809", "#ffd13e"],
                    store: {
                        fields: ['name', 'data1'],
                        data: complete
                    },
                    //legend: {
                    //    docked: 'top',
                    //    verticalWidth: 100
                    //},
                    series: [{
                        type: 'pie',
                        showInLegend: false,
                        labelField: 'name',
                        xField: 'data1',
                        tips: {
                            trackMouse: true,
                            width: 140,
                            height: 28,
                            renderer: function (storeItem, item) {
                                //calculate percentage.
                                //var total = 0;
                                //store1.each(function (rec) {
                                //    total += rec.get('data1');
                                //});
                                //this.setTitle(storeItem.get('name') + ': ' + Math.round(storeItem.get('data1') / total * 100) + '%');
                            }
                        },
                        //interactions: [{
                        //    type: 'panzoom',
                        //    zoomOnPanGesture: true
                        //}, {
                        //    type: 'iteminfo',
                        //    listeners: {
                        //        show: function (me, item, panel) {
                        //            panel.getDockedItems()[0].setTitle("Info");
                        //            panel.setHtml('<h3>' + title + '</h3><hr><span><b>' + item.field.toUpperCase() + '</b> : ' + item.record.get(item.field) + '</span><br><span><b>TIME : </b>' + item.record.get('Time') + '</span>');
                        //        }
                        //    }
                        //}],
                        //donut: 30,
                        highlight: {
                            segment: {
                                margin: 20
                            }
                        },
                        label: {
                            field: 'name',
                            display: 'rotate',
                            contrast: true,
                            font: '18px Arial'
                        }
                    }]
                });
            }

        }
        Ext.Viewport.setMasked(false);
    }
});