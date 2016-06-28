/**
 * Created by michael on 08.10.14.
 */

QUnit.module('Dev Tests');
QUnit.asyncTest('JSON format', function (assert) {
    /**
     * You need to install eg. the CORS plugin for Google Chrome to make this work.
     * @see https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi
     * @type {string}
     */
    var url = 'http://192.168.2.85/roamnet/api/assetApi/';
    $.ajax({
        dataType: 'json',
        url     : url,
        success : function (data, textStatus, jqXHR) {
            assert.ok(true, 'Raw response: ' + jqXHR.responseText);
            QUnit.start();
        }
    });
});

QUnit.asyncTest('XML format', function (assert) {
    /**
     * You need to install eg. the CORS plugin for Google Chrome to make this work.
     * @see https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi
     * @type {string}
     */
    var url = 'http://192.168.2.85/roamnet/api/assetApi/';
    $.ajax({
        dataType: 'xml',
        url     : url,
        success : function (data, textStatus, jqXHR) {
            assert.ok(true, 'Raw response: ' + jqXHR.responseText);
            QUnit.start();
        }
    });
});
