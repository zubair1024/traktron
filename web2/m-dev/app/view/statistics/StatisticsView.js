Ext.define('Rms.view.statistics.StatisticsView', {
    extend  : 'Ext.Panel',
    alias   : 'widget.statistics_view',
    requires: [],
    config  : {
        store             : null,
        id                : 'statsview',
        assetsInGroupStore: null,
        layout            : {
            type     : 'card',
            animation: {type: 'fade', direction: 'left'}
        },
        items             : [
            {
                xtype: 'statistics_list',
                id   : 'stats_list'
            },
            {
                xtype: 'statistics_bar',
                id   : 'barView'
            },
            {
                xtype: 'statistics_line',
                id   : 'lineView'
            },
            {
                xtype: 'statistics_pie',
                id   : 'pieView'
            },
            {
                xtype: 'statistics_gauge',
                id   : 'gaugeView'
            }
        ]
    }
});