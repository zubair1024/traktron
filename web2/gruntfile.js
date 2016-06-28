module.exports = function (grunt) {
    'use strict';

    // Project configuration.
    grunt.initConfig({
        pkg   : grunt.file.readJSON('package.json'),
        banner: '/*! <%= pkg.name %> v<%= pkg.version %> */\n',
        jshint: {
            // define the files to lint
            files  : ['gruntfile.js', 'js/**/*.js', 'js/*.js', '!js/lib/**', '!js/maps/**/*'],
            // configure JSHint (documented at http://www.jshint.com/docs/options/)
            options: {
                // More options here if you want to override JSHint defaults.
                globals : {
                    jQuery : true,
                    console: true,
                    module : true
                },
                curly   : false,
                indent  : 4,
                newcap  : true,
                trailing: true,
                unused  : 'vars',
                quotmark: 'single'
                //nonew   : true,
            }
        },
        qunit : {
            // will test all '.html' files in the test directory and all subdirectories
            all: ['test/**/*.html']
        },
        //copy     : {
        //    angular: {
        //        files: [{
        //            src : 'node_modules/angular2/bundles/angular2.js',
        //            dest: 'js/lib/angular2.js'
        //        }, {
        //            src : 'node_modules/angular2/bundles/angular2.min.js',
        //            dest: 'js/lib/angular2.min.js'
        //        }]
        //    }
        //},
        less  : {
            dist: {
                options: {
                    banner      : '<%= banner %>',
                    compress    : true, // Compress output by removing some whitespaces.
                    relativeUrls: true, // Rewrite URLs to be relative.
                    strictMath  : true, // Math is required to be in parenthesis.
                    strictUnits : true  // Validate the units used (e.g. 4px/2px = 2, not 2px and 4em/2px throws an error).
                },
                files  : [{
                    expand: true,       // Enable dynamic expansion.
                    cwd   : 'css',      // Src matches are relative to this path.
                    src   : '*.less',   // Actual pattern(s) to match.
                    dest  : 'dist/',    // Destination path prefix.
                    ext   : '.css'      // Dest filepaths will have this extension.
                }, {
                    '../helpContent/css/help.css': '../helpContent/css/help.less' //style for help content
                }]
            }
        },
        uglify: {
            options: {
                banner  : '<%= banner %>',
                compress: {
                    drop_console: true, // discard calls to console.* functions
                    dead_code   : true, // discard unreachable code
                    global_defs : {
                        'DEBUG': false
                    }
                }
            },
            dist   : {
                files: {
                    'dist/lib.js'             : [
                        'js/lib/jquery-1.11.3.js',
                        'js/lib/kendo/jszip.min.js',

                        // The following items have been selected here to get the list of needed required scripts:
                        // http://www.telerik.com/download/custom-download
                        // - Router
                        // - Autocomplete incl. Mobile Scroller
                        // - ComboBox incl. Mobile Scroller
                        // - DatePicker
                        // - DateTimePicker
                        // - DropDownList incl. Mobile Scroller
                        // - Editor
                        // - Grid with all components
                        // - ListView with selection
                        // - MultiSelect incl. Mobile Scroller
                        // - PanelBar
                        // - ProgressBar
                        // - Splitter
                        // - TabStrip
                        // - ToolBar
                        // - TreeView
                        // - Upload
                        // - Chart with PDF export
                        // - Gauge
                        'js/lib/kendo/kendo.core.min.js',
                        'js/lib/kendo/kendo.router.min.js',
                        'js/lib/kendo/kendo.fx.min.js',
                        'js/lib/kendo/kendo.userevents.min.js',
                        'js/lib/kendo/kendo.draganddrop.min.js',
                        'js/lib/kendo/kendo.mobile.scroller.min.js',
                        'js/lib/kendo/kendo.data.min.js',
                        'js/lib/kendo/kendo.popup.min.js',
                        'js/lib/kendo/kendo.list.min.js',
                        'js/lib/kendo/kendo.autocomplete.min.js',
                        'js/lib/kendo/kendo.combobox.min.js',
                        'js/lib/kendo/kendo.calendar.min.js',
                        'js/lib/kendo/kendo.datepicker.min.js',
                        'js/lib/kendo/kendo.timepicker.min.js',
                        'js/lib/kendo/kendo.datetimepicker.min.js',
                        'js/lib/kendo/kendo.dropdownlist.min.js',
                        'js/lib/kendo/kendo.window.min.js',
                        'js/lib/kendo/kendo.color.min.js',
                        'js/lib/kendo/kendo.slider.min.js',
                        'js/lib/kendo/kendo.colorpicker.min.js',
                        'js/lib/kendo/kendo.editor.min.js',
                        'js/lib/kendo/kendo.numerictextbox.min.js',
                        'js/lib/kendo/kendo.validator.min.js',
                        'js/lib/kendo/kendo.binder.min.js',
                        'js/lib/kendo/kendo.editable.min.js',
                        'js/lib/kendo/kendo.filtermenu.min.js',
                        'js/lib/kendo/kendo.menu.min.js',
                        'js/lib/kendo/kendo.columnmenu.min.js',
                        'js/lib/kendo/kendo.groupable.min.js',
                        'js/lib/kendo/kendo.filtercell.min.js',
                        'js/lib/kendo/kendo.pager.min.js',
                        'js/lib/kendo/kendo.selectable.min.js',
                        'js/lib/kendo/kendo.reorderable.min.js',
                        'js/lib/kendo/kendo.resizable.min.js',
                        'js/lib/kendo/kendo.view.min.js',
                        'js/lib/kendo/kendo.mobile.view.min.js',
                        'js/lib/kendo/kendo.mobile.loader.min.js',
                        'js/lib/kendo/kendo.mobile.pane.min.js',
                        'js/lib/kendo/kendo.mobile.popover.min.js',
                        'js/lib/kendo/kendo.mobile.shim.min.js',
                        'js/lib/kendo/kendo.mobile.actionsheet.min.js',
                        'js/lib/kendo/kendo.ooxml.min.js',
                        'js/lib/kendo/kendo.excel.min.js',
                        'js/lib/kendo/kendo.drawing.min.js',
                        'js/lib/kendo/kendo.pdf.min.js',
                        'js/lib/kendo/kendo.columnsorter.min.js',
                        'js/lib/kendo/kendo.grid.min.js',
                        'js/lib/kendo/kendo.listview.min.js',
                        'js/lib/kendo/kendo.multiselect.min.js',
                        'js/lib/kendo/kendo.panelbar.min.js',
                        'js/lib/kendo/kendo.progressbar.min.js',
                        'js/lib/kendo/kendo.splitter.min.js',
                        'js/lib/kendo/kendo.tabstrip.min.js',
                        'js/lib/kendo/kendo.toolbar.min.js',
                        'js/lib/kendo/kendo.treeview.min.js',
                        'js/lib/kendo/kendo.upload.min.js',
                        'js/lib/kendo/kendo.dataviz.core.min.js',
                        'js/lib/kendo/kendo.dataviz.themes.min.js',
                        'js/lib/kendo/kendo.dataviz.chart.min.js',
                        'js/lib/kendo/kendo.dataviz.gauge.min.js',

                        // lodash - https://lodash.com/
                        'js/lib/lodash.js',
                        // Stampit - https://github.com/stampit-org/stampit
                        'js/lib/stampit.js',
                        'js/lib/cornify.js',
                        'js/lib/jquery.easteregg.js',
                        'js/lib/hshake.js'
                    ],
                    'dist/app.js'             : [
                        // Kendo i18n
                        'js/lib/kendo/cultures/kendo.culture.en.min.js',
                        // jQuery UI sortable
                        'js/lib/jquery-ui.js',
                        // jQuery Plugins
                        'js/lib/jquery.cookie.js',
                        //'js/lib/jquery.marquee.js', // unused for now.
                        'js/lib/jquery.mousewheel.js',
                        'js/lib/jquery.nouislider.all.js',
                        'js/lib/jquery.scrollintoview.js',
                        // Bootstrap
                        'js/lib/bootstrap.js',
                        // Misc Kendo
                        'js/lib/kendo.menu.ex.js',

                        // App
                        'js/app.js',
                        // Utilities
                        'js/utils/dialog.js',
                        'js/utils/application.js',
                        'js/utils/cmd.js',
                        'js/utils/i18n.js',
                        'js/utils/log.js',
                        'js/utils/router.js',
                        'js/utils/user.js',
                        'js/utils/util.js',
                        // Components
                        'js/components/config.js',
                        'js/components/chart-base.js',
                        'js/components/chart-default.js',
                        'js/components/chart-donut.js',
                        'js/components/chart-line.js',
                        'js/components/chart-pie.js',
                        'js/components/chart-gauge.js',
                        'js/components/field-base.js',
                        'js/components/field-checkbox.js',
                        'js/components/field-datelist.js',
                        'js/components/field-datepicker.js',
                        'js/components/field-dropdown.js',
                        'js/components/field-durationpicker.js',
                        'js/components/field-editor.js',
                        'js/components/field-fileupload.js',
                        'js/components/field-input.js',
                        'js/components/field-muliplaceholder.js',
                        'js/components/field-mutiselect.js',
                        'js/components/field-multiset.js',
                        'js/components/field-numeric.js',
                        'js/components/field-password.js',
                        'js/components/field-timepicker.js',
                        'js/components/field-tripstages.js',
                        'js/components/hierarchyselection.js',
                        'js/components/chart-capacity.js',
                        // UI
                        'js/ui/multiselect.js',
                        'js/ui/hierarchy-selection.js',
                        'js/ui/navigationtreeview.js',
                        'js/ui/selectiontree.js',
                        'js/ui/field.js',
                        'js/ui/login.js',
                        'js/ui/menu-base.js',
                        'js/ui/menu.js',
                        'js/ui/toast.js',
                        'js/ui/widgetpanel.js',
                        'js/ui/notification.js',
                        'js/ui/alarm.js',
                        'js/ui/aboutwindow.js',
                        // Wizards
                        'js/ui/wizard-base.js',
                        'js/ui/wizard-administration.js',
                        'js/ui/wizard-batchupload.js',
                        'js/ui/wizard-report.js',
                        'js/ui/wizard-widget.js',
                        'js/ui/widgetcatalog.js',
                        // Widgets
                        'js/widget/base.js',
                        'js/widget/assetcommand.js',
                        'js/widget/dashboard.js',
                        'js/widget/detail.js',
                        'js/widget/grid.js',
                        'js/widget/list.js',
                        'js/widget/simplegrid.js',

                        // Maps (webpacked) \o/
                        'js/maps/bundles/maps.bundle.js',
                        'js/widget/map.js',
                        'js/widget/overviewmap.js',
                        'js/widget/mapinfo.js',

                        // Default configuration
                        'js/config/defaults.js'
                    ],
                    'dist/heremaps.chunk.js'  : 'js/maps/bundles/heremaps.chunk.js',
                    'dist/googlemaps.chunk.js': 'js/maps/bundles/googlemaps.chunk.js',
                    'dist/init.js'            : 'js/init.js'
                }
            },
            shims  : {
                options: {
                    mangle: false   // Prevent changes to variable and function names.
                },
                files  : {
                    'dist/shims.js': [
                        'js/lib/html5shiv.js',
                        'js/lib/respond.min.js',
                        'js/lib/array.generics.min.js',
                        'js/lib/date.polyfill.js'
                    ]
                }
            }
        },
        minjson: {
            compile: {
                files: {
                    'dist/locales/ar.min.json': 'locales/ar.json',
                    'dist/locales/cn.min.json': 'locales/cn.json',
                    'dist/locales/de.min.json': 'locales/de.json',
                    'dist/locales/en.min.json': 'locales/en.json',
                    'dist/locales/es.min.json': 'locales/es.json',
                    'dist/locales/fr.min.json': 'locales/fr.json',
                    'dist/locales/pt.min.json': 'locales/pt.json'
                }
            }
        },
        cssmin : {
            dist   : {
                files: {
                    'dist/app.css': [
                        // App
                        'css/icons.css',
                        'css/app.css',
                        'css/multiselect.css',
                        'css/widget-catalog.css',
                        'css/jquery.nouislider.css',
                        'css/jquery.nouislider.pips.css',
                        //'js/lib/heremaps/mapsjs-ui.css',
                        'css/maps.css'
                        //'css/glyphicons.css'
                    ],
                    'dist/rtl.css': [
                        // RTL styles
                        'css/kendo/kendo.rtl.min.css',
                        'css/rtl.css'
                    ]
                }
            },
            options: {
                report    : 'min',
                advanced  : false,
                relativeTo: '../css'
            }
        },
        watch : {
            styles: {
                files  : ['css/**/*.less'], // which files to watch
                tasks  : ['less'],
                options: {
                    nospawn: true
                }
            }
        },
        run   : {
            'maps-build': { exec: 'npm run maps:build' }, // webpack -p
            'maps-watch': { exec: 'npm run maps:watch' }  // webpack -w
        }
    });

    // Load npm modules
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    //grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    //grunt.loadNpmTasks('grunt-fontsmith');
    grunt.loadNpmTasks('grunt-minjson');
    grunt.loadNpmTasks('grunt-run');

    // Default tasks.
    grunt.registerTask('default', [
        //'copy',
        'jshint',
        //'qunit',
        'run:maps-build',
        'uglify',
        'less',
        'cssmin'
    ]);

    //i18n task(s)
    grunt.registerTask('locales', [
        'minjson'
    ]);
};
