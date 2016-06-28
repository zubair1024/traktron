QUnit.module('Basic Tests');

//noinspection JSUnresolvedFunction
QUnit.test('NameSpaces', function (assert) {
    assert.ok(App.i18n, 'i18n is there');
    assert.ok(App.config, 'App.config is there. OK, maybe it is too simple.');
});
