Ext.define('Rms.view.common.CommandListPanel', {
    extend  : 'Ext.Panel',
    alias   : 'widget.command_list',
    config  : {
        store     : null,
        layout    : {
            type: 'vbox'
        },
        defaults  : {
            xtype: 'button'
        },
        scrollable: {
            direction    : 'vertical',
            directionLock: true
        },
        items     : {
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
    addItems: function (commandCodeArray, commandValueArray) {
        this.removeAll();
        for (var i = 0; i < commandValueArray.length; i++) {
            var cmd = commandValueArray[i];
            this.add({
                text       : cmd,
                margin     : '10 10 0 10',
                commandCode: commandCodeArray[i]
            });
        }
    }
});