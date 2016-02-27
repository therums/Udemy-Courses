(function(window, videojs) {
    'use strict';

    /**
     * Initialize the plugin.
     * @param options (optional) {object} configuration for the plugin
     */
    var timer = function(options) {
        this.on('timeupdate', timeUpdated);
        this.on('ended', timeUpdated);
        var position = -1;
        var lastPosition = -1;
        function timeUpdated(timeUpdateEvent){
            var currentTime = this.currentTime();
            var duration = this.duration();
            window.$.event.trigger(options.positionEventName, {'total': Math.floor(duration), 'position': currentTime});
            position = Math.floor(currentTime / options.interval);
            var mod = Math.floor(currentTime) % options.interval;
            if(mod) {
                position += 1;
            }
            if((lastPosition === position) || (position <= 0)) {
                return;
            }
            lastPosition = position;
            var time = position * options.interval;
            if(time > duration) {
                time = duration;
            }
            if(timeUpdateEvent.type === 'ended') {
                time = duration;
            }
            window.$.event.trigger(options.progressEventName, {'total': Math.floor(duration), 'position': time});
        }
    };

    // register the plugin
    videojs.plugin('timer', timer);
})(window, window.videojs);
