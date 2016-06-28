/**
 * Created by zubair on 27-Nov-15.
 */

App.component.Mutiselect = stampit.compose(App.component.FieldBase, stampit()
    .props({
        config: null
    })
    .methods({
        renderTooltip: function () {
            //Temporarily removed

            // if (this.config.description) {
            //     this.description = $('<span>', {
            //         'class'      : 'glyphicon glyphicon-question-sign',
            //         'data-toggle': 'tooltip',
            //         'style'      : 'float:right',
            //         'title'      : this.config.description
            //     }).appendTo(this.config.container);
            //
            //     // We need to define a separate tooltip here since the container of this dialog has a different z-index than the body.
            //     this.description.tooltip({container: this.config.refOwner.elDialogContent});
            // }
        }
    })
    /**
     * Initializer
     */
    .init(function () {
        var me     = this,
            element,
            config = this.config;

        //noinspection JSUnresolvedVariable
        if (config.isHierarchical) {
            //noinspection JSValidateTypes
            element = new App.ui.SelectionTree({
                renderTo  : config.container,
                valueField: 'displayValue',
                data      : config.availableValues,
                selected  : config.currentValues,
                multi     : config.hasMultipleValueSupport
            });
        } else {

            // Render multiselect
            //noinspection JSValidateTypes
            element = new App.ui.Multiselect({
                valueField: 'displayValue',
                idField   : 'baseValue',
                dataModel : {id: 'baseValue'},
                renderTo  : config.container,
                data      : config.availableValues,
                leftLabel : App.translate('Available'),
                rightLabel: App.translate('Selected'),
                maxValue  : config.maxValue,
                required  : config.isMandatory
            });
            element.render();
            element.setSelected(config.currentValues);
        }

        me.element = element;

    }));