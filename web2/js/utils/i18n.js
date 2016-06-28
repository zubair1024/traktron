/**
 * Namespace for translation related functions.
 * @type {{phrases: {}, rtl: boolean, debugFormatOK: string, debugFormatNOK: string, load: Function, update: Function, translateContent: Function, debug: {nok: Array, ok: Array, show: Function}}}
 */
App.i18n = {

    /**
     * The dictionary for the current culture
     */
    phrases: {},

    /**
     * List available cultures in user settings.
     * @see http://docs.telerik.com/kendo-ui/framework/globalization/definecultureinfo
     */
    cultures: {
        'ar'   : 'Arabic',
        'en'   : 'English',
        'fr'   : 'French',
        'es'   : 'Spanish',
        'ar-DZ': 'Arabic - Algeria',
        'ar-BH': 'Arabic - Bahrain',
        'ar-EG': 'Arabic - Egypt',
        'ar-IQ': 'Arabic - Iraq',
        'ar-JO': 'Arabic - Jordan',
        'ar-KW': 'Arabic - Kuwait',
        'ar-LB': 'Arabic - Lebanon',
        'ar-LY': 'Arabic - Libya',
        'ar-MA': 'Arabic - Morocco',
        'ar-OM': 'Arabic - Oman',
        'ar-QA': 'Arabic - Qatar',
        'ar-SA': 'Arabic - Saudi Arabia',
        'ar-SY': 'Arabic - Syria',
        'ar-TN': 'Arabic - Tunisia',
        'ar-AE': 'Arabic - United Arab Emirates',
        'ar-YE': 'Arabic - Yemen',
        'en-AU': 'English - Australia',
        'en-BZ': 'English - Belize',
        'en-CA': 'English - Canada',
        'en-HK': 'English - Hong Kong',
        'en-IE': 'English - Ireland',
        'en-IN': 'English - India',
        'en-JM': 'English - Jamaica',
        'en-MY': 'English - Malaysia',
        'en-NZ': 'English - New Zealand',
        'en-PH': 'English - Philippines',
        'en-SG': 'English - Singapore',
        'en-ZA': 'English - South Africa',
        'en-TT': 'English - Trinidad and Tobago',
        'en-GB': 'English - United Kingdom',
        'en-US': 'English - United States',
        'en-ZW': 'English - Zimbabwe',
        'fr-BE': 'French - Belgium',
        'fr-CM': 'French - Cameroon',
        'fr-CA': 'French - Canada',
        'fr-CD': 'French - Congo',
        'fr-FR': 'French - France',
        'fr-HT': 'French - Haiti',
        'fr-CI': 'French - Ivory Coast',
        'fr-LU': 'French - Luxembourg',
        'fr-ML': 'French - Mali',
        'fr-MA': 'French - Morocco',
        'fr-MC': 'French - Principality of Monaco',
        'fr-RE': 'French - Réunion',
        'fr-SN': 'French - Senegal',
        'fr-CH': 'French - Switzerland',
        'de-AT': 'German - Austria',
        'de-DE': 'German - Germany',
        'de-LI': 'German - Liechtenstein',
        'de-LU': 'German - Luxembourg',
        'de-CH': 'German - Switzerland',
        'es-AR': 'Spanish - Argentina',
        'es-BO': 'Spanish - Bolivia',
        'es-CL': 'Spanish - Chile',
        'es-CO': 'Spanish - Colombia',
        'es-CR': 'Spanish - Costa Rica',
        'es-DO': 'Spanish - Dominican Republic',
        'es-EC': 'Spanish - Ecuador',
        'es-SV': 'Spanish - El Salvador',
        'es-GT': 'Spanish - Guatemala',
        'es-HN': 'Spanish - Honduras',
        'es-MX': 'Spanish - Mexico',
        'es-NI': 'Spanish - Nicaragua',
        'es-PA': 'Spanish - Panama',
        'es-PY': 'Spanish - Paraguay',
        'es-PE': 'Spanish - Peru',
        'es-PR': 'Spanish - Puerto Rico',
        'es-ES': 'Spanish - Spain',
        'es-US': 'Spanish - United States',
        'es-UY': 'Spanish - Uruguay',
        'es-VE': 'Spanish - Venezuela'
    },

    /**
     * Text direction. True for right-to-left, false for left-to-right.
     */
    rtl: false,

    /**
     * If string is not found, then the string formatted a special way to identify it on the screen (debug mode only).
     */
    debugFormatOK : '*{0}*',
    debugFormatNOK: '[[{0}]]',

    // No init handler necessary since this is only a tool class
    // init: function() {}

    /**
     * Load language strings from backend.
     * @param language {string} ISO 639, eg. en, ar, fr, es, etc.
     * @param onSuccess {Function} Callback
     */
    load: function (language, onSuccess) {
        'use strict';

        if (DEBUG) console.time('Language initialization');

        var me = this,
            url = 'dist/locales/' + language + '.min.json';

        $.ajax({
            dataType: 'json',
            url: url,
            method: 'GET',
            success: function (response) {
                if (response.phrases) {
                    me.phrases = response.phrases;
                }
                me.rtl = (response.direction === 'rtl');

                if ($.isFunction(onSuccess)) {
                    onSuccess();
                }
                if (DEBUG) console.timeEnd('Language initialization');
            }
        });
    },

    /**
     * Changes current culture and translates all content of the site.
     * @param culture
     * @param callback
     */
    update: function (culture, callback) {
        'use strict';

        var onLoad = function () {

            // Set culture.
            kendo.culture(culture);

            // Translate marked text nodes
            $('[data-phrase]').each(function () {
                $(this).text(App.translate($(this).attr('data-phrase')));
            });

            // Translate titles - mainly for Bootstrap's tooltips.
            $('[title]').each(function () {
                $(this).attr('title', App.translate($(this).attr('title')));
            });

            // Translate "placeholder" attribute in all elements
            $('[placeholder]').each(function () {

                // Store original value in data attribute
                if (!$(this).data('placeholder')) {
                    $(this).data('placeholder', $(this).attr('placeholder'));
                }
                var msg = $(this).data('placeholder');
                $(this).attr('placeholder', App.translate(msg));
            });

            // Translate validation messages
            $('[validationMessage]').each(function () {

                // Store original value in data attribute
                if (!$(this).data('validationMessage')) {
                    $(this).data('validationMessage', $(this).attr('validationMessage'));
                }
                var msg = $(this).data('validationMessage');
                $(this).attr('validationMessage', App.translate(msg));
            });

            // We have also some validation messages here:
            $.each(App.util.forms.validator.messages, function (key, message) {
                App.util.forms.validator.messages[key] = App.translate(message);
            });

            // Adjust text direction
            if (App.i18n.rtl) {
                $('body').addClass('k-rtl');

                // Adjust Bootstrap's tooltip alignment for the navigation tree:
                App.view.navigationArea.data('bs.tooltip')._options.placement = 'left';

                if (DEBUG) {
                    if ($('head link#rtl').length) {
                        $('head link#rtl').prop('disabled', false);
                    } else {
                        $('head')
                            .append('<link href="css/kendo/kendo.rtl.min.css" rel="stylesheet">')
                            .append('<link href="css/rtl.css" rel="stylesheet" id="rtl">');
                    }
                } else {
                    $('head').append('<link href="dist/rtl.css" rel="stylesheet" id="rtl">');
                }
            } else {
                $('body').removeClass('k-rtl');
                $('head link#rtl').prop('disabled', true);
            }

            if ($.isFunction(callback)) {
                callback();
            }
        };

        // Check if culture has been loaded already. If not, load it.
        if (culture && !kendo.cultures.hasOwnProperty(culture)) {
            $.ajax({
                url     : 'js/lib/kendo/cultures/kendo.culture.' + culture + '.min.js',
                complete: onLoad,
                dataType: 'script',
                type    : 'GET'
            });
        } else {
            onLoad();
        }
    },

    /**
     * Translate all static strings in the jQuery Object
     * @param {jQuery} element
     * @returns {jQuery}
     */
    translateContent: function (element) {
        'use strict';

        // Translate marked text nodes.
        element.find('[data-phrase]').each(function () {
            $(this).text(App.translate($(this).attr('data-phrase')));
        });

        // Translate titles in all elements - mainly for Bootstrap's tooltips.
        element.find('[title]').each(function () {
            $(this).attr('title', App.translate($(this).attr('title')));
        });

        // Translate "placeholder" attribute in all elements.
        element.find('[placeholder]').each(function () {

            // Store original value in data attribute
            if (!$(this).data('placeholder')) {
                $(this).data('placeholder', $(this).attr('placeholder'));
            }
            var msg = $(this).data('placeholder');
            $(this).attr('placeholder', App.translate(msg));
        });

        // Translate validation messages.
        element.find('[validationMessage]').each(function () {

            // Store original value in data attribute
            if (!$(this).data('validationMessage')) {
                $(this).data('validationMessage', $(this).attr('validationMessage'));
            }
            var msg = $(this).data('validationMessage');
            $(this).attr('validationMessage', App.translate(msg));
        });

        return element;
    },

    debug      : {
        nok: [],
        ok : [],

        /**
         * Open a Kendo window that lists all strings that have NOT been translated.
         * @param {string=} mode
         */
        show: function (mode) {
            'use strict';

            var phrases = [],
                title   = '';

            switch (mode) {
                case 'ok':
                    title   = '"ok" - translations found';
                    phrases = App.i18n.debug.ok;
                    break;
                case 'nok':
                    title   = '"nok" - translations not found';
                    phrases = App.i18n.debug.nok;
                    break;
                default :
                case 'all':
                    title   = '"all" - translations used';
                    phrases = App.i18n.debug.ok.concat(App.i18n.debug.nok);
            }
            // Sort array beforehand.
            phrases.sort();

            var s = '<ul>';
            for (var i = 0, len = phrases.length; i < len; i++) {
                s += '<li>' + phrases[i] + '</li>';
            }
            s += '</ul>';
            var div = $('<div>', {
                id  : 'i18n-log',
                html: s
            });
            //noinspection JSUnresolvedFunction
            var win = div.kendoWindow({
                width  : 300,
                height : App.config.widgetHeight,
                title  : title,
                visible: false,
                actions: [
                    'Pin',
                    'Minimize',
                    'Maximize',
                    'Close'
                ]
            }).data('kendoWindow');
            win.center().open();
        }
    },
    /**
     * Augment some i18n related items in the use settings:
     * - add cultures to culture field
     * - add measurementSystem dropDown
     * @param item
     */
    addControls: function (item) {
        var result = false;
        switch (item.id) {
            case 'culture':
                item.availableValues = [];
                $.each(this.cultures, function (baseValue, displayValue) {
                    item.availableValues.push({
                        baseValue   : baseValue,
                        displayValue: App.translate(displayValue)
                    });
                });
                result               = true;
                break;
            case 'measurementSystem':
                item.availableValues = [
                    {
                        baseValue   : 'metric',
                        displayValue: App.translate('Metric')
                    },
                    {baseValue: 'US', displayValue: App.translate('US')}
                ];
                result               = true;
                break;
            default:
            // Do nothing.
        }
        return result;
    },

    /**
     * User settings: add some more elements to that step and update them interactively, depending on the selection of the following field(ids):
     * - language (en, ar, de, ...)
     * - culture (en_GB, en_US, ar_AE, ...)
     * - measurementSystem (metric, US)
     * - timezone
     * @param step
     * @param {Array} allFields
     */
    addPreview: function (step, allFields) {

        /**
         * Those fields that are monitored in the user settings dialog.
         * @type {object}
         */
        var fields = {
            language         : null,
            culture          : null,
            measurementSystem: null,
            timeZone         : null
        };

        // 1) Fill those properties with life.
        for (var i = 0; i < allFields.length; i++) {
            var id = allFields[i].config.id;
            if (fields.hasOwnProperty(id)) {
                fields[id] = {
                    el      : allFields[i].el,
                    current : App.config.user[id],
                    original: App.config.user[id]
                };
            }
        }
        // Set some special defaults.
        fields.timeZone.current  = App.config.user.timeZoneOffset;
        fields.timeZone.original = App.config.user.timeZoneOffset;


        // 2) create some "display only" elements to visualize the changes of i18n settings.
        var sampleDate  = new Date();
        App.util.dateToGMT(sampleDate);
        var sampleItems = {
                date       : {
                    label: 'Date',
                    type : 'date',
                    value: kendo.toString(sampleDate, App.config.dateFormat)
                },
                dateTime   : {
                    label: 'DateTime',
                    type : 'dateTime',
                    value: kendo.toString(sampleDate, App.config.dateTimeFormat)
                },
                duration   : {
                    label: 'Duration',
                    type : 'duration',
                    value: 7600
                },
                number     : {
                    label: 'Number',
                    type : 'numeric',
                    value: 1234.567
                },
                decimal    : {
                    label: 'Decimal',
                    type : 'decimal',
                    value: 1234.567
                },
                distance   : {
                    label   : 'Distance',
                    unitType: 'distance',
                    type    : 'decimal',
                    value   : 1234.567
                },
                temperature: {
                    label   : 'Temperature',
                    unitType: 'temperature',
                    type    : 'decimal',
                    value   : 1234.567
                },
                volume     : {
                    label   : 'Volume',
                    unitType: 'volume',
                    type    : 'decimal',
                    value   : 1234.567
                }
            },
            dl          = $('<dl>', {'class': 'dl-horizontal'}).appendTo(step)
            ;

        $.each(sampleItems, function (idx, sample) {
            dl.append(
                '<dt>' + App.translate(sample.label) + '</dt>' +
                '<dd data-id="i18n-' + idx + '"></dd>'
            );
        });


        // 3) bind the according events to those elements.
        var updateSamples = function () {

            // Update from current value in control
            $.each(fields, function (idx, field) {
                if (idx === 'timeZone') {
                    field.current = parseInt(field.el.element.dataItem().offset);
                } else if ($.isFunction(field.el.element.value)) {
                    field.current = field.el.element.value();
                } else {
                    field.current = field.el.element.value;
                }
            });

            /**
             * Called after the new culture file has been loaded.
             */
            var refreshSamples = function () {

                // Change values in application wide
                kendo.culture(fields.culture.current);
                App.config.user.measurementSystem = fields.measurementSystem.current;
                App.config.user.timeZoneOffset    = fields.timeZone.current;

                // Render new sampleItems.
                $.each(sampleItems, function (idx, sample) {
                    step.find('[data-id=i18n-' + idx + ']').html(App.util.format.item(sample));
                });

                // ... and reset them back to their original
                kendo.culture(fields.culture.original);
                App.config.user.measurementSystem = fields.measurementSystem.original;
                App.config.user.timeZoneOffset    = fields.timeZone.original;

            };

            // Check if culture has been loaded already. If not, load it.
            if (fields.culture.current && !kendo.cultures.hasOwnProperty(fields.culture.current)) {
                $.ajax({
                    url     : 'js/lib/kendo/cultures/kendo.culture.' + fields.culture.current + '.min.js',
                    complete: refreshSamples,
                    dataType: 'script',
                    type    : 'GET'
                });
            } else {
                refreshSamples();
            }
        };
        fields.language.el.element.bind('change', updateSamples);
        fields.culture.el.element.bind('change', updateSamples);
        fields.measurementSystem.el.element.bind('change', updateSamples);
        fields.timeZone.el.element.bind('change', updateSamples);

        // Call update immediatly to populate up allFields.
        updateSamples();
    }
};
