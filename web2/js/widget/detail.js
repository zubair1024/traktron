/**
 * Displays detail widget.
 */
App.widget.Detail = App.widget.Base.extend({
    widgetData : null,
    sectionData: {},
    values     : [],
    init       : function (config) {
        'use strict';

        var me = this;

        me.config      = $.extend({}, config);

        me.setWidgetData();
        me.sectionData = {};

        /**
         * Remember which domainObjectValues to query by objectDataProvider3.
         * @type {Array}
         */
        me.values = [];

        var lastSection = null;
        for (var i = 0; i < me.widgetData.data.length; i++) {
            var item = me.widgetData.data[i];
            if (item.selected) {
                if (item.section !== lastSection) {
                    lastSection = item.section;
                    if (!me.sectionData[item.section]) {
                        me.sectionData[item.section] = [];
                    }
                }
                me.sectionData[item.section].push(item);
                me.values.push(item.domainObjectValueId);
            }
        }
    },
    load       : function () {
        'use strict';

        var me = this;

        me.isRefreshing = true;
        this.jqXHR      = $.ajax({
            url    : App.config.serviceUrl + 'caesarObject/objectDataProvider3',
            data   : {
                domainObjectId    : me.config.domainObjectId,
                domainObjectValues: JSON.stringify(me.values),
                domainObjectType  : me.config.objectType,
                domainDataView    : me.widgetData.viewType
            },
            success: function (response) {
                var html = '';

                /**
                 * Iterate over the rows.
                 * For the detail view, there should be only one row... but who knows?
                 */
                for (var i = 0; i < response.ui.items.length; i++) {
                    var row    = response.ui.items[i],
                        fields = {}
                        ;

                    /**
                     * Collect all fields in the sub sections.
                     */
                    for (var j = 0; j < row.items.length; j++) {
                        for (var k = 0; k < row.items[j].items.length; k++) {
                            var r        = row.items[j].items[k];
                            fields[r.id] = r;
                        }
                    }

                    /**
                     * Iterate over the widget configuration.
                     */
                    for (var key in me.sectionData) {
                        if (me.sectionData.hasOwnProperty(key)) {
                            html += '<h5 class="details-header">' + App.translate(key) + '</h5>';
                            html += '<dl class="dl-horizontal">';

                            for (var l = 0; l < me.sectionData[key].length; l++) {
                                var sectionItem = me.sectionData[key][l];

                                /** @namespace item.domainObjectType */
                                /** @namespace item.domainObjectId */
                                var item = fields[sectionItem.domainObjectValueId];

                                if (item) {
                                    // Augment domainObjectType and domainObjectId if not defined.
                                    item.domainObjectType = item.domainObjectType || me.config.objectType;
                                    item.domainObjectId   = item.domainObjectId || me.config.domainObjectId;

                                    html += '<dt>' + App.translate(sectionItem.domainObjectValueName) + '</dt>';
                                    html += '<dd>' + App.translate(App.util.format.item(item)) + '</dd>';
                                } else {
                                    console.error('App.widget.Detail: domainObjectValue "' + sectionItem.domainObjectValueId + '" not found in server response.');
                                }
                            }

                            html += '</dl>';
                        }
                    }
                }

                me.config.el.addClass('widget-detail');
                me.config.el.html(html);

                me.lastRefresh  = Date.now();
                me.isRefreshing = false;
            }
        });

        return this.jqXHR;
    },
    refresh    : function () {
        'use strict';
        return this.load();
    },
    destroy    : function () {
        // Stop Ajax call - only if not uninitialized (0) or finished (4).
        if (this.jqXHR && this.jqXHR.readyState !== 4 && this.jqXHR.readyState !== 0) {
            this.jqXHR.abort();
            this.jqXHR = null;
        }
        // ...and remove element from DOM.
        if (this.config.el) {
            this.config.el.remove();
        }
    }
});
