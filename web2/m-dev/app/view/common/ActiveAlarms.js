Ext.define('Rms.view.common.ActiveAlarms', {
    extend       : 'Ext.Panel',
    alias        : 'widget.active_alarms_list',
    config       : {
        store : null,
        layout: 'fit',
        items : {
            xtype : 'toolbar',
            docked: 'top',
            cls   : 'toolbar-title-font',
            items : [
                {
                    text  : 'Back',
                    ui    : 'back',
                    itemId: 'back'
                }
            ]
        }
    },
    showAlarmList: function (alarmStore, decision) {
        this.setItems({
            xtype  : 'list',
            store  : alarmStore,
            //plugins: [
            //    {
            //        xclass   : 'Ext.ux.touch.PullRefreshFn',
            //        pullText : 'Pull down to refresh the Alarm list!',
            //        refreshFn: function () {
            //            var store = this.getList().getStore();
            //            store.currentPage = 1;
            //            store.load();
            //        }
            //    }
            //],
            itemTpl: decision
                ? '<div>{asset}</div>'
                : '<div>{name}</div>'
        });
    }
});