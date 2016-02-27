/* This plugin contains UI tweaks and bug fixes for videojs. */
(function(window, videojs) {
    'use strict';

    videojs.MediaTechController.prototype.onTap = function() {
        // The original videojs tap callback only toggles user activity state.
        // We override it so it also toggles between play/pause.
        this.player().userActive(!this.player().userActive());
        if(this.player().controls()) {
            if(this.player().paused()) {
                this.player().play();
            } else {
                this.player().pause();
            }
        }
    };

    function changeCaptionsOffToNone(player) {
        var captionsButtons = player.el().getElementsByClassName('vjs-captions-button');
        for(var i = 0; i < captionsButtons.length; i++) {
            var captionsOff = captionsButtons[i].getElementsByClassName('vjs-menu-item')[0];
            captionsOff.innerHTML = player.localize('None');
        }
    }

    function addTooltipToFullscreenToggle(player) {
        var fullscreenToggle = player.controlBar.fullscreenToggle;
        var menu = new videojs.Menu(player);
        menu.contentEl().appendChild(videojs.Component.prototype.createEl('li', {
            className: 'vjs-menu-title',
            innerHTML: player.localize('Fullscreen'),
            tabindex: -1
        }));
        fullscreenToggle.addChild(menu);
        fullscreenToggle.el().className += ' vjs-menu-button';
    }

    function enableActiveOnHoverControls(player, inactiveTimeoutTime) {
        var reportActivityIntervalTime = 250;

        var inactiveTimeout = null;
        if(typeof inactiveTimeoutTime === 'undefined') {
            inactiveTimeoutTime = 2500;
        }
        // When user hovers over a control, the controls should not fade away. To implement this
        // we report user activity whenever the player is hovering over at least one control. Note
        // that the timeout (250) should match the timeout used in videojs `listenForUserActivity`
        // method (see `activityCheck`).
        function markActiveOnHover(element) {
            element.addEventListener('mouseleave', function() {
                player.clearTimeout(inactiveTimeout);
                this.className = this.className.replace(' active-on-hover', '');
            });

            // remove active-on-hover class after inactiveTimeoutTime is passed, so we can hide controlbar,
            // even if user stays on it.
            element.addEventListener('mousemove', function() {
                player.clearTimeout(inactiveTimeout);

                var classNames = this.className.split(' ');
                if(classNames.indexOf('active-on-hover') === -1) {
                    this.className += ' active-on-hover';
                }

                inactiveTimeout = player.setTimeout(function() {
                    this.className = this.className.replace(' active-on-hover', '');
                }.bind(this), inactiveTimeoutTime);
            });
        }

        markActiveOnHover(player.controlBar.el());
        if(player.middleButtonGroupComponent) {
            markActiveOnHover(player.middleButtonGroupComponent.el());
        }
        player.setInterval(function() {
            if(player.el().getElementsByClassName('active-on-hover').length > 0) {
                player.reportUserActivity();
            }
        }, reportActivityIntervalTime);

    }

    function makePlayerResponsive(player) {
        var breakpoints = [320, 480, 768]; // Must be in sorted order.
        var views = { // Maps player width to responsive css class.
            768: 'tablet',
            480: 'mobile-landscape',
            320: 'mobile-portrait'
        };
        var currentView;
        var resize = function() {
            var playerWidth = player.el().offsetWidth, newView = 'max';
            for(var i = 0; i < breakpoints.length; i++) {
                if(playerWidth <= breakpoints[i]) {
                    newView = breakpoints[i];
                    break;
                }
            }
            if(newView !== currentView) {
                if(views[newView]) {
                    player.el().classList.add(views[newView]);
                }
                if(views[currentView]) {
                    player.el().classList.remove(views[currentView]);
                }
                currentView = newView;
            }
        };
        player.ready(resize); // Initial resize.
        window.addEventListener('resize', resize);
        player.on('dispose', function() {
            window.removeEventListener('resize', resize);
        });
    }

    // Scrubber animation lags for longer videos
    // because current time is updated every time the mouse moves over the seekbar.
    videojs.SeekBar.prototype._originalOnMouseMove = videojs.SeekBar.prototype.onMouseMove;
    videojs.SeekBar.prototype._debouncedOnMouseMove = _.debounce(
        videojs.SeekBar.prototype._originalOnMouseMove, 20
    );
    videojs.SeekBar.prototype.onMouseMove = function(event) {
        return this._debouncedOnMouseMove(event);
    };

    function fixVttCaptionParsing(player) {
        // Our .vtt caption files have two extra lines, "Kind" and "Language", that Video.js does
        // not know how to parse. This is probably our fault, since
        // https://developer.mozilla.org/en-US/docs/Web/API/Web_Video_Text_Tracks_Format
        // does not have any documentation about such lines. This method patches TextTrack so that
        // it can handle the extra lines.
        var parseRetries = 0;
        var parseCues = function(srcContent, textTrack) {
            // Adapts the parseCues method in the Video.js stable version
            // https://github.com/videojs/video.js/blob/stable/src/js/tracks/text-track.js
            // so it will work for our Video.js version.
            if(typeof window.WebVTT !== 'function') {
                if(parseRetries <= 2) {
                    parseRetries += 1;
                    window.setTimeout(function() {
                        parseCues(srcContent, textTrack);
                    }, 25);
                }
                return;
            }
            var parser = new window.WebVTT.Parser(window, new window.WebVTT.StringDecoder());
            parser.oncue = function(cue) {
                textTrack.cues().push({
                    id: cue.id,
                    index: textTrack.cues().length,
                    startTime: cue.startTime,
                    endTime: cue.endTime,
                    Ca: cue.endTime, // endTime uglifies to Ca
                    text: cue.text.replace('\n', '<br/>')
                });
            };
            parser.onparsingerror = function(error) {
                videojs.log.error(error);
            };
            parser.onflush = function() {
                textTrack.setReadyState(2);
                textTrack.trigger('loaded');
            };
            parser.parse(srcContent);
            parser.flush();
        };
        videojs.TextTrack.prototype.setReadyState = function(value) {
            // readyState_ is uglified to sa
            if(typeof this.readyState_ === 'undefined') {
                this.sa = value;
            } else {
                this.readyState_ = value;
            }
        };
        var origLoad = videojs.TextTrack.prototype.load;
        videojs.TextTrack.prototype.load = function() {
            // src looks like https://***.cloudfront.net/***.vtt?Expires=***&Signature=***&Key-Pair-Id=***
            if(this.src().toLowerCase().indexOf('vtt', this.src().indexOf('?') - 3) === -1) {
                origLoad.call(this);
                return;
            }
            if(this.readyState() !== 0) {
                return;
            }
            this.setReadyState(1);
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
                if(xmlhttp.readyState !== XMLHttpRequest.DONE) {
                    return;
                }
                if(xmlhttp.status === 200){
                    parseCues(xmlhttp.response, this);
                } else {
                    player.error(3); // Decode error.
                }
            }.bind(this);
            xmlhttp.open('GET', this.src(), true);
            xmlhttp.send();
        };
    }

    // On IE you can only change the playback rate when the video is playing.
    function fixPlaybackRateForIE(player) {
        player._originalPlaybackRateMethod = player.playbackRate;
        player._playbackRate = player.playbackRate();
        player.playbackRate = function playbackRate(rate) {
            if(typeof rate !== 'undefined') {
                this._playbackRate = rate;
            }
            if(!videojs.PlaybackRateMenuButton.prototype.playbackRateSupported.call(this)) {
                return this._playbackRate;
            }
            return this._originalPlaybackRateMethod(rate);
        };
        player.on('play', function() {
            this.playbackRate(this._playbackRate);
        });
    }

    function uiFixes(player, options) {
        changeCaptionsOffToNone(player);
        addTooltipToFullscreenToggle(player);
        enableActiveOnHoverControls(player, options.inactiveTimeoutTime);
        makePlayerResponsive(player);
    }

    var udemyPatches = function(options) {

        // Bug fix: When the player is in an iframe (e.g. old course taking page),
        // if you mouse down to scrub the video, move your mouse outside the iframe, and then
        // release the mouse, the next time your mouse enters the iframe the scrubber will
        // start following the mouse.
        document.addEventListener('mouseleave', function() {
            var event = new MouseEvent('mouseup');
            document.dispatchEvent(event);
        });

        fixVttCaptionParsing(this);
        fixPlaybackRateForIE(this);

        uiFixes(this, options);
    };

    videojs.plugin('udemypatches', udemyPatches);
})(window, window.videojs);
