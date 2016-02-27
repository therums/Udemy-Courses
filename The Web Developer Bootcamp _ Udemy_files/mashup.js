(function(window, vjs) {
    'use strict';

    var defaultOptions = {
        slides: [], // A list of {url: <slide url>, time: <video time>} objects, ordered chronologically
        length: 0   // Asset length
    };

    function createSlideThumbnails(player, options) {
        // Partitions the seekbar into intervals.
        // Slide appears as a thumbnail centered above the hovered interval.
        // Suppose the seekbar looks like this:
        // [   1   |   2   |   3   |   4   |   5   |]
        // Each | represents a time where the slide changes.
        // Each number represents an interval.
        // In the example there are 5 intervals. The last interval is number 5.
        // To ensure that the widths of the intervals sum to 100%,
        // interval 5 has width = 100 - SUM(widths of 1 through 4).
        var seekBar = player.controlBar.progressControl.seekBar.el();
        var intervals = vjs.Component.prototype.createEl('div', {className: 'vjs-intervals'});
        var lastInterval = 100, interval, intervalEl, thumbnailContainerEl;
        for(var i = 0; i < options.slides.length; i++) {
            if(i === options.slides.length - 1) {
                interval = lastInterval; // Makes sure width percentages sum to exactly 100%.
            } else {
                interval = Math.floor((options.slides[i + 1].time - options.slides[i].time) / options.length * 100);
            }
            lastInterval -= interval;
            intervalEl = vjs.Component.prototype.createEl('div', {className: 'vjs-interval'});
            intervalEl.style.width = interval + '%';
            thumbnailContainerEl = vjs.Component.prototype.createEl('div');
            thumbnailContainerEl.appendChild(vjs.Component.prototype.createEl('img', {src: options.slides[i].url}));
            intervalEl.appendChild(thumbnailContainerEl);
            intervals.appendChild(intervalEl);
        }
        // The lastChild is the seek handle, which has to be in front of everything else in order for scrubbing to work.
        seekBar.insertBefore(intervals, seekBar.lastChild);
    }

    function createOverlayEl(player) {
        // This element defines a clickable region in the bottom right corner of the player.
        // The minimized half of the video mashup appears below this element.
        // Clicking on this element toggles between video and slide.
        // The active-on-hover class is used to prevent the controlBar from fading away when hovering over this element.
        // We add mashup-window-content class to both the video player el and the video thumbnail el.
        var overlay = vjs.Component.prototype.createEl('div', {className: 'mashup-window-overlay'});
        overlay.addEventListener('mouseenter', function() {
            this.classList.add('active-on-hover');
            var els = player.el().getElementsByClassName('mashup-window-content');
            for(var i = 0; i < els.length; i++) {
                els[i].style.opacity = 1;
            }
        });
        overlay.addEventListener('mouseleave', function() {
            this.classList.remove('active-on-hover');
            var els = player.el().getElementsByClassName('mashup-window-content');
            for(var i = 0; i < els.length; i++) {
                els[i].style.opacity = 0.5;
            }
        });
        overlay.addEventListener('click', function() {
            if(player.slideWindow.el().classList.contains('mashup-window-content')) {
                player.slideWindow.minimizeVideo();
            } else {
                player.slideWindow.minimizeSlide();
            }
        });
        return overlay;
    }

    /* SlideWindow renders the current slide. This slide can toggle with the video;
     * the normal version is the full screen, the mashup-window-content version is the bottom right corner.
     */
    vjs.SlideWindow = vjs.Component.extend({
        init: function(player, options) {
            var el = vjs.Component.prototype.createEl('div', {
                className: 'vjs-slide-window'
            });
            this.imageEl = vjs.Component.prototype.createEl('img', {
                src: options.slides[0].url
            });
            el.appendChild(this.imageEl);
            el.addEventListener('click', function() {
                if(player.paused()) {
                    player.play();
                } else {
                    player.pause();
                }
            });
            options = vjs.util.mergeOptions({'el': el}, options);
            vjs.Component.call(this, player, options);
            this.slideNumber_ = 0;
            this.on(player, 'timeupdate', this.updateSlide);
        }
    });

    vjs.SlideWindow.prototype.minimizeVideo = function() {
        var slide = this.el(),
            video = this.player().el().getElementsByClassName('vjs-tech')[0],
            videoThumbnail = this.player().el().getElementsByClassName('vjs-poster')[0];
        slide.classList.remove('mashup-window-content');
        slide.style.opacity = 1;
        video.classList.add('mashup-window-content');
        videoThumbnail.classList.add('mashup-window-content');
    };

    vjs.SlideWindow.prototype.minimizeSlide = function() {
        var slide = this.el(),
            video = this.player().el().getElementsByClassName('vjs-tech')[0],
            videoThumbnail = this.player().el().getElementsByClassName('vjs-poster')[0];
        slide.classList.add('mashup-window-content');
        slide.style.opacity = 0.5;
        video.classList.remove('mashup-window-content');
        videoThumbnail.classList.remove('mashup-window-content');
    };

    vjs.SlideWindow.prototype.updateSlide = function() {
        // The line below is copied from Video.js source code,
        // for example see vjs.SeekBar.prototype.updateARIAAttributes.
        var time = Math.round(this.player().scrubbing ? this.player().getCache().currentTime : this.player().currentTime());
        var i, newSlideNumber;
        for(i = 0; i < this.options().slides.length; i++) {
            if(time < this.options().slides[i].time) {
                break;
            }
        }
        newSlideNumber = Math.max(0, i - 1);
        if(newSlideNumber !== this.slideNumber_) {
            this.slideNumber_ = newSlideNumber;
            this.imageEl.setAttribute('src', this.options().slides[this.slideNumber_].url);
            this.minimizeVideo();
        }
    };

    vjs.plugin('mashup', function(options) {
        options = vjs.util.mergeOptions(defaultOptions, options);
        createSlideThumbnails(this, options);
        this.el().appendChild(createOverlayEl(this));
        this.slideWindow = new vjs.SlideWindow(this, options);
        this.slideWindow.minimizeVideo();
        this.addChild(this.slideWindow);
    });
})(window, window.videojs);
