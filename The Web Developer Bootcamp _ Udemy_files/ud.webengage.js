define(['webengage'], function () {
    var _weq = _weq || {};
    _weq['webengage.licenseCode'] = '~47b66305';
    _weq['webengage.widgetVersion'] = "4.0";
    if (typeof UD.me !== 'undefined') {
        _weq['webengage.customData'] = {
            'userId': UD.me.id
        };
    }
});
