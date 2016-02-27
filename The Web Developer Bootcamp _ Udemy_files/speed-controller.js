(function(window, videojs) {
    'use strict';

    videojs.Player.prototype.seekBackward = function seekBackward(seekInterval) {
        this.currentTime(Math.max(0, this.currentTime() - seekInterval));
        this.trigger({type: 'seekrewind', interval: seekInterval});
    };

    videojs.Player.prototype.seekForward = function seekForward(seekInterval) {
        this.currentTime(this.currentTime() + seekInterval);
        this.trigger({type: 'seekforward', interval: seekInterval});
    };

    videojs.Player.prototype.speedDown = function speedDown() {
        if(!videojs.PlaybackRateMenuButton.prototype.playbackRateSupported.call(this)) {
            return;
        }
        var rates = this.options().playbackRates;
        var index = rates.lastIndexOf(this.playbackRate());
        if (index - 1 >= 0) {
            this.playbackRate(rates[index - 1]);
        }
    };

    videojs.Player.prototype.speedUp = function speedUp() {
        if(!videojs.PlaybackRateMenuButton.prototype.playbackRateSupported.call(this)) {
            return;
        }
        var rates = this.options().playbackRates;
        var index = rates.lastIndexOf(this.playbackRate());
        if (index + 1 < rates.length) {
            this.playbackRate(rates[index + 1]);
        }
    };

    /**
     * RewindButton component provides video rewind functionality and its ui.
     *
     * options:
     *  interval: video will be rewinded according to that interval
     */
    videojs.RewindButton = videojs.Button.extend();
    videojs.RewindButton.prototype.createEl = function createEl() {
        var rewind = videojs.createEl('a', {className: 'icon-vjs-rewind'});

        var innerText = videojs.createEl('div', {'innerHTML': this.options().interval});
        rewind.appendChild(innerText);

        return rewind;
    };
    videojs.RewindButton.prototype.onClick = function onClick() {
        this.player().seekBackward(this.options().interval);
    };


    /**
     * ForwardButton component provides video forward functionality and its ui.
     *
     * options:
     *  interval: video will be forwarded according to that interval
     */
    videojs.ForwardButton = videojs.Button.extend();
    videojs.ForwardButton.prototype.createEl = function createEl() {
        var forward = videojs.createEl('a', {className: 'icon-vjs-forward'});

        var innerText = videojs.createEl('div', {'innerHTML': this.options().interval});
        forward.appendChild(innerText);

        return forward;
    };
    videojs.ForwardButton.prototype.onClick = function onClick() {
        this.player().seekForward(this.options().interval);
    };


    videojs.MiddleSpeedController = videojs.Component.extend();
    videojs.MiddleSpeedController.prototype.updateSpeedLabel = function updateSpeedLabel() {
        this._speedNumberElement.innerHTML = this.player().playbackRate() + 'x';
    };
    videojs.MiddleSpeedController.prototype.createEl = function createEl() {
        var _player = this.player();
        var speedControllerContainer = videojs.createEl('div', {className: 'icon-speed-control'});

        var speedControllerButtonContainer = videojs.createEl('div', {className: 'speed-adjust-wrap'});
        speedControllerButtonContainer.appendChild(createSpeedDownEl(_player));
        speedControllerButtonContainer.appendChild(createSpeedUpEl(_player));

        this._speedNumberElement = videojs.createEl('span', {className: 'speed-no'});
        _player.on('ratechange', this.updateSpeedLabel.bind(this));

        speedControllerContainer.appendChild(this._speedNumberElement);
        speedControllerContainer.appendChild(speedControllerButtonContainer);

        return speedControllerContainer;

        function createSpeedUpEl(player) {
            var speedUp = videojs.createEl('a', {className: 'speed-adjust speed-up'});
            speedUp.appendChild(videojs.createEl('span', {className: 'icon-plus'}));
            speedUp.onclick = function() {
                player.speedUp();
            };
            player.on('clickspeedup', speedUp.onclick);
            return speedUp;
        }

        function createSpeedDownEl(player) {
            var speedDown = videojs.createEl('a', {className: 'speed-adjust speed-down'});
            speedDown.appendChild(videojs.createEl('span', {className: 'icon-minus'}));
            speedDown.onclick = function() {
                player.speedDown();
            };
            player.on('clickspeeddown', speedDown.onclick);
            return speedDown;
        }
    };

    /**
     * Groups RewindButton and ForwardButton component.
     */
    videojs.MiddleButtonGroup = videojs.Component.extend();
    videojs.MiddleButtonGroup.prototype.options_ = {
        'children': {
            'rewindButton': {interval: 15},
            'forwardButton': {interval: 15}
        }
    };

    videojs.MiddleButtonGroup.prototype.createEl = function createEl() {
        return videojs.createEl('div', {className: 'playback-controls'});
    };

    videojs.MiddleButtonGroup.prototype.buildCSSClass = function buildCSSClass() {
        return 'vjs-speed-container-overlay ' + videojs.Component.prototype.buildCSSClass.call(this);
    };


    /**
    * Initialize the plugin.
    * @param options (optional) {object} configuration for the plugin
    */
    var middleSpeedControllerPlugin = function(options) {
        // Default middle control is a speed control.
        // Change this to 'play' to show a play button instead.
        var defaults = {
            middleControl: 'speed'
        };
        options = videojs.util.mergeOptions(defaults, options);


        var middleButtonGroupComponent = new videojs.MiddleButtonGroup(this, options);

        if(options.middleControl === 'speed') {

            var middleSpeedController = new videojs.MiddleSpeedController(this, options);
            middleSpeedController.updateSpeedLabel();
            middleButtonGroupComponent.addChild(middleSpeedController);
        } else if (options.middleControl === 'play') {
            middleButtonGroupComponent.addChild('playToggle');
        }

        this.player().middleButtonGroupComponent = middleButtonGroupComponent;

        this.addChild(middleButtonGroupComponent);
    };

    // register the plugin
    videojs.plugin('middlespeedcontroller', middleSpeedControllerPlugin);
})(window, window.videojs);
