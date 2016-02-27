define(['ud.raven'], function(Raven) {
    "use strict";
    return function(error) {
        // Get require module path if error was caused by a require module.
        var requireModule;
        if(error.requireModules) {
            requireModule = require.s.contexts._.config.paths[error.requireModules[0]];
        }

        // Do not log errors caused by an external require module.
        if(requireModule && requireModule.match(/^(https?:)?\/\//)) {
            throw error;
        }

        // Raven.js automatically ignores exceptions that has 'script error' text in it.
        // We need to bypass that behavior.
        error.message = error.message.replace(/script error/i, "RequireJS error");

        Raven.captureException(error, {
            tags: {
                requireType: error.requireType,
                requireModule: requireModule
            }
        });
        // help error stack readability on chrome
        throw navigator.userAgent.toLowerCase().indexOf('chrome') > -1 ? error.stack : error;
    };
});