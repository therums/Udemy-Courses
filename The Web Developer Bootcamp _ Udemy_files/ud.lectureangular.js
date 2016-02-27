define(["jquery-widget-init", "handlebars.helpers", "handlebars-templates", "ud-link", "ud-me", "ud.raven",
    'ud.googleanalytics', 'ud.coursetakingtracker', "jquery.json", "easyXDM", "ud.api", "ud.api.v2", "swfobject"
], function($, Handlebars, handlebarsTemplates, udLink, udMe, Raven, udGoogleAnalytics, udCourseTakingTracker) {
    "use strict";

    $.widget("ud.ud_lectureangular", {
        options: {
            lectureId: null,
            autoLoad: true,
            courseId: null,
            courseUrl: null,
            instructorPreviewMode: null,
            gaId: null,
            loadParams: {
                video_only: null, // if true, only the video will be rendered for VideoMashups
                auto_play: null
            }
        },
        type: null,
        startPosition: null,
        position: null,
        total: null,
        lectureCompletedTimeout: null,
        lectureTrackTimeout: null,
        lectureTrackPause: false,
        windowProxy: null,
        autoPlay: true,
        lectureAPIBaseUrl: null,
        _playbackRateTimeout: null,
        _create: function() {
            for (var i in this.options) {
                if(typeof(this.element.data(i.toLowerCase())) != 'undefined'){
                    this.options[i] = this.element.data(i.toLowerCase());
                }
            }
            this._initHandlebarsTemplates();
            udCourseTakingTracker.setCurriculumObject('lecture', this.options.lectureId);

            this.lectureAPIBaseUrl = '/users/me/subscribed-courses/' + this.options.courseId + '/lectures/' + this.options.lectureId + '/';

            if(this.options.autoLoad){
                this.load();
            }

            $(window).on('lectureDownloaded_' + this.options.lectureId, this.lectureDownloadHandler.context(this));
            $(window).on('lectureProgress_' + this.options.lectureId, this.lectureProgressHandler.context(this));
            $(window).on('lectureCompleted_' + this.options.lectureId, this.lectureCompletedHandler.context(this));
            $(window).on('lecturecontentready_' + this.options.lectureId, this._contentReady.context(this));
            $(window).on('lectureautoloadnext_' + this.options.lectureId, this.autoLoadNextLecture.context(this));
            $(window).on('speedchange', this.logSpeedChange.bind(this));
        },
        _initHandlebarsTemplates: function() {
            this.installFlashPlayerTemplate = handlebarsTemplates['asset/install-flash'];
            this.embedIframeTemplate = handlebarsTemplates['lecture/embed-iframe'];
        },
        lectureDownloadHandler: function(event, data) {
            UD.API_V2.call('/users/me/subscribed-courses/' + this.options.courseId + '/completed-lectures', {
                type: 'POST',
                data: {
                    'lecture_id': this.options.lectureId,
                    'downloaded': true
                },
                success: function(response) {
                    // notify ud.dashboard widget here about this completed lecture so that it updates progress
                    $.event.trigger('lectureProgressCompleted', [this.options.lectureId]);
                }.bind(this)
            });
        },
        // data have to contain position and total
        // eq: data = {'position' :3, 'total': 5}
        lectureProgressHandler: function(event, data) {
            if(data && data.position && data.total && data.position > 0){
                UD.API.call('/lectures/' + this.options.lectureId + '/progress', {
                    type: "POST",
                    data: {'data': window.btoa(JSON.stringify(data))},
                    success: function(response) {
                        if(response.is_completed){
                            // notify ud.dashboard widget here about this completed lecture so that it updates progress
                            $.event.trigger('lectureProgressCompleted', [this.options.lectureId]);
                        }
                    }.context(this)
                });
            }
        },
        lectureCompletedHandler: function(event, data) {
            // notify ud.dashboard widget here about this completed lecture so that it updates progress
            $.event.trigger('lectureProgressCompleted', [this.options.lectureId]);
        },
        sendProgressData: function() {
            this.element.trigger('lectureProgress_' + this.options.lectureId, {'position': 1, 'total': 1, 'context': {'type': this.type}});
        },
        _track_player_event: function(event, data) {
            var playerEventType = data.type;
            var playerType = this.type.toLowerCase();
            switch(playerEventType){
                case 'play':
                case 'pause':
                case 'seek':
                case 'volume':
                    return udCourseTakingTracker.track('Video Controls', playerType + ' ' + playerEventType, null, null, {'dimension2': data.player + ' ' + this.playerMode});
                case 'playbackrate':
                    return this.logSpeedChange(event, data);
                case 'fullscreen':       // JWPlayer
                case 'fullscreenchange': // Video.js
                    return udCourseTakingTracker.track('Video Controls', playerType + ' fullscreen: ' + (data.isFullscreen ? 'on' : 'off'), null, null, {'dimension2': data.player + ' ' + this.playerMode});
                case 'qualityChange':
                    return udCourseTakingTracker.track('Video Controls', playerType + ' hd: ' + data.quality, null, null, {'dimension2': data.player + ' ' + this.playerMode});
                case 'captionsChange':      // JWPlayer
                case 'captionstrackchange': // Video.js
                    return udCourseTakingTracker.track('Video Controls', playerType + ' cc: ' + data.caption, null, null, {'dimension2': data.player + ' ' + this.playerMode});
                case 'seekforward':
                    return udCourseTakingTracker.track('Video Controls', playerType + ' seek-forward', null, null, {'dimension2': data.player + ' ' + this.playerMode});
                case 'seekrewind':
                    return udCourseTakingTracker.track('Video Controls', playerType + ' seek-rewind', null, null, {'dimension2': data.player + ' ' + this.playerMode});
                case 'viewed':
                    this.playerMode = data.mode;
                    return udCourseTakingTracker.track('Video Controls', playerType + ' view', null, null, {'dimension2': data.player + ' ' + this.playerMode});
            }

        },
        unload: function() {
            this.element.off('player_event_tracking');
            if(this.windowProxy){
                this.windowProxy.postMessage($.toJSON({event: 'destroyvideojs', data: {}}));
                this.windowProxy.destroy();
                this.windowProxy = null;
            }
            $(window).off('hashchange.' + this.options.lectureId);
            this.element.unbind();
            this.element.empty();
            clearTimeout(this.lectureCompletedTimeout);
        },
        load: function(callback) {
            this.element.on('player_event_tracking', this._track_player_event.bind(this));
            $(window).on('hashchange.' + this.options.lectureId, $.proxy(this._hashChangeHandler, this));
            udGoogleAnalytics.trackPageview(this.options.gaId, 'instructor', this.options.courseUrl + 'course-taking/lecture/' + this.options.lectureId);

            var getParams = $.extend(this.options.loadParams, {
                'fields[lecture]': 'asset,embed_url',
                'fields[asset]': 'asset_type,download_urls,title'
            });
            if(this.options.instructorPreviewMode){
                getParams.instructorPreviewMode = this.options.instructorPreviewMode;
            }
            UD.API_V2.call('/users/me/subscribed-courses/' + this.options.courseId + '/lectures/' + this.options.lectureId, {
                data: getParams,
                success: function(lecture) {
                    if(lecture && lecture.asset && lecture.asset.asset_type){
                        this.type = lecture.asset.asset_type;
                        udCourseTakingTracker.track('Lecture', 'lecture ' + this.type.toLowerCase() + '-view');
                        if(
                            this.type === 'VideoMashup' && !this.options.loadParams.video_only &&
                            typeof swfobject !== 'undefined' && swfobject.getFlashPlayerVersion().major === 0
                        ) {
                            // VideoMashup only works for Flash.
                            // If Flash is disabled then you only see the video, not the slides.
                            // We do not want to show only video when user expects mashup,
                            // so instead we ask user to install Flash.
                            return this.element.html(this.installFlashPlayerTemplate());
                        }
                        var assetHtml = $(this.embedIframeTemplate(lecture));
                        this._setupWindowProxy(assetHtml);
                        this.markAsViewed();
                        this.setPositionHandler();
                        callback && callback(lecture);
                    }
                }.context(this),
                error: function(response) {
                    if(response.status === 405){
                        var buyNowPopupUrl = udLink.to('course', 'buynow-popup', {courseId: this.options.courseId});
                        var html = '<a class="ud-popup" id="buynow-popup" data-autoopen="true" data-closeBtn="false" data-modal="true" href="' + buyNowPopupUrl + '" style="display: none;"></a>';
                        $('body').append(html);
                        $("#buynow-popup").ud_popup();
                    } else {
                        Raven.captureMessage('Api error for GET /lectures/{id}/content', { extra: response });
                        window.alert("Unable to load content.");
                    }
                }.context(this)
            });

        },
        markAsViewed: function() {
            var url =this.lectureAPIBaseUrl + 'view-logs';
            if(!UD.API_V2.isCalledBefore(url)) {
                UD.API_V2.call(url, { type:"POST"});
            }
        },
        setPositionHandler: function() {
            switch (this.type) {
                case "VideoMashup":
                case "Video":
                case "Audio":
                    this.total = 0;
                    this.position = 0;
                    this.element.off('positionHandler_' + this.options.lectureId);
                    this.element.on('positionHandler_' + this.options.lectureId, function(event, data) {
                        this.total = data.total;
                        this.position = data.position;
                    }.context(this));
                    break;
                case 'Article':
                case 'File':
                case 'Image':
                case 'ImportContent':
                case 'RecordedSession':
                case 'IFrame':
                    this.lectureCompletedTimeout = setTimeout(function() {
                        this.sendProgressData.call(this);
                    }.context(this), 10000);
                    break;
                case 'EBook':
                case 'Presentation':
                    this.element.on('positionHandler_' + this.options.lectureId, function(event, data) {
                        this.total = data.total;
                        this.position = data.position;
                    }.context(this));
                    break;
            }
        },
        getPosition: function() {
            return this.position;
        },
        getTotal: function() {
            return this.total;
        },
        renderPosition: function(position) {
            switch (this.type) {
                case "Video":
                case "VideoMashup":
                case "Audio":
                    return this._renderTime(position);
                    break;
                case 'EBook':
                case 'Presentation':
                    return this._renderPage(position);
                default:
                    return null;
            }
        },
        _renderTime: function(seconds) {
            if(seconds >= 0){
                seconds = Math.round(seconds);
                var twoDigit = function(n) {
                    return n < 10 ? "0" + n : n;
                };
                var blocks;
                for (blocks = []; seconds > 60; seconds = Math.floor(seconds / 60)) {
                    blocks.push(twoDigit(seconds % 60));
                }
                blocks.push(twoDigit(seconds));
                if(blocks.length < 2) blocks.push("00");
                return blocks.reverse().join(":");
            } else {
                return "";
            }
        },
        _renderPage: function(pageNumber) {
            if(pageNumber >= 0){
                return 'Page ' + pageNumber;
            } else {
                return "";
            }
        },
        _contentReady: function(event, data) {
            this.loadWindowOnBeforeUnload();
            $(window).off('gotoposition_' + this.options.lectureId);
            $(window).on('gotoposition_' + this.options.lectureId, $.proxy(this.gotoPosition, this));
            this._hashChangeHandler();
        },
        /**
         * data should be json object
         *  required attr:
         *      int position
         *  optional:
         *      bool autostart
         * @param data
         */
        gotoPosition: function(event, data) {
            if(this.windowProxy){
                var message = {event: 'gotoposition_' + this.options.lectureId, data: data};
                this.windowProxy.postMessage($.toJSON(message));
            }
        },
        _onBeforeUnload: function() {
            var maxLastPosition;
            var lastPosition = parseInt(this.position);
            if(!lastPosition)
                return;

            switch (this.type) {
                case "Video":
                case "Audio":
                case "VideoMashup":
                    maxLastPosition = this.total * .95;
                    break;
                default:
                    maxLastPosition = this.total;
            }

            if(lastPosition > maxLastPosition){
                lastPosition = 0;
            }

            var fieldFilterParam = '?fields[lecture]=id';
            UD.API_V2.call(this.lectureAPIBaseUrl + fieldFilterParam, {
                type: 'PATCH',
                data: {'last_watched_second': lastPosition}
            });

            // notify ud.dashboard widget here since this lecture's last position is changed so that it can make update in its internal state
            $.event.trigger('lectureLastPositionChanged', [this.options.lectureId, lastPosition]);
        },
        autoLoadNextLecture: function() {
            // notify ud.dashboard widget here about it knows that this lecture is finished
            $.event.trigger('lectureCompleted', [this.options.lectureId]);
        },
        logSpeedChange: function(event, data) {
            // The UI for changing the playback rate is designed such that in order to change from
            // e.g. 1x to 2x you have to cycle through 1.25x, 1.5x, etc. In order to filter out
            // these intermediate rates we only track when the rate is consistent for at least
            // two seconds.
            if(this._playbackRateTimeout) {
                clearTimeout(this._playbackRateTimeout);
            }
            this._playbackRateTimeout = setTimeout(function() {
                UD.API_V2.call('/visits/me/page-events', {
                    type: 'POST',
                    data: {
                        type: 'trackclick',
                        page: 'lecture',
                        event: JSON.stringify({
                            courseId: this.options.courseId,
                            lectureId: this.options.lectureId,
                            userId: udMe.id,
                            speed: data.speed
                        })
                    }
                });
                udCourseTakingTracker.track('Video Controls', 'video playback-rate: ' + data.speed, null, null, {'dimension2': data.player + ' ' + this.playerMode});
            }.bind(this), 2000);
        },
        loadWindowOnBeforeUnload: function(message) {
            $(window).off('beforeunload.' + this.options.lectureId);
            $(window).on('beforeunload.' + this.options.lectureId, function() {
                this._onBeforeUnload();
            }.context(this));
        },
        _setupWindowProxy: function(iframeHtml) {
            this.windowProxy = new easyXDM.Socket({
                remote: iframeHtml.attr('src'),
                container: this.element.get(0),
                onReady: function() {
                    var attributes = iframeHtml.prop('attributes');
                    var iframe = this.element.find('iframe').eq(0);
                    $.each(attributes, function() {
                        if(this.name != "src"){
                            iframe.attr(this.name, this.value);
                        }
                    });
                }.context(this),
                onMessage: function(message, origin) {
                    var data = $.evalJSON(message);
                    this.element.trigger(data.event, data.data);
                }.context(this)
            });
        },
        _hashChangeHandler: function() {
            var url = window.location.hash;
            var urlRegex = "^#\/?((quiz|lecture|chapter|certificate)/([0-9]+)(:([0-9]+))?)?";
            var match = url.match(urlRegex);
            var startPosition = null;

            if(!match || typeof match[5] === "undefined"){
                return;
            }

            $.event.trigger('gotoposition_' + this.options.lectureId, {position: match[5], autostart: true});
        }
    });
});
