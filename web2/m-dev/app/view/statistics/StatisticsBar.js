Ext.define('Rms.view.statistics.StatisticsBar', {
    extend: 'Ext.Panel',
    alias: 'widget.statistics_bar',
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
                        id: 'statisticsBarBckBtn'
                    }
                ]
            }
        ]
    },
    updateData: function (record) {
        var me = this;
        //loadmask
        Ext.Viewport.setMasked({
            xtype: 'loadmask',
            message: 'Loading statistical data...'
        });
        me.temp = [];
        me.tempRow = [];
        me.tempCol = [];
        me.complete = [];
        me.nameArray = [];
        me.nameArraydecap = [];
        Ext.Ajax.request({
            url: App.config.serviceUrl + 'rbireports/createReport',
            method: App.config.ajaxType,
            async: false,
            params: {
                reportId: record.get('id'),
                lastSelectedObject: App.config.rootDomainObjectId
            },
            success: function (response) {
                var data = Ext.decode(response.responseText);
                var metaRows = data.data.metadata.rows;
                var rows = data.data.tabledata.rows;
                var columns = data.data.metadata.columns;
                for (var i = 0; i < rows.length; i++) {
                    me.temp[i] = metaRows[i][0];
                    me.tempRow[i] = (Number(rows[i][0]));
                    me.tempCol[i] = Number(rows[i][1]);
                    me.complete[i] = {};
                    me.nameArray = ['name'];
                    me.complete[i].name = me.temp[i];
                    for (var j = 0; j < columns.length; j++) {
                        me.nameArray[me.nameArray.length] = columns[j][0];
                        me.complete[i][columns[j]] = Number(rows[i][j]);
                    }
                }
                me.nameArraydecap= me.nameArray.slice();
                me.nameArraydecap.splice(0,1);
                var isoDate = data.data.metadata.lastUpdateTime;
                var tempDate = isoDate.replace('T', ' ');
                var date = new Date(tempDate.replace(/-/g, '/'));
                date.setMinutes(date.getMinutes() + App.config.user.timeZoneOffset);
                var lastUpdatedTime= Ext.Date.format(date, App.config.user.dateTimeFormat);
                me.setItems(
                    {
                        xtype: 'chart',
                        legend: {
                            position: 'top'
                        },
                        listeners:{
                            order: 'after',
                            painted: function(){
                                Ext.Viewport.setMasked(false);
                            }
                        },
                        stacked: false,
                        flipXY: false,
                        interactions: [{
                            type: 'panzoom',
                            zoomOnPanGesture: true
                        },{
                            type: 'iteminfo',
                            listeners: {
                                show: function(me, item, panel) {
                                    panel.getDockedItems()[0].setTitle("Info");
                                    panel.setHtml('<h3>'+item.record.get('name')+'</h3><hr>' +
                                                  '<span><b>'+item.field.toUpperCase()+'</b> : '+item.record.get(item.field)+'</span>' +
                                                  '<br><span><b>'+lastUpdatedTime+'</b></span>');
                                }
                            }
                        }],
                        store: {
                            fields: me.nameArray,
                            data: me.complete
                        },
                        axes: [
                            {
                                type: 'numeric',
                                position: 'left',
                                grid: true,
                                minimum: 0
                            },
                            {
                                type: 'category',
                                position: 'bottom',
                                title: {
                                    text: record.get('name'),
                                    fontSize: 15
                                }
                            }
                        ],
                        //define the actual bar series.
                        series: [
                            {
                                type: 'bar',
                                stacked: false,
                                xField: 'name',
                                yField: me.nameArraydecap,
                                axis: 'left',
                                subStyle: {
                                    fill: ["#115fa6", "#ff8809",'#33CC33','#990099','#003366','#FF3300','#663300','#FF33CC','#00FFFF','#FF9933']
                                }
                            }
                        ]
                    }
                );
            },
            error: function(response, request) {
                alert('failed');
            }
        });
        //Ext.Viewport.setMasked(false);
    }
});