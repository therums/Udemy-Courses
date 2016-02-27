'use strict';
var UD = typeof(UD) == "undefined" ? {} : UD;
UD.LIGHTAPI = {
    version: 'api-1.1',
    apiHTTP: "https://" + document.domain +"/" ,

    getHeaders :function() {
        var headers = {};
        headers['X-Udemy-Snail-Case'] = true;

        if($.cookie('client_id'))
            headers['X-Udemy-Client-Id'] = $.cookie('client_id');

        if($.cookie('access_token'))
            headers['X-Udemy-Bearer-Token'] = $.cookie('access_token');
        else if($.cookie('client_secret'))
            headers['X-Udemy-Client-Secret'] = $.cookie('client_secret');

        return headers;
    },

    call:function(url, params){
        $.ajax($.extend({
            url: this.apiHTTP+this.version +  url,
            headers: this.getHeaders(),
            dataType: "json",
            type: "POST"
        }, params));
    }
};

UD.LIGHTAPI_V2 = {
    version: 'api-2.0',
    apiHTTP: "https://" + document.domain +"/" ,

    getHeaders: function() {
        var headers = {};

        if($.cookie('access_token')) {
            headers.Authorization = 'Bearer ' + $.cookie('access_token');
            // Some proxies are apparently deleting standard `Authorization` header from HTTP
            // requests. The custom `X-Udemy-Authorization` sent is captured by
            // `OAuth2AuthenticationMiddleware` in Django.
            headers['X-Udemy-Authorization'] = headers.Authorization;
        }

        return headers;
    },

    call: function(url, params) {
        return $.ajax($.extend({
            url: this.apiHTTP + this.version + url,
            headers: this.getHeaders(),
            dataType: 'json'
        }, params));
    },

    increment: function(key, tags, callback, errorCallback) {
        this.call('/visits/me/datadog-increment-logs', {
            type: 'POST',
            data: {
                key: key,
                tags: JSON.stringify(tags)
            },
            success: callback,
            error: errorCallback
        });
    },

    timing: function(key, time, callback, errorCallback) {
        this.call('/visits/me/datadog-timing-logs', {
            type: 'POST',
            data: {
                key: key,
                time: time
            },
            success: callback,
            error: errorCallback
        });
    }
};
