$.widget( "ud.progresser", {

    options: {
        api: null,
        progressEvent: null,
        completionEvent: null
    },
    _create: function() {
        $.extend(this.options, this.element.data());
        $(window).on(this.options.progressEvent, this._send.bind(this));
    },

    _send: function (event, data) {
        if(!this.options.api) {
            console.log("api url is not set");
            return;
        }
        UD.LIGHTAPI.call(this.options.api, {
            data: {
                'data': window.btoa(JSON.stringify(data))
            },
            success: function(response) {
                if(response.is_completed) {
                    parent && parent.$.event.trigger(this.options.completionEvent);
                }
            }.bind(this)
        })
    }
});
