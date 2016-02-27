$.widget( "ud.videojsReady", {

    options: {
        lectureId: null,
        userId: null,
        cdn: null,
        windowProxy: null, // This is set up and passed in by ud.iframe-ready
        videojsSetup: {}, // We manually set up the player with videojs(id, videojsSetup)
        downloadUrls: null,
        exitFullscreenOnComplete: true,
        thumbnail: null,
        udApi: null,
        udApiStat: null,
        autofocus: false
    },

    videoPlayer: null,
    playerTechMode: null,
    captionOptions: null,
    container: null,
    numErrors: 0, // Number of error we get when try to load the player source.

    _create: function() {
        $.extend(this.options, this.element.data());

        // Prevent right click so that users cannot download the video via right click -> save.
        this.element.on('contextmenu', function(event) {
            event.preventDefault();
        });

        this._applyUserSettings();
        this.videoPlayer = videojs(this.element.attr("id"), this.options.videojsSetup);
        this.videoPlayer.ready(this._ready.bind(this));

        this.videoPlayer.on('userinactive', this._userInactive.bind(this));
        this.videoPlayer.on('error', this._error.bind(this));
        this.videoPlayer.on('fullscreenchange', this._fullscreen.bind(this));
        this.videoPlayer.on('play', this._play.bind(this));
        this.videoPlayer.on('pause', this._pause.bind(this));
        this.videoPlayer.on('changeRes', this._qualityChange.bind(this));
        this.videoPlayer.on('ratechange', this._playbackRateChange.bind(this));
        this.videoPlayer.on('captionstrackchange', this._captionChange.bind(this));
        this.videoPlayer.on('seeked', this._seek.bind(this));
        this.videoPlayer.on('volumechange', this._volumeChange.bind(this));
        this.videoPlayer.on('ended', this._complete.bind(this));
        this.videoPlayer.on('seekforward', this._seekForwardRewindHandler.bind(this));
        this.videoPlayer.on('seekrewind', this._seekForwardRewindHandler.bind(this));

        //.on('firstplay') was being fired twice if autoplay feature is on.
        // so, we changed to .one('play') as suggested in
        // https://github.com/videojs/video.js/blob/master/docs/api/vjs.Player.md#firstplay-event
        this.videoPlayer.one('play', this._firstPlay.bind(this));

        // Safety handler in case player raises an error before it gets to ready handler.
        this.videoPlayer.one('error', this._revealPlayer.bind(this));
    },
    _destroy: function() {
        this.videoPlayer.dispose();
    },
    _ready: function() {
        this.container = $(this.videoPlayer.el());
        this.captionOptions = $('.vjs-captions-button .vjs-menu-content li.vjs-menu-item', this.container);
        // If techName is undefined then it means Video.js does not have any supported tech,
        // (one way this can happen is if it falls back to Flash but user disables Flash plugin)
        // in which case methods such as `poster` and `setVolume` do not work.
        this.playerTechMode = this.videoPlayer.techName;

        if(this.playerTechMode) {
            this.videoPlayer.poster(this.options.thumbnail);
        }

        this.videoPlayer.on('downloadlecture', this._downloadLecture.bind(this));

        // Register handlers related to the lecture
        if(this.options.lectureId) {
            $(window).on('gotoposition_' + this.options.lectureId, this._goToPosition.bind(this));
            $.event.trigger('lecturecontentready_' + this.options.lectureId);
        }

        this._trackingCallback({'type': 'viewed', 'mode': this.playerTechMode}); 

        // Set up menu audio control. Note that 'handleName' is disabled because Video.js does not calculate
        // vertical slider percentage correctly when there is a handle. See `vjs.Slider.prototype.update`.
        // It is checking width, but for vertical sliders it should check height.
        var volumeMenu = new videojs.VolumeMenuButton(this.videoPlayer, {'volumeBar': {vertical: true, 'handleName': null}});
        this.videoPlayer.controlBar.addChild(volumeMenu);

        this._initializePlayerSettings();
        this._enableMenuAim();
        this.container.find('.vjs-error-display').on('click', function() {
            // In case we get an error even though video plays fine, the error display blocks the video
            // controls. Therefore we close the display on click.
            $(this).css('display', 'none');
        });

        this._revealPlayer();

        // This line allows the player to initially* receive hotkey inputs when it is inside an iframe
        // (i.e. the user does not have to first click on the player in order for hotkeys to work).
        // * If the user focuses on something else, he will need to refocus on the player in order for
        // hotkeys to work again.
        if(this.options.autofocus) {
            this.videoPlayer.el().focus();
        }
    },
    _applyUserSettings: function() {
        var plugins = this.options.videojsSetup.plugins || {};
        if(plugins.resolutionSelector) {
            plugins.resolutionSelector.defaultRes = (
                $.cookie('resolution') || plugins.resolutionSelector.defaultRes
            );
        }
    },
    _initializePlayerSettings: function() {
        var userVolume = Number($.cookie('volume') || '0.5');
        if(userVolume >= 0 && userVolume <= 1 && this.playerTechMode) {
            this.videoPlayer.volume(userVolume);
        }
        var userCaption = $.cookie('caption');
        for(var i = 0; i < this.options.videojsSetup.tracks.length; i++) {
            if(this.options.videojsSetup.tracks[i].srclang === userCaption) {
                // Add 1 to the index to account for the first option (which turns off all captions).
                this.captionOptions.eq(i + 1).click();
                break;
            }
        }

        // Flash tech cannot set playback rate.
        if(this.playerTechMode === 'Html5') {
            this._setInitialPlayBackRate();
        }
    },
    _setInitialPlayBackRate: function _setInitialPlayBackRate() {
        var currentPlaybackRate = this.videoPlayer.playbackRate();
        var defaultPlaybackRate = Number($.cookie('playbackspeed'));
        var rates = this.options.videojsSetup.playbackRates || [];
        if(rates.indexOf(defaultPlaybackRate) === -1) {
            defaultPlaybackRate = currentPlaybackRate;
        }
        this.videoPlayer.playbackRate(defaultPlaybackRate);
        if(currentPlaybackRate === defaultPlaybackRate) {
            // Track the player's initial playback rate.
            // If current !== default the change is tracked in _playbackRateChange handler.
            this._trackingCallback({'type': 'playbackrate', 'speed': currentPlaybackRate});
        }
        this.videoPlayer.removeClass('vjs-playback-disabled');
    },
    _enableMenuAim: function() {
        $(".vjs-control-bar", this.container).menuAim({
            activate: function activateSubmenu(row) {
                $(row).find(".vjs-menu-content").css({'visibility': 'visible'});
            },
            deactivate: function deactivateSubmenu(row) {
                $(row).find(".vjs-menu-content").css({'visibility': 'hidden'});
            },
            exitMenu: function exitMenu() {
                return true;
            },
            rowSelector: ' div.vjs-menu-button',
            tolerance: 80,
            submenuDirection: 'above'
        });
    },

    _revealPlayer: function() {
        // Note that if this transition is done via display: none --> display: block then it
        // breaks the initial responsiveness of the player. We check the player width to decide which
        // responsive class to apply, and display: none implies width 0.
        $(this.videoPlayer.el()).next().fadeOut(100);
    },

    _goToPosition: function(event, data) {
        this.videoPlayer.currentTime(data.position);
    },

    _error: function(event) {
        var error = this.videoPlayer.error() || {};
        if(typeof error.code === 'undefined') {
            // This sometimes happens the first time the page is loaded.
            // The _error handler is triggered, but there is no Video.js error.
            return;
        }

        if(error.message === this.videoPlayer.localize(this.videoPlayer.options().notSupportedMessage)) {
            // Video.js raises {code: MEDIA_ERR_SRC_NOT_SUPPORTED, message: notSupportedMessage}
            // when it knows the source is not supported. MEDIA_ERR_SRC_NOT_SUPPORTED means
            // either network failure or unsupported format. To separate these, we change the code
            // to arbitrary 1052. Unfortunately if the player tech raises an error with code
            // MEDIA_ERR_SRC_NOT_SUPPORTED, we do not know whether the cause is network failure or
            // unsupported format, so the errors are not completely separated.
            error.code = 1052;
            $('#download').css('visibility', 'visible');
        }

        // See vjs.MediaError.defaultMessages and vjs.MediaError.errorTypes in the Video.js codebase.
        if(
            [error.MEDIA_ERR_DECODE, error.MEDIA_ERR_SRC_NOT_SUPPORTED].indexOf(error.code) !== -1 &&
            this.playerTechMode === 'Html5'
        ) {
            // Try to reload the player source with Flash tech.
            this.videoPlayer.options({'techOrder': ['flash']});
            this.videoPlayer.src(this.videoPlayer.options().sources);
            // Early exit to prevent logging the error twice.
            // If Flash does not work we will log {code: 1052, message: notSupportedMessage}.
            return;
        }
        if([error.MEDIA_ERR_NETWORK, error.MEDIA_ERR_SRC_NOT_SUPPORTED].indexOf(error.code) !== -1) {
            this.numErrors += 1;
            if(this.numErrors > 4) {
                // Unable to load the video after the 4th retry. Allow the video to be downloaded.
                $('#download').css('visibility', 'visible');
            } else {
                // Try to reload the player source. See vjs.MediaLoader.init in the Video.js codebase.
                setTimeout(function() {
                    this.videoPlayer.src(this.videoPlayer.options().sources);
                }.bind(this), 500 * this.numErrors * this.numErrors);
            }
        }

        var errorData = {
            cdn: this.options.cdn,
            retries: this.numErrors,
            code: error.code
        };

        this._getUdApiStat() && this._getUdApiStat().increment("videoplayer.error", errorData);

        // add extra data for sentry tracking
        errorData.message = error.message;
        errorData.lectureId = this.options.lectureId;

        Raven.captureMessage("videojs error code: " + error.code, {tags: errorData});

        // add extra data for nginx logging
        errorData.userId = this.options.userId;

        this._getUdApi() && this._getUdApi().call('/visits/me/page-events', {
            type: 'POST',
            data: {
                type: 'pageview',
                page: 'sitewide',
                event: JSON.stringify(errorData)
            }
        });

        this._trackingCallback({'type':'error'});
    },

    _firstPlay: function() {
        this._getUdApiStat() && this._getUdApiStat().increment("udemy-video-player.viewed", {"cdn": this.options.cdn});
        window.parent.$(window.parent.document).trigger("videoStarted");
    },

    _trackingCallback: function(data) {
        //sends the events to the outside frame
        data.player = 'videojs';
        data.mode = data.mode || this.playerTechMode;
        data.isHotkeyPressed = this.videoPlayer.isHotkeyPressed && this.videoPlayer.isHotkeyPressed();
        var message = {event: 'player_event_tracking', data: data};
        this.options.windowProxy && this.options.windowProxy.postMessage(JSON.stringify(message));
        this.videoPlayer.resetHotkeyPressed && this.videoPlayer.resetHotkeyPressed();
    },

    _fullscreen: function() {
        this._trackingCallback({'type':'fullscreenchange', 'isFullscreen':this.videoPlayer.isFullscreen()});
    },

    _play: function() {
        this._trackingCallback({'type':'play'});
    },

    _pause: function() {
        this._trackingCallback({'type':'pause'});
    },

    _captionChange: function(event) {
        var i;
        for(i=0; i<this.captionOptions.length; i++) {
            if(this.captionOptions.eq(i).hasClass('vjs-selected')) {
                break;
            }
        }
        var showing = (i >= 1); // The first captionOption (i=0) turns off all captions.
        var captionValue = showing ? this.videoPlayer.textTracks()[i - 1].language() : '';
        this._setUserPlayerSetting('caption', captionValue);
        this._trackingCallback({'type':'captionstrackchange', 'caption': (showing?'on':'off')});
    },

    _qualityChange: function() {
        var currentRes = this.videoPlayer.getCurrentRes();
        this._setUserPlayerSetting('resolution', currentRes);
        this._trackingCallback({'type':'qualityChange', 'quality': currentRes});
    },

    _seek: function() {
        this._trackingCallback({'type':'seek'});
    },

    _playbackRateChange: function() {
        var playbackRate = this.videoPlayer.playbackRate();
        this._setUserPlayerSetting('playbackspeed', playbackRate);
        this._trackingCallback({'type': 'playbackrate', 'speed': playbackRate});
    },

    _userInactive: function(event, data) {
        this._trackingCallback({'type': 'userinactive'});
    },

    _volumeChange: function() {
        var volume = Math.round(this.videoPlayer.volume() * 100) / 100;
        this._setUserPlayerSetting('volume', volume);
        this._trackingCallback({'type':'volume'});
    },

    _downloadLecture: function(event) {
        var downloadUrls = this.options.downloadUrls['Video'] || [];
        var currentRes = this.videoPlayer.getCurrentRes();
        for(var i=0; i<downloadUrls.length; i++) {
            if(downloadUrls[i].label === currentRes) {
                $("body").append('<iframe src="' + downloadUrls[i].file + '" style="display: none;"></iframe>');
                break;
            }
        }
        this._trackingCallback({'type': 'downloadlecture'});
    },

    _complete: function() {
        var checkFullscreen = function(callback) {
            if(this.options.exitFullscreenOnComplete && this.videoPlayer.isFullscreen()) {
                // On the old course taking page the CSS transitions fail in Chrome and Safari when the
                // user is in Fullscreen mode. To work around this, we exit Fullscreen mode before
                // notifying the outside that the lecture is completed.
                this.videoPlayer.on('fullscreenchange', function() {
                    if(!this.videoPlayer.isFullscreen()) {
                        // Ensures that we have finished exiting Fullscreen mode.
                        this.videoPlayer.off('fullscreenchange');
                        callback();
                    }
                }.bind(this));
                this.videoPlayer.exitFullscreen();
            } else {
                callback();
            }
        }.bind(this);
        checkFullscreen(function() {
            this.options.windowProxy && this.options.windowProxy.postMessage(JSON.stringify({'event':this.options.autoLoadNextEvent, 'data':{}}));
        }.bind(this));
    },

    _seekForwardRewindHandler: function(event) {
        this._trackingCallback({'type': event.type, data: event.interval});
    },

    _setUserPlayerSetting: function(setting, value) {
        $.cookie(setting, value, {expires: 30, path: '/'});
    },
    _getUdApi: function() {
        return this.options.udApi || UD.API_V2 || UD.LIGHTAPI_V2;
    },
    _getUdApiStat: function() {
        return this.options.udApiStat ? this.options.udApiStat : UD.LIGHTAPI_V2;
    }
});
