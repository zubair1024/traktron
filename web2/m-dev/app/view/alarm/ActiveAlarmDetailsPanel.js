Ext.define('Rms.view.alarm.ActiveAlarmDetailsPanel', {
    extend           : 'Ext.form.Panel',
    alias            : 'widget.active_alarm_details',
    requires         : ['Ext.TitleBar'],
    config           : {
        record    : null,
        scrollable: {
            direction: 'vertical'
        },
        items     : {
            xtype : 'toolbar',
            cls   : 'toolbar-title-font',
            docked: 'top',
            items : [
                {
                    text  : 'Back',
                    ui    : 'back',
                    itemId: 'back'
                }, {
                    xtype: 'spacer'
                }, {
                    xtype: 'button',
                    text : 'Options'
                }
            ]
        }
    },
    setRecords       : function (record) {

        var defaults = {
            xtype    : 'field',
            labelWrap: true,
            cls      : 'label-field'
        };
        this.getAt(0).setTitle(Ext.util.Format.ellipsis(record.get('name'), 10));
        var lastUpdatedTime;
        if (record.get('lastUpdatedTime')) {
            var iso = record.get('lastUpdatedTime');
            var isoArray = iso.split(" ");
            //Month
            var monthsArray = [/January/i, /February/i, /March/i, /April/i, /May/i, /June/i, /July/i, /August/i, /September/i, /October/i, /November/i, /December/i];
            for (var i = 0; i < (monthsArray.length); i++) {
                if (monthsArray[i].test(isoArray[0])) {
                    var month = i;
                }
            }
            //Day
            var day = isoArray[1].slice(0, 2);
            //Year
            var year = isoArray[2];
            //Time
            var time = isoArray[3].slice(0, 8);
            time = time.replace(".", "");
            //The date formatted in the ISO standard
            var isoDate = year + "-" + (month + 1) + "-" + day + "T" + time;
            var tempDate = isoDate.replace('T', ' ');
            var date = tempDate.replace(/-/g, '/');
            date = new Date(Date.parse(date));
            date.setMinutes(date.getMinutes() + App.config.user.timeZoneOffset);
            lastUpdatedTime = Ext.Date.format(date, App.config.user.dateTimeFormat);
        } else {
            lastUpdatedTime = App.config.blankSign;
        }
        //var defaults = {
        //    xtype: 'field',
        //    labelWrap: true,
        //    cls: 'label-field'
        //};
        //Displaying Alarmed Asset On Map
        var container = document.createElement('span');
        container.className = 'x-button x-button-action';
        container.style.height = '3em';
        container.innerText = record.get('position');
        container.onclick = function () {
            Ext.Ajax.request({
                async: false,
                url: App.config.serviceUrl + 'mobile/AssetType/',
                method: App.config.ajaxType,
                params: {
                    domainObjectId: record.get('assetID')
                },
                success: function (response) {
                    var data = JSON.parse(response.responseText);
                    Rms.app.getController('MapController').showSingleAlarmAssetOnMap(record,lastUpdatedTime,(data.domainObjectType).replace(/\s+/g, ''));
                }
            });
        };
        this.setItems({
            xtype   : 'fieldset',
            title   : 'Alarm Details',
            defaults: defaults,
            items   : [
                {
                    label: 'Alarm Name',
                    html : record.get('name')
                }, {
                    label: 'Asset Name',
                    html : record.get('asset')
                }, {
                    label: 'Description',
                    html : record.get('description')
                }, {

                    label: 'Position',
                    html : container
                }, {
                    label: 'Last Update Time',
                    html : lastUpdatedTime
                }
            ]
        });
    },
    addCommandOptions: function () {
        if (!this.commandOptions) {
            this.commandOptions = Ext.Viewport.add({
                xtype        : 'actionsheet',
                modal        : true,
                hideOnMaskTap: true,
                items        : [
                    {text: 'Acknowledge', itemId: 'acknowledge'},
                    {text: 'Reset', itemId: 'reset'}
                ]
            });
        }
        this.commandOptions.show();
    }
});
