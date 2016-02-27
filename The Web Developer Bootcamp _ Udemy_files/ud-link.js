define(['jquery', 'ud-config'], function($, udConfig) {
    'use strict';
    return {
        toImages: function (filePath) {
            return udConfig.url.to_images + filePath;
        },
        toJs: function (filePath) {
            return udConfig.url.to_js + filePath + '?v=' + udConfig.version;
        },
        to: function (controller, action, params) {
            var baseUrl = controller ?
                (action ?
                    udConfig.url.to_app + controller + '/' + action + '/':
                    udConfig.url.to_app + controller + '/') :
                udConfig.url.to_app;
            return !params ? baseUrl : baseUrl + '?' + $.param(params);
        }
    };
});
