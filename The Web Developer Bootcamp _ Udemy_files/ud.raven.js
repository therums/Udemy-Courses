define(['raven'], function(Raven) {
    'use strict';
    if(UD.Config.third_party.raven_dsn) {
        Raven.config(UD.Config.third_party.raven_dsn, {
            ignoreErrors: [/^Load timeout for modules:/]
        }).install();
        
        if(UD.me) {
            Raven.setUserContext({
                email: UD.me.email, id: UD.me.id, country_code: UD.request.countryCode
            });
        }
    }
    return Raven;
});
