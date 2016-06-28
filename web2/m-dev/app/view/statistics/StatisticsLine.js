Ext.define('Rms.view.statistics.StatisticsLine', {
    extend    : 'Ext.Panel',
    alias     : 'widget.statistics_line',
    requires  : [
        'Ext.chart.PolarChart',
        'Ext.chart.series.Pie',
        'Ext.chart.interactions.Rotate',
        'Ext.carousel.Carousel',
        'Ext.chart.CartesianChart',
        'Ext.chart.axis.Numeric',
        'Ext.chart.axis.Category',
        'Ext.chart.series.Bar',
        'Ext.chart.series.Line',
        'Ext.chart.interactions.PanZoom'
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
                        id   : 'statisticsLineBckBtn'
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
        me.complete = [];
        Ext.Ajax.request({
            url    : App.config.serviceUrl + 'rbireports/createReport',
            method : App.config.ajaxType,
            async  : false,
            params : {
                reportId          : reportType,
                lastSelectedObject: domainObjectId
            },
            success: function (response) {
                var data = Ext.decode(response.responseText);
                var row  = data.data.values;
                if (row.length > 0) {
                    var key;
                    for (var i in row[0]) {
                        key = i;
                    }
                    for (var y = 0; y < row.length; y++) {
                        var isoDate  = row[y].Time;
                        var tempDate = isoDate.replace('T', ' ');
                        var date     = new Date(tempDate.replace(/-/g, '/'));
                        date.setMinutes(date.getMinutes() + App.config.user.timeZoneOffset);
                        var dateTime = Ext.Date.format(date, App.config.user.dateTimeFormat);
                        //var time = dateTime.split(' ');
                        //time = time[1];
                        me.complete[y] = {
                            Time : dateTime,
                            value: row[y][key]
                        };
                    }
                    var title   = (key.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) {
                        return str.toUpperCase();
                    })).split(' ');
                    title       = title[0] + ' ' + title[1];
                    var maximum = data.data.metadata.ranges[3].to;
                    // Logger
                    //for(var z = 0; z < me.complete.length;z++){
                    //    console.log(me.complete[z].Time+' -> '+me.complete[z].value);
                    //    console.log(me.complete[z].Time);
                    //}
                    me.setItems(
                        {
                            xtype       : 'chart',
                            animate: true,
                            interactions: [{
                                type            : 'panzoom',
                                zoomOnPanGesture: true
                            }, {
                                type     : 'iteminfo',
                                listeners: {
                                    show: function (me, item, panel) {
                                        panel.getDockedItems()[0].setTitle("Info");
                                        panel.setHtml('<h3>' + title + '</h3><hr><span><b>' +
                                                      item.field.toUpperCase() + '</b> : '
                                                      + item.record.get(item.field) + '</span><br><span><b>TIME : </b>'
                                                      + item.record.get('Time') + '</span>');
                                    }
                                }
                            }],
                            store       : {
                                fields: ['Time', 'value'],
                                data  : me.complete
                            },
                            axes        : [{
                                type    : 'numeric',
                                position: 'left',
                                fields  : ['value'],
                                title   : {
                                    text    : title,
                                    fontSize: 15
                                },
                                grid    : {
                                    odd: {
                                        opacity       : 1,
                                        fill   : '#ddd',
                                        stroke : '#bbb',
                                        'stroke-width': 1.5
                                    }
                                },
                                minimum : 0,
                                maximum : maximum
                            }, {
                                type    : 'category',
                                position: 'bottom',
                                fields  : ['Time'],
                                title   : {
                                    text    : 'TIME',
                                    fontSize: 15
                                }
                            }],
                            series      : [{
                                type     : 'line',
                                highlight: {
                                    size  : 20,
                                    radius: 7
                                },
                                style    : {
                                    stroke: 'rgb(0,0,0)'
                                },
                                xField   : 'Time',
                                yField   : 'value',
                                marker   : {
                                    type     : 'path',
                                    path: ['M', -2, 0, 0, 2, 2, 0, 0, -2, 'Z'],
                                    stroke: 'red',
                                    lineWidth: 5
                                }
                            }, {
                                type     : 'line',
                                highlight: {
                                    size  : 20,
                                    radius: 7
                                },
                                fill     : true,
                                xField   : 'Time',
                                yField   : 'value',
                                marker   : {
                                    type     : 'circle',
                                    radius: 4,
                                    lineWidth: 0
                                }
                            }]
                        }
                    );
                } else {
                    Ext.Msg.alert('Alert', 'Data currently unavailable.');
                    Rms.app.getController('CommonController').statisticsBackBtn();
                }
            }
        });
        Ext.Viewport.setMasked(false);
    }
});