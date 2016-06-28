/**
 * Namespace for utility functions
 * @type {{sortWidget: Function, sortTreeItem: Function, loadStyles: Function, loadScript: Function, format: {date: Function, time: Function, dateTime: Function, hourMinute: Function, duration: Function, fuzzyTime: Function, domainObjectType: Function, icon: Function, domainObjectReference: Function, capitalize: Function, routeSummary: Function, item: Function}, setTheme: Function, updateBreadcrumb: Function, forms: {validator: {rules: {phoneNumber: Function, passwordConfirm: Function, required: Function, upload: Function}, messages: {required: string, phoneNumber: string, passwordConfirm: string}, validate: Function}}, widget: {defaultIcon: {alarmMap: string, assetCommand: string, assetMaintenance: string, dashboard: string, detail: string, eventHistoryMap: string, grid: string, map: string, overviewMap: string, widgetGroup: string}, syncWithDefault: Function, fixIcons: Function, fixBoolValues: Function, boolCheck: Function}}}
 */
App.util = {

    /**
     * Sorter for widget Position
     */
    sortWidget: function (a, b) {
        'use strict';

        if (parseInt(a.positionNumber) < parseInt(b.positionNumber)) {
            return -1;
        } else if (parseInt(a.positionNumber) > parseInt(b.positionNumber)) {
            return 1;
        } else {
            return 0;
        }
    },

    sortTreeItem: function (a, b) {
        'use strict';

        if (a.domainObjectType < b.domainObjectType) {
            return -1;
        } else if (a.domainObjectType > b.domainObjectType) {
            return 1;
        } else {
            return 0;
        }
    },

    /**
     * Load a CSS stylesheet by appending it to the html head.
     * @param {array|string} styles array of stylesheet paths or one single path of stylesheet.
     */
    loadStyles: function (styles) {
        var cssArray = $.isArray(styles) ? styles : [styles];

        for (var i = 0, len = cssArray.length; i < len; i++) {
            var css = $('<link>', {
                href: cssArray[i],
                rel : 'stylesheet'
            });
            $('head').append(css);
        }
    },

    /**
     * Load a JS script: put it to the header and attach a "onload" callback if provided.
     * @param scriptURL
     * @param {function=} callback
     */
    loadScript : function (scriptURL, callback) {
        var scr = $('<script>', {
            src: scriptURL
        });

        if ($.isFunction(callback)) {
            scr.get(0).onload = callback;
        }
        document.getElementsByTagName('head')[0].appendChild(scr.get(0));
    },
    /**
     * Removes the user's timeZoneOffset to the dates that come go the server.
     * @param {Date} value
     * @returns {Date}
     */
    dateToGMT  : function (value) {
        value.setMinutes(value.getMinutes() - App.config.user.timeZoneOffset);
        return value;
    },
    /**
     * Adds the user's timeZoneOffset to the dates that come from the server.
     * @param {Date} value
     * @returns {Date}
     */
    dateFromGMT: function (value) {
        value.setMinutes(value.getMinutes() + App.config.user.timeZoneOffset);
        return value;
    },
    /**
     * NameSpace for formatting functions
     */
    format     : {
        /**
         * @param {Date|string|null} value
         * @param {string=} format - defaults to "d" for date format.
         * @returns {string}
         */
        date                 : function (value, format) {
            'use strict';

            if (value !== null && value !== '') {
                format = format || 'd';

                if (!(value instanceof Date)) {
                    // Try to convert strings into date objects. Assume that the string is an ISO8601 formatted date.
                    //noinspection JSUnresolvedFunction
                    value = kendo.parseDate(value, App.config.dateFormat);
                }

                // Timezone...
                if (value instanceof Date) {
                    App.util.dateFromGMT(value);
                }

                return kendo.toString(value, format);
            } else {
                return App.config.blankSign;
            }
        },
        /**
         * @param {Date} value
         * @param {string=} format - defaults to "t" (for time only).
         * @returns {string}
         */
        time                 : function (value, format) {
            'use strict';

            if (value !== null) {
                format = format || 't';

                // Timezone...
                App.util.dateFromGMT(value);

                return kendo.format(value, format);
            } else {
                return App.config.blankSign;
            }
        },
        /**
         * @param {Date} value
         * @param {string=} format - defaults to "G" which means "full".
         * @returns {string}
         */
        dateTime             : function (value, format) {
            'use strict';

            var result = App.config.blankSign;
            if (value !== null) {
                format = format || 'G';

                if (!(value instanceof Date)) {
                    // Try to convert strings into date objects. Assume that the string is an ISO8601 formatted date.
                    // noinspection JSUnresolvedFunction
                    value = kendo.parseDate(value, App.config.dateTimeFormat);
                }

                if (value) {
                    // Add Timezone offset.
                    App.util.dateFromGMT(value);
                    return kendo.toString(value, format);
                }
            } else {
                return App.config.blankSign;
            }

            return result;
        },
        /**
         * format a given amount of seconds to hh:mm
         * Example: 86700 -> 24:05
         * @param {number} seconds amount of seconds
         * @param {string=} format either "HH:mm" or "HH:mm:ss"
         */
        hourMinute           : function (seconds, format) {

            var hours   = Math.floor(seconds / 3600),
                minutes = 0,
                secs    = '';

            switch (format) {
                case 'HH:mm:ss':
                    minutes = Math.floor((seconds - (hours * 3600)) / 60);
                    secs    = Math.round(seconds - (hours * 3600) - (minutes * 60));
                    break;
                default:
                case 'HH:mm':
                    minutes = Math.round((seconds - (hours * 3600)) / 60);
            }
            if (hours < 10) {
                hours = '0' + hours;
            }
            if (minutes < 10) {
                minutes = '0' + minutes;
            }
            if (secs !== '') {
                if (secs < 10) {
                    secs = ':0' + secs;
                } else {
                    secs = ':' + secs;
                }
            }

            return hours + ':' + minutes + secs;
        },
        /**
         * Format a duration in seconds the same way it is done in eg. GoogleMaps
         * Examples: 6743 --> "1 h 52 min"
         *          86460 --> "1 day, 1 min"
         *            400 --> "7 min"
         *             28 --> "28 secs"
         *           -400 --> "Delayed by 7 min"
         * @param {int} seconds
         * @returns {string}
         */
        duration             : function (seconds) {
            var result = '',
                prefix = '';


            if (!seconds) {
                result = App.config.blankSign;
            } else {

                if (seconds < 0) {
                    prefix  = App.translate('Delayed by ');
                    seconds = seconds * -1;
                }

                if (seconds < 30) {
                    result = App.translate('{0} secs', seconds);
                } else {
                    var days    = Math.floor(seconds / 86400),
                        hours   = Math.floor(seconds % 86400 / 3600),
                        minutes = Math.round(seconds % 3600 / 60);

                    if (days > 0) {
                        if (days === 1) {
                            result = App.translate('{0:n0} day', days);
                        } else {
                            result = App.translate('{0:n0} days', days);
                        }

                        if (hours > 0) {
                            result += ', ';
                        }
                    }
                    if (hours > 0) {
                        result += App.translate('{0:n0} h', hours);
                        if (minutes > 0) {
                            result += ' ';
                        }
                    }
                    if (minutes > 0) {
                        result += App.translate('{0:n0} min', minutes);
                    }
                }

            }

            return prefix + result;
        },
        /**
         * Return the date in a human readable form, eg. "1h ago".
         * @param {string} nowValue as ISO date string.
         * @param {string} value as ISO date string.
         * @returns {string}
         */
        fuzzyTime            : function (value, nowValue) {
            'use strict';

            var result = '';

            if (value) {

                var date = new Date(value.replace(/-/g, '/').replace(/T/, ' ')),
                    now  = null;

                if (nowValue) {
                    now = new Date(nowValue.replace(/-/g, '/').replace(/T/, ' '));
                } else {
                    now = new Date();
                    App.util.dateFromGMT(now);
                }

                var diff    = now - date,
                    days    = Math.floor(diff / 86400000),
                    hours   = Math.floor(diff / 3600000),
                    minutes = Math.floor(diff / 60000),
                    seconds = Math.floor(diff / 1000);

                if (seconds < 60) {
                    result = App.translate('less than a minute ago');
                } else if (minutes === 1) {
                    result = App.translate('one minute ago');
                } else if (minutes < 60) {
                    result = App.translate('{0} mins ago', minutes);
                } else if (hours === 1) {
                    result = App.translate('one hour ago');
                } else if (hours < 12) {
                    result = App.translate('{0} hours ago', hours);
                } else {

                    if (days === 0) {
                        days = 1;
                    }

                    if (days === 1) {
                        result = App.translate('{0} day ago', days);
                    } else {
                        result = App.translate('{0} days ago', days);
                    }
                }
            }

            return result;
        },
        /**
         * Converts domainObjectType into human readable presentation.
         * @param {string} domainObjectType domainObjectType
         * @returns {string}
         */
        domainObjectType     : function (domainObjectType) {
            'use strict';

            var result = domainObjectType;
            if (App.config.domainObjectTypes[result]) {
                result = App.translate(App.config.domainObjectTypes[result].name);
            }
            return result;
        },
        /**
         * returns a css class for a given domainObjectType.
         * @param {string} domainObjectType domainObjectType
         * @returns {string}
         */
        domainObjectTypeIcon : function (domainObjectType) {
            'use strict';

            var result = '';
            if (App.config.domainObjectTypes[domainObjectType]) {
                result = 'ao-' + domainObjectType;
            } else if (domainObjectType.indexOf('configuration') > -1) {
                result = 'ao-configuration';
            } else {
                result = 'ao-unknown';
            }
            return result;
        },
        /**
         * Used in the grid widget as a template for dropdowns.
         * @param {string} type
         * @returns {*}
         */
        icon                 : function (type) {
            'use strict';

            if (App.config.icons[type]) {
                return App.config.icons[type].url;
            } else {
                // Return a transparent 1x1px GIF.
                return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            }
        },
        /**
         * Returns clickable link with icon.
         * @param {string} domainObjectType
         * @param {string|number} domainObjectId
         * @param {string} label name of domainObject
         * @param isAccessible
         * @returns {string}
         */
        domainObjectReference: function (domainObjectType, domainObjectId, label, isAccessible) {
            if (!domainObjectId) {
                return '';
            } else if (!isAccessible) {
                return label;
            } else {
                return kendo.format(
                    '<a href="#!/{0}/{1}/show/{2}">{3}</a><span title="Click to see more actions" data-toggle="tooltip" class="ref-icon glyphicon glyphicon-pencil" data-action="refmenu" data-objecttype="{0}" data-id="{1}" data-label="{3}"></span>',
                    domainObjectType,
                    domainObjectId,
                    App.router.encodeParam(label),
                    label
                );
            }
        },
        /**
         * Capitalize the first letter of the string.
         * @param {string} s
         * @returns {string}
         */
        capitalize           : function (s) {
            return s.charAt(0).toUpperCase() + s.slice(1);
        },
        /**
         * Render a route summary
         * For now we differentiate between trip and route summary. TODO unify this later on.
         */
        routeSummary         : function (summary) {

            // We are using the number formatter here, since there could easily thousands of hours... and therefore we need a thousand's separator.
            var formattedDuration = this.duration(summary.duration),
                formattedDistance = this.item({
                    unitType     : 'distance',
                    currentValues: [summary.distance],
                    type         : 'decimal'
                });


            if (typeof summary.durationWithStopovers !== 'undefined') {

                // Render trip wizard summary.
                return kendo.format(
                    '<dl class="dl-horizontal">' +
                    '<dt>{0}</dt><dd>{1}</dd>' +
                    '<dt>{2}</dt><dd>{3}</dd>' +
                    '<dt>{4}</dt><dd>{5}</dd></dl>',
                    App.translate('Duration'),
                    formattedDuration,
                    App.translate('With Stopovers'),
                    this.duration(summary.durationWithStopovers),
                    App.translate('Distance'),
                    formattedDistance
                );
            } else {

                // Render routing summary.
                return kendo.format(
                    '<dl class="dl-horizontal">' +
                    '<dt>{0}</dt><dd>{1}</dd>' +
                    '<dt>{2}</dt><dd>{3}</dd></dl>',
                    App.translate('Duration'),
                    formattedDuration,
                    App.translate('Distance'),
                    formattedDistance
                );
            }
        },
        /**
         *
         * @param {{domainObjectType: string=, domainObjectId: string=, unitType: string=, displayValue: string=, description: string=, currentValues: Array, isDomainObjectAccessible: boolean=, referenceType: string=, type: string}} item
         * @param {{domainObjectType: string=, domainObjectId: string=, unitType: string=, displayValue: string=, description: string=, currentValues: Array, isDomainObjectAccessible: boolean=, referenceType: string=, type: string}=} defaults
         * @returns {string}
         */
        //item                 : function (item, defaults) {
        item                 : function (item) {
            'use strict';

            var result    = '',
                value     = null,
                suffix    = '',
                blankSign = App.config.blankSign,
                params    = {}
                ;

            /**
             * Check if item is there.
             */
            if (item) {

                if (item.currentValues && item.currentValues.length) {
                    value = item.currentValues[0];
                } else if (item.hasOwnProperty('value')) {
                    value = item.value;
                }

                /**
                 * No matter what valueType the item is... make sure that at least there is a proper suffix for common units - if applicable.
                 * The backend stores all values as metric types.
                 */
                if (item.unitType) {
                    var factor = 1,
                        offset = 0;
                    switch (item.unitType) {
                        case 'distance':
                            /**
                             * metric is the default. divide the meters by 1000 to get Kilometers.
                             * @type {number}
                             */
                            factor = 0.001;
                            suffix = App.translate(' km');
                            /** @namespace App.config.user.measurementSystem */
                            switch (App.config.user.measurementSystem) {
                                case 'US':
                                    // 1 (international) Mile = 1609.344 meters
                                    factor = 0.000621371192;
                                    suffix = App.translate(' mi');
                                    break;
                                default:
                                // Do nothing.
                            }
                            break;
                        case 'temperature':
                            suffix = App.translate(' °C');
                            switch (App.config.user.measurementSystem) {
                                case 'US':
                                    // Fahrenheit = Celsius x 1,8 + 32
                                    factor = 1.8;
                                    offset = 32;
                                    suffix = App.translate(' °F');
                                    break;
                                default:
                                // Do nothing.
                            }
                            break;
                        case 'volume':
                            suffix = App.translate(' l');
                            switch (App.config.user.measurementSystem) {
                                case 'US':
                                    // 1 (US.liq.gal.) Gallon = 3.785411784 liters
                                    factor = 0.26417205235815;
                                    suffix = App.translate(' gal');
                                    break;
                                default:
                                // Do nothing.
                            }
                            break;
                        default:
                        // Do nothing.
                    }

                    if ($.isNumeric(value)) {
                        value = value * factor + offset;
                    }
                }

                /**
                 * Look for the valueType and format it accordingly.
                 */
                switch (item.type) {
                    case 'boolean':
                        if (value) {
                            result = '<span class="glyphicon glyphicon-ok"></span>';
                        } else {
                            result = '<span class="glyphicon glyphicon-remove"></span>';
                        }
                        break;
                    case 'date':
                        result = this.date(value);
                        break;
                    case 'dateTime':
                        result = this.dateTime(value);
                        break;
                    case 'decimal':
                        // A number with decimals.
                        if (value !== null) {
                            result = kendo.toString(value, 'n');
                        } else {
                            result = blankSign;
                        }
                        break;
                    case 'domainObjectReferenceType':
                        if (value !== null) {
                            result = this.domainObjectReference(
                                item.referenceType,
                                value,
                                item.displayValue,
                                item.isDomainObjectAccessible
                            );
                        } else {
                            result = blankSign;
                        }
                        break;
                    case 'duration':
                        result = this.duration(value);
                        break;
                    case 'email':
                        if (value !== null) {
                            result = '<a href="mailto:' + value + '">' + value + '</a>';
                        } else {
                            result = blankSign;
                        }
                        break;
                    case 'hourMinute':
                        result = this.hourMinute(value);
                        break;
                    case 'numeric':
                        // An integer; a number without decimals.
                        if (value !== null) {
                            result = kendo.toString(value, 'n0');
                        } else {
                            result = blankSign;
                        }
                        break;
                    case 'percentage':
                        // Renders percentage. Creates a number with 2 decimals.
                        result = kendo.toString(value, 'p');
                        break;
                    case 'phoneNumber':
                        if (value !== null) {
                            result = '<a href="tel:' + value + '">' + value + '</a>';
                        } else {
                            result = blankSign;
                        }
                        break;
                    case 'stateType':
                        var icon = App.config.icons[value];
                        if (typeof icon !== 'undefined' && icon.url !== '') {
                            result = '<img src="' + icon.url + '" alt="' + icon.description + '" title="' + icon.description + '" data-toggle="tooltip" class="widget-status-icon">';
                        } else {
                            result = blankSign;
                        }
                        break;
                    case 'vfsAttachment':
                        if (value !== null) {
                            params                         = {
                                domainObjectType: item.domainObjectType,
                                domainObjectId  : item.domainObjectId,
                                filename        : value
                            };
                            params[App.config.sessionName] = App.config.sessionId;
                            result                         = '<a target="_blank" href="' + App.config.serviceUrl + 'caesarVfsResource/get?' + $.param(params) + '">' + value + '</a>';
                        } else {
                            result = blankSign;
                        }
                        break;
                    case 'vfsImage':
                        if (value !== null) {
                            params                         = {
                                domainObjectType: item.domainObjectType,
                                domainObjectId  : item.domainObjectId,
                                filename        : value
                            };
                            params[App.config.sessionName] = App.config.sessionId;
                            result                         = kendo.format(
                                '<img class="img-thumbnail" src="{0}" alt="{1}" title="{1}">',
                                App.config.serviceUrl + 'caesarVfsResource/get?' + $.param(params),
                                value
                            );
                        } else {
                            result = blankSign;
                        }
                        break;
                    default:
                        // Catch all to-be-implemented field types here.
                        if (value !== null && value !== '&nbsp;') {

                            // Respect multiple values (eg. from an item selector).
                            if (item.currentValues.length > 1) {
                                value = item.currentValues.join(', ');
                            }

                            result = value;
                        } else {
                            result = blankSign;
                        }
                }
            }

            return result + suffix;
        }
    },

    setTheme: function (theme) {
        $('head link#theme').attr('href', 'dist/theme-' + theme + '.css');
    },

    /**
     * Updates document title, breadcrumb, etc.
     * @param items {string|Array=}
     */
    updateBreadcrumb: function (items) {
        'use strict';

        var breadcrumb = [];

        // Build selection string

        // 1) Add current Object Name
        if (App.current.objectName !== null) {
            breadcrumb.push(App.current.objectName);
        }

        // 2) more items?
        if ($.isArray(items)) {
            breadcrumb = breadcrumb.concat(items);
        } else if (items) {
            breadcrumb.push(items);
        }

        // 3) add App title on the last position.
        // breadcrumb.push('[' + App.config.name  + ']');

        document.title = breadcrumb.join(App.config.breadcrumbSeparator) + ' [' + App.config.name + ']';
    },

    forms: {
        validator: {
            rules   : {
                phoneNumber    : function (input) {
                    if (input.is('[data-type=phoneNumber]') && input.val().length > 0) {
                        return input.val().match(/^[+]\d+/);
                    }
                    return true;
                },
                passwordConfirm: function (input) {
                    if (input.is('[data-type=password_confirm]')) {
                        // check if password matches confirm password
                        var confirm = input.closest('dl').find('input[data-type="password"]');
                        return confirm.val() === input.val();
                    }
                    return true;
                },
                required       : function (input) {
                    var result     = true,
                        isRequired = input.length && input[0].attributes.required;

                    if (isRequired) {

                        // Check for required checkbox.
                        if (input.filter('[type=checkbox]').length && !input.is(':checked')) {
                            result = false;
                        } else {
                            var value    = input.val(),
                                datarole = input.data('role');

                            switch (datarole) {
                                case 'numerictextbox':
                                    if (input.parent() && input.parent().is(':visible')) {
                                        // Instead, access the value via the Kendo wrapper.
                                        result = input.data('kendoNumericTextBox').value() !== null;
                                    }
                                    break;
                                case 'dropdownlist':
                                    if (input.data('kendoDropDownList').wrapper.is(':visible')) {
                                        result = !(value === '' || !value);
                                    }
                                    break;
                                default:
                                    if (input.is(':visible')) {
                                        // TODO check if we REALLY need to trim this. Maybe blanks are nice!?
                                        result = $.trim(value) !== '';
                                    }
                            }
                        }
                    }

                    return result;
                },
                dateTime       : function (input) {
                    if (input.data('role') == 'datetimepicker') {
                        return input.data('kendoDateTimePicker').value() !== null;
                    }
                    return true;
                },
                // Original implementation from Kendo UI
                //required: function(input) {
                //    var checkbox = input.filter("[type=checkbox]").length && !input.is(":checked"),
                //        value = input.val(),
                //        isRequired = input.length && input[0].attributes['required'] != null;
                //
                //    return !(isRequired && (value === "" || !value  || checkbox));
                //},
                upload         : function (input) {
                    if (input[0].type === 'file' && $(input[0]).attr('ismandatory')) {
                        return input.closest('.k-upload').find('.k-file').length > 0;
                    }
                    return true;
                }
            },
            messages: {
                required       : 'This field is required',
                phoneNumber    : 'Enter phone number in this format: +1234567',
                passwordConfirm: 'Password does not match',
                dateTime       : 'Incorrect date-time value'
            },
            validate: function (e) {

                if (!e.valid) {
                    var elementId;

                    //noinspection LoopStatementThatDoesntLoopJS
                    for (var prop in e.sender._errors) {
                        elementId = prop;
                        break;
                    }

                    if (elementId) {
                        $('#' + elementId).scrollintoview({
                            direction: 'vertical'
                        });
                    }
                }
            }
        }
    },

    /**
     * this namespace contains helper functions for widgets
     */
    widget: {

        /**
         * Default icons for new widgets. To be found eg. in images/icons/16px/<value>.png
         */
        defaultIcon    : {
            alarmMap        : 'Places-24',
            assetCommand    : 'Programing-16',
            assetMaintenance: 'Setting-14',
            dashboard       : 'Business-75',
            detail          : 'Text-47',
            eventHistoryMap : 'Places-24',
            grid            : 'Programing-17',
            map             : 'Places-24',
            overviewMap     : 'Places-30',
            widgetGroup     : 'Content-40'
        },
        /**
         * Check configured widgets for any new or removed columns and other config options.
         */
        syncWithDefault: function () {
            var defaultWidgets = $.ajax({url: App.config.serviceUrl + 'caesarObject/domainDataViewModel'}),
                userWidgets    = $.ajax({url: App.config.serviceUrl + 'caesarWidgetProvider/getWidgets2'}),
                deferreds      = [];

            $.when(defaultWidgets, userWidgets).done(function (defaultData, userData) {
                $.each(userData[0].data, function (idx, widget) {
                    var changed         = false,
                        widgetTypeFound = false,
                        userWidgetData  = $.parseJSON(widget.widgetData);

                    if (userWidgetData && userWidgetData.data && userWidgetData.data.length) {

                        // Loop through domain data view data.
                        //noinspection JSUnresolvedVariable
                        $.each(defaultData[0].domainDataViewModel, function (dIdx, viewModel) {

                            if (widget.objectType === viewModel.domainObjectTypeId &&
                                userWidgetData.viewType === viewModel.id) {

                                widgetTypeFound = true;

                                $.each(viewModel.domainObjectValues, function (leftIdx, leftItem) {
                                    var found = false;
                                    $.each(userWidgetData.data, function (rightIdx, rightItem) {

                                        if (rightItem.domainObjectValueId === leftItem.domainObjectValueId) {
                                            found = true;

                                            // update configuration

                                            // check name
                                            if (leftItem.domainObjectValueName !== rightItem.domainObjectValueName) {
                                                rightItem.domainObjectValueName = leftItem.domainObjectValueName;
                                                changed                         = true;
                                            }

                                            // check type
                                            if (leftItem.type !== rightItem.domainObjectValueType) {
                                                rightItem.domainObjectValueType = leftItem.type;
                                                changed                         = true;
                                            }

                                            if (rightItem.filterable !== leftItem.filterable) {
                                                rightItem.filterable = leftItem.filterable;
                                                changed              = true;
                                            }

                                            if (rightItem.sortable !== leftItem.sortable) {
                                                rightItem.sortable = leftItem.sortable;
                                                if (!leftItem.sortable &&
                                                    userWidgetData.sortAttribute === leftItem.domainObjectValueId) {
                                                    userWidgetData.sortAttribute = '';
                                                }
                                                changed = true;
                                            }

                                            if (rightItem.hidden !== leftItem.hidden) {
                                                rightItem.hidden = leftItem.hidden;
                                                changed          = true;
                                            }

                                            if (rightItem.discreetValues.length !== leftItem.discreetValues.length) {
                                                rightItem.discreetValues = leftItem.discreetValues;
                                                changed                  = true;
                                            }

                                            return false;
                                        }
                                    });

                                    if (!found) {
                                        console.log('new column');
                                        console.log(viewModel.id + ' ' + leftItem.domainObjectValueId);

                                        // we have a new column / field in the default widget configuration for this widget type
                                        var newItem = {
                                            discreetValues       : leftItem.discreetValues,
                                            domainObjectValueId  : leftItem.domainObjectValueId,
                                            domainObjectValueType: leftItem.type,
                                            domainObjectValueName: leftItem.domainObjectValueName,
                                            filterable           : leftItem.filterable,
                                            sortable             : leftItem.sortable,
                                            selected             : false,
                                            mini_widget          : false,
                                            positionNumber       : userWidgetData.data.length + 1
                                        };

                                        if (widget.widgetType === 'detail') {
                                            newItem.section = leftItem.section;
                                        }

                                        userWidgetData.data.push(newItem);
                                        changed = true;
                                    }

                                    var removeIdx = [];
                                    // check if columns are removed
                                    $.each(userWidgetData.data, function (leftIdx, leftItem) {
                                        var found = false;
                                        $.each(viewModel.domainObjectValues, function (rightIdx, rightItem) {
                                            if (rightItem.domainObjectValueId === leftItem.domainObjectValueId) {
                                                found = true;
                                            }
                                        });

                                        if (!found) {
                                            // column seems to be removed
                                            removeIdx.push(leftIdx);
                                            changed = true;
                                        }
                                    });

                                    // remove columns
                                    if (removeIdx.length) {
                                        // revert splice avoids messing up the index
                                        for (var i = removeIdx.length - 1; i >= 0; i--) {
                                            userWidgetData.data.splice(removeIdx[i], 1);
                                        }
                                    }
                                });

                                if (changed) {
                                    var changedWidgetData = JSON.stringify(userWidgetData),
                                        params            = {
                                            id              : widget.id,
                                            name            : widget.name,
                                            user            : App.config.user.id,
                                            description     : widget.description,
                                            widgetType      : widget.widgetType,
                                            widgetData      : changedWidgetData,
                                            location        : widget.location,
                                            positionNumber  : widget.positionNumber,
                                            parent          : widget.parent,
                                            pictureName     : widget.pictureName,
                                            domainObjectType: widget.objectType
                                        };

                                    deferreds.push($.ajax({
                                        url    : App.config.serviceUrl + 'caesarWidgetProvider/updateWidget2',
                                        data   : params,
                                        success: function () {
                                            console.log('done');
                                        }
                                    }));
                                }
                            }
                        });
                    } else {
                        widgetTypeFound = true;
                    }

                    if (!widgetTypeFound) {
                        console.log('delete');
                        console.log(widget);
                        deferreds.push($.ajax({
                            url    : App.config.serviceUrl + 'caesarWidgetProvider/deleteWidget',
                            data   : {id: widget.id},
                            success: function () {
                                console.log('deleted');
                            }
                        }));
                    }
                });
            });

            return deferreds;
        },
        fixIcons       : function () {
            'use strict';

            $.each(App.config.domainObjectTypesTree, function (idx, item) {
                $.each(item.items, function (key, child) {
                    $.ajax({
                        url    : App.config.serviceUrl + 'caesarWidgetProvider/getWidgets2',
                        data   : {
                            domainObjectType: child.id
                        },
                        success: function (response) {
                            $.each(response.data, function (i, widget) {
                                console.log('updating widget id ' + widget.id);
                                console.log('widgetType: ' + widget.widgetType);

                                var picName = App.util.widget.defaultIcon[widget.widgetType] ? App.util.widget.defaultIcon[widget.widgetType] : widget.pictureName;

                                console.log('icon: ' + picName);

                                $.ajax({
                                    url    : App.config.serviceUrl + 'caesarWidgetProvider/updateWidget2',
                                    data   : {
                                        id              : widget.id,
                                        name            : widget.name,
                                        user            : App.config.user.id,
                                        description     : widget.description,
                                        widgetType      : widget.widgetType,
                                        widgetData      : widget.widgetData,
                                        location        : widget.location,
                                        positionNumber  : widget.positionNumber,
                                        parent          : widget.parent,
                                        pictureName     : picName,
                                        domainObjectType: child.id
                                    },
                                    success: function () {
                                        console.log('done');
                                    }
                                });
                            });
                        },
                        error  : function (response) {
                            console.log('error in caesarWidgetProvider/getWidgets2' + response);
                        }
                    });
                });
            });
        },
        fixBoolValues  : function () {
            'use strict';

            var me = this;
            $.each(App.config.domainObjectTypesTree, function (idx, item) {
                $.each(item.items, function (key, child) {
                    $.ajax({
                        url    : App.config.serviceUrl + 'caesarWidgetProvider/getWidgets2',
                        data   : {
                            domainObjectType: child.id
                        },
                        success: function (response) {
                            $.each(response.data, function (i, widget) {

                                if (widget.widgetData !== 'null') {
                                    var widgetData = $.parseJSON(widget.widgetData);

                                    if (widgetData.data.length) {
                                        console.log('updating widget id ' + widget.id);
                                        $.each(widgetData.data, function (dataIdx) {
                                            me.boolCheck(widgetData.data, dataIdx, 'sortable');
                                            me.boolCheck(widgetData.data, dataIdx, 'mini_widget');
                                            me.boolCheck(widgetData.data, dataIdx, 'defaultSort');
                                            me.boolCheck(widgetData.data, dataIdx, 'filterable');
                                        });

                                        $.ajax({
                                            url    : App.config.serviceUrl + 'caesarWidgetProvider/updateWidget2',
                                            data   : {
                                                id              : widget.id,
                                                name            : widget.name,
                                                user            : App.config.user.id,
                                                description     : widget.description,
                                                widgetType      : widget.widgetType,
                                                widgetData      : JSON.stringify(widgetData),
                                                location        : widget.location,
                                                positionNumber  : widget.positionNumber,
                                                parent          : widget.parent,
                                                pictureName     : widget.pictureName,
                                                domainObjectType: child.id
                                            },
                                            success: function () {
                                                console.log('done');
                                            }
                                        });
                                    }
                                }
                            });
                        },
                        error  : function (response) {
                            console.log('error in caesarWidgetProvider/getWidgets2' + response);
                        }
                    });
                });
            });
        },
        boolCheck      : function (data, idx, key) {
            if (data[idx][key] === 'false') {
                data[idx][key] = false;
            } else if (data[idx][key] === 'true') {
                data[idx][key] = true;
            }
        }
    }
};
