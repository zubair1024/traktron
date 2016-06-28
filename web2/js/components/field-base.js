/**
 * Created by zubair on 03-Dec-15.
 */

App.component.FieldBase = stampit()
    .props({
        /**
         * Base public variables
         */
        config: null,
        element: null,
        value: null,
        state: null,
        description: null

    }).methods({
        /**
         * Base public functions
         */
        getValue: function () {
            return this.element.value();
        },
        setValue: function (value) {
            this.element.value(value);
        },
        enable: function (state) {
            $(this.element).attr('disabled', state);
        },
        isVisible: function () {
            var me = this,
                visible = true;

            if (me.element.wrapper) {
                visible = me.element.wrapper.is(':visible');
            } else {
                visible = me.element.visible ? me.element.visible : $(me.element).is(':visible');
            }

            return visible;
        },
        show: function () {
            this.element.show();
        },
        hide: function () {
            this.element.hide();
        },
        renderTooltip: function () {

            var description = $('<span>', {
                'class': 'glyphicon glyphicon-question-sign',
                'data-toggle': 'tooltip',
                'title': this.description
            }).appendTo(this.config.container);
            // We need to define a separate tooltip here since the container of this dialog has a different z-index than the body.
            description.tooltip({container: this.config.refOwner.elDialogContent, placement: 'top'});
        }

    });
