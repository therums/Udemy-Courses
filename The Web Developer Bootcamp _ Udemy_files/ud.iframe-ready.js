$.widget( "custom.iframeReady", {

    options: {
        userId:null,
        windowProxy: null,
        country: null,
        lectureId:null,
        raven_js_dsn:null,
        hEnabled:false
    },

    _create: function() {
        $.extend(this.options, this.element.data());
        // initialize get sentry
        Raven.config(this.options.ravenJsDsn).install();
        Raven.setUserContext({
            id: this.options.userId,
            country_code: this.options.country
        });
        // initialize iframe socket and handlers
        $(window).one('lecturecontentready_'+ this.options.lectureId, function(event) {
            var message = {event: event.type, data: ''};
            windowProxy.postMessage($.toJSON(message));
        });
        $(window).on('positionHandler_' + this.options.lectureId, function(event, data) {
            var message = {event: event.type, data: data};
            windowProxy.postMessage($.toJSON(message));
        });

        try {
            var windowProxy = new easyXDM.Socket({
                onMessage: function(message, origin) {
                    var data = $.evalJSON(message);
                    if(data.event == 'gotoposition_' + this.options.lectureId) {
                        $.event.trigger(data.event, data.data);
                    }
                    if(data.event === 'destroyvideojs') {
                        $(".ud-videojs-ready", this.element).remove();
                    }
                }.bind(this)
            });
        } catch(e) {
            var windowProxy = {postMessage:function(){}};
        }

        // initialize subwidgets
        $(".ud-videojs-ready", this.element).videojsReady({"windowProxy":windowProxy});
        if(this.options.hEnabled== false)
            $(".ud-progresser", this.element).progresser({"windowProxy":windowProxy});
    }
});

$(document).ready(function(){
    // initialize iframe main widget
    $(".ud-iframe-ready").iframeReady();
});
