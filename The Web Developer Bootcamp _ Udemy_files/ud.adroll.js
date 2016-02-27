define(['require'], function (require) {
    'use strict';

    if (typeof UD.adroll !== 'undefined') {
        var adrollData = UD.adroll;

        window.adroll_adv_id = "554CPNW4XBAX5EYKBL4HVU";
        window.adroll_pix_id = "OKLCQMMNANCRNGGEOKKR5M";
        if (typeof adrollData.customData !== 'undefined') {
            window.adroll_custom_data = adrollData.customData;
        }
        if (typeof adrollData.segments !== 'undefined') {
            window.adroll_segments = adrollData.segments;
        }
        if (typeof adrollData.conversionValue !== 'undefined') {
            window.adroll_conversion_value = adrollData.conversionValue;

            if(typeof adrollData.currency !== 'undefined') {
                window.adroll_currency = adrollData.currency;
            } else {
                window.adroll_currency = 'USD';
            }
        }

        require(['adroll']);
    }
});
