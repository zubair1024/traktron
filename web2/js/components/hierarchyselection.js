/**
 * Created by zubair on 26-Dec-15.
 */

App.component.HierarchySelection = stampit.compose(App.component.FieldBase, stampit()
    .props({
        config: null
    }).methods({
        setIds  : function (items, ids) {
            'use strict';

            if (Array.isArray(items) && Array.isArray(ids)) {
                for (var i = 0; i < items.length; i++) {
                    items[i].checked = ids.indexOf(items[i].id) > -1;

                    if (items[i].items) {
                        this.setIds(items[i].items, ids);
                    }
                }
            }
        },
        getIds: function (nodes, ids) {
            'use strict';

            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].checked && nodes[i].id) {
                    var idChain = nodes[i].id.split(App.config.idDivider);
                    if (idChain && idChain.length === 2) {
                        ids.push(idChain[1]);
                    }
                }

                // Marshall tree.
                if (nodes[i].hasChildren) {
                    this.getIds(nodes[i].children.view(), ids);
                }
            }
            return ids;
        },
        /**
         * Used by the field util class as value getter.
         * @returns {*}
         */
        getValue: function () {
            'use strict';

            return this.getIds(this.tree.dataSource.view(), []);
        },
        renderTooltip: function () {
            //do nothing for now
        }
    })
    /**
     * Initializer
     */
    .init(function () {
            var me        = this,
                container = $('<div>').appendTo(me.config.container);

            me.config = $.extend({
                currentValues    : me.config.currentValues,
                domainObjectId: me.config.objectId,
                domainObjectType: me.config.objectType,
                domainObjectTypes: me.config.domainObjectTypes,
                refOwner         : me.config.refOwner
            }, me.config);

            if (me.config.refOwner && me.config.refOwner.showBusy) {
                me.config.refOwner.showBusy();
            }

        if (DEBUG) {
            console.time('hierarchySelection datasource loading time');
        }

        //noinspection JSUnresolvedFunction
            me.tree = container.kendoTreeView({
                checkboxes  : {
                    checkChildren: true
                },
                dataSource: {
                    transport : {
                        read: {
                            url : App.config.serviceUrl + 'caesarOrganizationStructure/fullStructure',
                            data: {
                                domainObjectId   : me.config.domainObjectId,
                                domainObjectType: me.config.domainObjectType,
                                domainObjectTypes: JSON.stringify(me.config.domainObjectTypes)
                            }
                        }
                    },
                    requestEnd: function (e) {
                        me.setIds(e.response, me.config.currentValues);

                        if (DEBUG) {
                            console.timeEnd('hierarchySelection datasource loading time');
                        }

                        // Hide spinner
                        if (me.config.refOwner && me.config.refOwner.hideBusy) {
                            me.config.refOwner.hideBusy();
                        }
                    },
                    schema    : {
                        model: {
                            id      : 'domainObjectTypeId',
                            children: 'items'
                        }
                    }
                },
                dataBound: function (e) {
                    // Expand first level
                    e.sender.expand('.k-item:first');
                    try {
                        e.sender.updateIndeterminate(e.node);
                    }
                    catch (er) {
                        console.log(er);
                    }
                },
                loadOnDemand: false,
                template    : '<span class="treeview-node-indented ao-16px #=App.util.format.domainObjectTypeIcon(item.domainObjectType)#" ' +
                              'title="#=App.util.format.domainObjectType(item.domainObjectType)#: #=item.name#">' +
                              '#: App.translate(item.name) #</span>'
            }).data('kendoTreeView');

        }
    ));