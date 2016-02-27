(function(window, videojs) {
    'use strict';

    /**
     * Initialize the plugin.
     * This plugin adds following button to the control bar:
     *  - rewind button
     *  - speed change button
     *  - forward button
     *
     *
     * @param options (optional) {object} configuration for the plugin
     */
    var controlbarSpeedControllerPlugin = function(options) {
        var middleButtonGroupComponent = new videojs.MiddleButtonGroup(this, options);
        middleButtonGroupComponent.addChild('speedControllerButton');

        this.controlBar.addChild(middleButtonGroupComponent);
    };

    // register the plugin
    videojs.plugin('controlbarspeedcontroller', controlbarSpeedControllerPlugin);
})(window, window.videojs);
