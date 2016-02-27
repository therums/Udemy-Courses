/* Forked from https://github.com/ctd1500/videojs-hotkeys on 07/17/15. */
(function(window, videojs) {
    'use strict';

    var defaults = {
        volumeStep: 0.1,
        seekStep: 15,
        enableMute: true,
        enableFullscreen: true,
        enableNumbers: true
    };

    var handlers = {
        13: togglePlayPause, // Enter
        32: togglePlayPause, // Spacebar
        37: speedDownOrPlayBackward, // Left Arrow
        39: speedUpOrPlayForward, // Right Arrow
        40: volumeDown, // Down Arrow
        38: volumeUp, // Up Arrow
        86: markAsViewed, // V key
        77: volumeMute, // M key
        70: toggleFullscreen // F key
    };

    function togglePlayPause(event, player) {
        event.preventDefault();
        if (player.paused()) {
            player.play();
            return 'play';
        } else {
            player.pause();
            return 'pause';
        }
    }

    function speedDownOrPlayBackward(event, player, options) {
        event.preventDefault();
        // speedDown and seekBackward are defined by speed-controller.js plugin.
        if(event.shiftKey && player.speedDown) {
            player.speedDown();
            return 'speeddown';
        } else if(player.seekBackward) {
            player.seekBackward(options.seekStep);
            return 'rewind';
        }
    }

    function speedUpOrPlayForward(event, player, options) {
        event.preventDefault();
        // speedUp and seekForward are defined by speed-controller.js plugin.
        if(event.shiftKey && player.speedUp) {
            player.speedUp();
            return 'speedup';
        } else if(player.seekForward) {
            player.seekForward(options.seekStep);
            return 'forward';
        }
    }

    function volumeDown(event, player, options) {
        event.preventDefault();
        player.volume(player.volume() - options.volumeStep);
        return 'volume';
    }

    function volumeUp(event, player, options) {
        event.preventDefault();
        player.volume(player.volume() + options.volumeStep);
        return 'volume';
    }

    function volumeMute(event, player, options) {
        if (options.enableMute) {
            if (player.muted()) {
                player.muted(false);
                return 'unmute';
            } else {
                player.muted(true);
                return 'mute';
            }
        }
    }

    function markAsViewed(event, player) {
        player.trigger('clickmarkasviewed');
        return 'markasviewed';
    }

    function toggleFullscreen(event, player, options) {
        if (options.enableFullscreen) {
            if (player.isFullscreen()) {
                player.exitFullscreen();
                return 'exitfullscreen';
            } else {
                player.requestFullscreen();
                return 'enterfullscreen';
            }
        }
    }

    function defaultHandler(event, player, options) {
        if ((event.which > 47 && event.which < 59) || (event.which > 95 && event.which < 106)) {
            if (options.enableNumbers) {
                event.preventDefault();
                var sub = event.which > 95 ? 96 : 48;
                player.currentTime(player.duration() * (event.which - sub) * 0.1);
            }
        }
    }

    var hotkeys = function(options) {
        var player = this, el = player.el(), _isHotkeyPressed = false;

        options = videojs.util.mergeOptions(defaults, options);

        // Set default player tabindex to handle keyup and doubleclick events
        if (!el.hasAttribute('tabIndex')) {
            el.setAttribute('tabIndex', '-1');
        }

        player.on('play', function() {
            // Fix allowing the YouTube plugin to have hotkey support.
            var ifblocker = el.querySelector('.iframeblocker');
            if (ifblocker && ifblocker.style.display === '') {
                ifblocker.style.display = 'block';
                ifblocker.style.bottom = '39px';
            }
        });

        var keyUp = function keyUp(event) {
            // When controls are disabled, hotkeys will be disabled as well
            if (!player.controls()) {
                return;
            }

            // Don't catch keys if any control buttons are focused
            var activeEl = event.relatedTarget || event.toElement || document.activeElement;
            if (activeEl === el ||
                activeEl === el.querySelector('.vjs-tech') ||
                activeEl === el.querySelector('.vjs-control-bar') ||
                activeEl === el.querySelector('.iframeblocker')) {

                _isHotkeyPressed = true;
                var handlerAction = (handlers[event.which] || defaultHandler)(event, player, options);
                if(handlerAction) {
                    player.trigger({type: 'keyuphotkey', keyCode: event.which, keyAction: handlerAction});
                }
            }
        };

        var doubleClick = function doubleClick(event) {

            // When controls are disabled, hotkeys will be disabled as well
            if (!player.controls()) {
                return;
            }

            // Don't catch clicks if any control buttons are focused
            var activeEl = event.relatedTarget || event.toElement || document.activeElement;
            if (activeEl === el ||
                activeEl === el.querySelector('.vjs-tech') ||
                activeEl === el.querySelector('.iframeblocker')) {

                if (options.enableFullscreen) {
                    if (player.isFullscreen()) {
                        player.exitFullscreen();
                    } else {
                        player.requestFullscreen();
                    }
                }
            }
        };

        player.on('keyup', keyUp);
        player.on('dblclick', doubleClick);

        // isHotkeyPressed flag is used to track whether an action was triggered by a hotkey
        // or by a player control.
        player.isHotkeyPressed = function isHotkeyPressed() {
            return _isHotkeyPressed;
        };
        player.resetHotkeyPressed = function resetHotkeyPressed() {
            _isHotkeyPressed = false;
        };

        return player;
    };

    videojs.plugin('hotkeys', hotkeys);

})(window, window.videojs);
