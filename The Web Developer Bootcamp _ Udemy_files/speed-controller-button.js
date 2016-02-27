(function(window, videojs) {
    'use strict';

    videojs.SpeedControllerButton = videojs.Component.extend({
        init: function(player, options) {
            var menuButton = new videojs.PlaybackRateMenuButton(player, {});
            options.el = menuButton.el();
            var menuEl = options.el.getElementsByClassName('vjs-menu-content')[0];
            var titleEl = videojs.Component.prototype.createEl('li', {
                className: 'vjs-menu-title',
                innerHTML: 'Speed',
                tabindex: -1
            });
            menuEl.insertBefore(titleEl, menuEl.childNodes[0]);
            videojs.Component.call(this, player, options);
        }
    });

    /**
     * Initialize the plugin.
     * @param options (optional) {object} configuration for the plugin
     */
    var speedControllerButtonPlugin = function(options) {
        var speedControllerButton = new videojs.SpeedControllerButton(this, options);
        this.controlBar.addChild(speedControllerButton);
    };

    // register the plugin
    videojs.plugin('speedcontrollerbutton', speedControllerButtonPlugin);
})(window, window.videojs);
