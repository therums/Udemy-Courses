define(['jquery-widget-init', 'handlebars.helpers', 'handlebars-templates', '../common/constants',
    'ud.raven', 'autosize', 'ud.googleanalytics', 'ud.coursetakingtracker', 'ud-config', 'ud-me',
    'ng-root/ud-angular-loader', 'jquery.rating', 'prettify', 'ud.api', 'ud.api.v2', 'ud.extras',
    'ud.form', 'ud.lectureangular', 'ud.notetaking', 'ud.popup', 'ud.initializer'
], function($, Handlebars, handlebarsTemplates, constants, Raven, autosize, udGoogleAnalytics,
            udCourseTakingTracker, udConfig, udMe, udAngularLoader) {
    'use strict';
    /*eslint camelcase: [2, {properties: "never"}]*/
    $.widget('ud.ud_dashboard', {
        options: {
            courseId: null,
            courseUrl: null,
            isInstructor: null,
            instructorPreviewMode: null,
            autoPlay: 1,
            gaId: null
        },
        notewidget: null,
        extraswidget: null,
        dashboard: null,
        courseProgress: null,
        courseFeedbacks: null,
        courseFeedbackNumCompletedLectures: 0,
        feedbackScore: null,
        courseFeedbackTimer: null,
        courseFeedbackRemainingSeconds: 20,
        feedbackCommentText: null,
        feedbackCommentOption: null,
        lowScoreLabel: null,
        highScoreLabel: null,
        currentIndex: -1,
        timelineElement: null, // dom element
        timeline: [], // array of elements storing data, index, type
        reverseIndex: {},
        sidebarCloseToggledByUser: false,
        clickedAnotherTab: false,
        isRetakingQuiz: false,
        $window: null,
        _create: function(){
            $.extend(this.options, this.element.data());

            this.$window = $(window);
            this._initHandlebarsTemplates();

            this.npsRecentLow = false;
            this.updateFeedbackForm();
            UD.API_V2.call('/courses/' + this.options.courseId +
                '?fields[course]=num_negative_feedbacks_last_month', {
                type: 'GET',
                success: function (data) {
                    this.npsRecentLow = data.num_negative_feedbacks_last_month > 50;
                    this.updateFeedbackForm();
                }.bind(this)
            });

            this.dashboard = $('.dashboard-v39');
            this.notewidget = $('.ud-notetaking', this.element);
            this.extraswidget = $('.ud-extras', this.element);
            this.timelineElement = $('ul#timeline', this.element);

            this.element.off('click', '.sidebar-container .tab-materials')
                .on('click', '.sidebar-container .tab-materials', this.onTabClick.bind(this));
            this.element.off('click', '.sidebar-container .tab-discussions')
                .on('click', '.sidebar-container .tab-discussions', this.onTabClick.bind(this));
            this.element.off('click', '.sidebar-container .tab-notes')
                .on('click', '.sidebar-container .tab-notes', this.onTabClick.bind(this));

            this.$window.on('curriculumLoaded', this.onCurriculumLoaded.bind(this));
            this.$window.on('lectureProgressCompleted', this.onLectureProgressCompleted.bind(this));
            this.$window.on('lectureLastPositionChanged', this.onLectureLastPositionChanged.bind(this));
            this.$window.on('lectureCompleted', this.onLectureCompleted.bind(this));
            this.$window.on('quizProgressChanged', this.onQuizCompleted.bind(this));
            this.$window.on('courseProgressUpdated', this.onCourseProgressUpdated.bind(this));
            this.$window.on('courseFeedbacksLoaded', this.onCourseFeedbacksLoaded.bind(this));
            this.$window.on('initLectureTakingFinished', this.onInitLectureTakingFinished.bind(this));
            this.$window.on('showDashboard', this.showDashboard.bind(this));
            this.$window.on('showSupplementaryBtn', this.showSupplementaryBtn.bind(this));
            this.$window.on('hideSupplementaryBtn', this.hideSupplementaryBtn.bind(this));

            this.$window.on('retakeQuiz', function(event, eventData) {
                this.isRetakingQuiz = true;
                if(eventData.quizId) {
                    this.prepareQuiz(eventData.quizId);
                }
            }.bind(this));

            $('.sidebar', this.element).on( 'webkitTransitionEnd transitionend oTransitionEnd MSTransitionEnd', function() {
                this.$window.resize();
            }.bind(this));

            this.element.on('click', '.sidebar a.close-btn', function() {
                if(this.element.hasClass('off')){
                    udCourseTakingTracker.track('Lecture', 'sidebar open');
                    this.element.removeClass('off');
                } else {
                    udCourseTakingTracker.track('Lecture', 'sidebar close');
                    this.element.addClass('off');
                }
                this.sidebarCloseToggledByUser = true;
                return false;
            }.bind(this));

            this.element.on('click', '.mark', this.markAsCompletedToggle.bind(this));
            $('#go-back', this.element).on('click', this.goBackClickHandler.bind(this));

            this.element.on('click', 'a.autoplay', function(event) {
                event.preventDefault();
                var elem = $(event.currentTarget);
                var wasOn = elem.hasClass('on');
                this.options.autoPlay = !wasOn;
                udCourseTakingTracker.track('Lecture', 'autoplay-' + (this.options.autoPlay ? 'on' : 'off'));

                var data = {
                    setting: 'lectureAutoStart',
                    value: this.options.autoPlay ? 1 : 0,
                };
                this.getLectureWidget(this.timeline[this.currentIndex].id)
                    .data('ud-ud_lectureangular').autoPlay = this.options.autoPlay;
                UD.API_V2.call('/users/me/settings', {
                    type: 'POST',
                    data: data
                });

                if(wasOn) {
                    elem.removeClass('on');
                    $('.autoplay-text-on', elem).addClass('none');
                    $('.autoplay-text-off', elem).removeClass('none');
                } else {
                    elem.addClass('on');
                    $('.autoplay-text-on', elem).removeClass('none');
                    $('.autoplay-text-off', elem).addClass('none');
                }
            }.bind(this));

            // Call udAngularLoader() manually now that we're ready for it.
            $('.ud-angular-loader-for-course-taking-dashboard')
                .removeClass('ud-angular-loader-for-course-taking-dashboard')
                .addClass('ud-angular-loader');
            udAngularLoader();
        },
        destroy: function(){
            this.$window.off('curriculumLoaded');
            this.$window.off('lectureProgressCompleted');
            this.$window.off('lectureLastPositionChanged');
            this.$window.off('lectureCompleted');
            this.$window.off('courseProgressUpdated');
            this.$window.off('initLectureTakingFinished');
            this.$window.off('showDashboard');
            this.$window.off('showSupplementaryBtn');
            this.$window.off('hideSupplementaryBtn');
        },
        _initHandlebarsTemplates: function() {
            this.lectureTemplate = handlebarsTemplates['course-taking/lecture'];
            this.progressTemplate = handlebarsTemplates['course-taking/progress'];
            this.chapterTemplate = handlebarsTemplates['course-taking/chapter'];
            this.quizTemplate = handlebarsTemplates['quiz/quiz'];
            this.quizViewTemplate = handlebarsTemplates['quiz/quiz-view'];
            this.codingExerciseViewTemplate = handlebarsTemplates['quiz/coding-challenge/intro'];
            this.quizNotPublishedViewTemplate = handlebarsTemplates['quiz/quiz-view-not-published'];
            this.quizLockedViewTemplate = handlebarsTemplates['quiz/quiz-view-locked'];
            this.genericErrorTemplate = handlebarsTemplates['course-taking/generic-error'];

            this.feedbackFormTemplate = handlebarsTemplates['course/nps/variant_default'];
        },
        onUrlChange: function(e) {
            this._returnBetaUserToBeta(function() {
                var obj;
                var url = window.location.hash;
                var urlRegex = '^#\/?((quiz|lecture|chapter)/([0-9]+)(:([0-9]+))?)?\/?';
                var match = url.match(urlRegex);

                if(match && ['lecture', 'chapter', 'quiz'].indexOf(match[2]) !== -1 && typeof match[3] !== 'undefined') {
                    obj = this.timeline[this.reverseIndex[match[2] + match[3]]];
                    if(typeof obj === 'undefined') {
                        return;
                    }
                    obj.data.startPosition = 0;
                    if(typeof match[5] !== 'undefined') {
                        obj.data.startPosition = match[5];
                    }

                    this.element.removeClass('none');
                    this.dashboard.addClass('none');
                    if(this.currentIndex !== obj.index) {
                        this.showContent(obj);
                    }

                    if(typeof e === 'undefined' || (typeof e.originalEvent.oldURL !== 'undefined' &&
                        e.originalEvent.oldURL.indexOf('/material') === -1)) {

                        $.event.trigger(
                            'gotoposition_' + obj.id,
                            {position: obj.data.startPosition, autostart: true}
                        );
                    }
                    return;
                }

                this.showDashboard();
            }.bind(this));
        },
        markedCompletedByUser: function(callbackFn) {
            if(this.options.isInstructor) {
                return;
            }

            var lectureId = this.timeline[this.currentIndex].id;
            this.courseProgress.num_completed_lectures++;
            UD.API_V2.call('/users/me/subscribed-courses/' + this.options.courseId + '/completed-lectures', {
                type: 'POST',
                data: {
                    'lecture_id': lectureId
                },
                success: function() {
                    if(callbackFn) {
                        callbackFn();
                    }
                    this.loadCourseProgress();
                }.bind(this)
            });
        },
        markedUncompletedByUser: function(callbackFn){
            var lectureId = this.timeline[this.currentIndex].id;
            UD.API_V2.call('/users/me/subscribed-courses/' + this.options.courseId + '/completed-lectures/' + lectureId, {
                type: 'DELETE',
                success: function() {
                    if(callbackFn) {
                        callbackFn();
                    }
                    this.loadCourseProgress();
                }.bind(this)
            });
        },
        updateTimelineWithProgress: function(courseProgress) {
            if(this.options.isInstructor) {
                return;
            }

            this.courseProgress = courseProgress;

            if(!this.timeline.length) {
                return;
            }

            $('.completion-ratio', this.element).text(courseProgress.completion_ratio + '%');

            $('li', this.timelineElement).each(function(i, el){
                var progressObj = courseProgress.lectures_progress[$(el).data('lectureid')] || {status: 'viewed'};
                if(progressObj.status === 'completed'){
                    $('.mark', $(el)).addClass('read');
                    $(el).addClass('completed');
                } else {
                    $('.mark', $(el)).removeClass('read');
                    $(el).removeClass('completed');
                }
            });
        },
        loadCourseProgress: function() {
            if(this.options.isInstructor) {
                return;
            }

            this.$window.trigger('updateCourseProgress');
        },
        loadCourseFeedbacks: function() {
            if(this.options.isInstructor || (this.courseFeedbacks && this.courseFeedbacks.count)) {
                return;
            }

            this.$window.trigger('loadCourseFeedbacks');
        },
        onCurriculumLoaded: function(event) {
            this.renderTimeline(event.curriculum);
        },
        onCourseProgressUpdated: function(event) {
            this.updateTimelineWithProgress(event.courseProgress);
        },
        onCourseFeedbacksLoaded: function(event) {
            this.courseFeedbacks = event.courseFeedbacks;
        },
        onInitLectureTakingFinished: function() {
            this.onUrlChange();
        },
        renderTimeline: function(curriculum) {
            if(this.timeline.length > 0) {
                this.$window.trigger('timelineRendered');
                return;
            }
            var index = 0;
            var progressElement;
            for(var i in curriculum) {
                var obj = curriculum[i];
                obj.is_report_abuse_enabled = udConfig.features.report_abuse;
                obj.courseId = this.options.courseId;
                var tmp = {
                    id: obj.id,
                    course_id: this.options.courseId,
                    type: obj._class,
                    data: obj,
                    index: index,
                    element: null
                };
                if(obj._class === 'lecture') {
                    tmp.element = $(this.lectureTemplate(obj));
                    tmp.element.ud_initialize();

                    // hide autoplay button if asset type is not Video, Audio and VideoMashup
                    if(obj.asset) {
                        switch(obj.asset.asset_type) {
                            case 'Video':
                            case 'Audio':
                            case 'VideoMashup':
                                break;
                            default:
                                tmp.element.find('a.autoplay').remove();
                                break;
                        }
                    }

                    this.timelineElement.append(tmp.element);
                    this.timeline.push(tmp);
                    this.reverseIndex[obj._class + obj.id] = index++; // ex: ['lecture123']=>...

                    progressElement = {
                        id: obj.id,
                        type: 'progress',
                        autoSkipIn: 2000,
                        data: {
                            progress: 70
                        },
                        index: index,
                        element: null
                    };
                    progressElement.element = $(this.progressTemplate(progressElement.data));
                    this.timelineElement.append(progressElement.element);
                    this.timeline.push(progressElement);
                    this.reverseIndex[progressElement.type + obj.id] = index++; // ex: ['progress123']=>...
                    // Course Taking progress item
                } else if(obj._class === 'chapter') {
                    tmp.element = $(this.chapterTemplate({'chapter': obj}));
                    this.timelineElement.append(tmp.element);
                    this.timeline.push(tmp);
                    this.reverseIndex[obj._class + obj.id] = index++; // ex: ['chapter123']=>...
                } else if(obj._class === 'quiz') {
                    tmp.element = $(this.quizTemplate(obj));

                    this.timelineElement.append(tmp.element);
                    this.timeline.push(tmp);
                    this.reverseIndex[obj._class + obj.id] = index++; // ex: ['quiz123']=>...

                    progressElement = {
                        id: obj.id,
                        type: 'progress',
                        autoSkipIn: 2000,
                        data: {
                            progress: 70
                        },
                        index: index,
                        element: null
                    };
                    progressElement.element = $(this.progressTemplate(progressElement.data));
                    this.timelineElement.append(progressElement.element);
                    this.timeline.push(progressElement);
                    this.reverseIndex[progressElement.type + obj._class + obj.id] = index++; // ex: ['progress123']=>...
                }
            }

            if(this.courseProgress) {
                this.updateTimelineWithProgress(this.courseProgress);
            }

            this.timelineElement.off('click', '.prev-lecture')
                .on('click', '.prev-lecture', this.prev.bind(this));
            this.timelineElement.off('click', '.next-lecture')
                .on('click', '.next-lecture', {sendGaEvent: true}, this.next.bind(this));
            this.timelineElement.off('click', '.view-supplementary')
                .on('click', '.view-supplementary', this.viewSupplementary.bind(this));

            this.$window.trigger('timelineRendered');
            this.onUrlChange();
        },
        showSupplementaryBtn: function() {
            $('.view-supplementary').removeClass('none');
        },
        hideSupplementaryBtn: function() {
            $('.view-supplementary').addClass('none');
        },
        showDashboard: function(){
            udGoogleAnalytics.trackPageview(this.options.gaId, 'instructor', this.options.courseUrl + 'course-dashboard/');
            this.dashboard.removeClass('none');
            this.element.addClass('none');
            var current = this.timeline[this.currentIndex];

            if(current && current.type !== 'chapter' && current.type !== 'quiz') {
                this.$window.trigger('beforeunload.' + current.id);
                if(current.type === 'lecture') {
                    this.getLectureWidget(current.id).data('ud-ud_lectureangular').unload();
                }
            }
            this.currentIndex = -1;
        },
        show: function(obj){
            if(!obj){
                window.location.hash = '';
                return;
            }
            switch(obj.type){
                case 'progress':
                    this.showContent(obj);
                    break;
                case 'lecture':
                    var lectureUrl = '/lecture/' + obj.id +
                    (obj.data.startPosition ? (':' + obj.data.startPosition) : '');
                    this.$window.trigger('changeRouteFromOutside', lectureUrl);
                    break;
                default:
                    window.location.hash = '/' + obj.type + '/' + obj.id;
                    break;
            }
        },
        showContent: function(obj) {
            switch(obj.type) {
                case 'progress':
                    this.scrollToContent(obj.index);
                    if(this.canSendCourseFeedback()) {
                        this.showFeedbackForm(obj);
                    } else {
                        setTimeout(this.next.bind(this, null, {sendGaEvent: false}), obj.autoSkipIn);
                    }
                    if(this.sidebarCloseToggledByUser === false) {
                        $(this.element).removeClass('off');
                    }
                    break;
                case 'lecture':
                    this.hideSupplementaryBtn();
                    this.prepareLecture(obj);
                    this.scrollToContent(obj.index);
                    if(this.sidebarCloseToggledByUser === false) {
                        $(this.element).removeClass('off');
                    }
                    break;
                case 'quiz':
                    this.prepareQuiz(obj.id);
                    this.scrollToContent(obj.index);
                    if(this.sidebarCloseToggledByUser === false) {
                        $(this.element).addClass('off');
                    }
                    break;
                default:
                    this.scrollToContent(obj.index);
                    break;
            }
        },
        _returnBetaUserToBeta: function(callback) {
            // If user beta setting is 'opt-tmp', then user opted out of beta temporarily in order
            // to view an unsupported curriculum item. This method sends such a user back to the beta
            // by changing the setting back to 'opt-in'.
            callback = callback || function() {};
            if(UD.me.settings.course_beta_opt_in !== 'opt-tmp') {
                return callback();
            }
            UD.me.settings.course_beta_opt_in = 'opt-in'; // Ensure api won't be called twice.
            UD.API_V2.call('/users/me/course-beta-settings/', {
                type: 'POST',
                data: {'value': 'opt-in'},
                success: callback,
                error: function() {
                    UD.me.settings.course_beta_opt_in = 'opt-tmp'; // Restore original value.
                    callback();
                }
            });
        },
        next: function(event, data){
            if(event) {
                event.preventDefault();
                data = data || event.data;
            }

            var current = this.timeline[this.currentIndex];

            if(current && current.type === 'lecture') {
                this.$window.trigger('beforeunload.' + current.id);
            }

            var next = this.timeline[this.currentIndex + 1];
            if(next) {
                $(next.element).removeClass('off');
            }

            if(data && data.sendGaEvent) {
                if(next && current && ['lecture', 'chapter', 'quiz'].indexOf(current.type) !== -1) {
                    var category;
                    if(current.type === 'chapter'){
                        category = 'Section Continue';
                    } else {
                        category = data.autoplay ? 'Lecture Autoplay' : 'Lecture Next';
                    }
                    udCourseTakingTracker.track(category, 'lecture visit');
                }
            }

            this.show(next);
        },
        prev: function(event) {
            event.preventDefault();
            var current = this.timeline[this.currentIndex];

            if(current && current.type === 'lecture') {
                this.$window.trigger('beforeunload.' + current.id);
            }

            var idxToLoad = this.currentIndex - 1;
            this.timeline[idxToLoad].element.addClass('off');
            while(idxToLoad >= 0 &&
                    (this.timeline[idxToLoad].type === 'progress' ||
                      this.timeline[idxToLoad].type === 'chapter')){
                idxToLoad -= 1;
            }

            if(idxToLoad < 0) {
                return;
            }

            var prev = this.timeline[idxToLoad];

            if(prev) {
                udCourseTakingTracker.track('Lecture Previous', prev.type + ' visit');
            }

            this.show(prev);
        },
        goBackClickHandler: function() {
            udCourseTakingTracker.track('Lecture', 'dashboard visit');
        },
        viewSupplementary: function() {
            udCourseTakingTracker.track('Lecture Resources', 'resource visit');
            this.element.removeClass('off');
            this.clickedAnotherTab = false;
            this.element.find('.sidebar-container .tab-materials')
                .attr('checked', 'checked');
        },
        scrollToContent: function(index){
            if(this.currentIndex === index){
                return;
            }
            this.timelineElement.css('top', (-100 * index) + '%');
            this.onChangeIndex(this.currentIndex, index);
            this.currentIndex = index;
        },
        canSendCourseFeedback: function() {
            if(this.options.isInstructor || !this.courseFeedbacks || !this.courseProgress) {
                return false;
            }
            if(this.courseFeedbacks.count === 0) {
                return this.courseProgress.num_completed_lectures > 2;
            } else {
                this.courseFeedbackNumCompletedLectures = this.courseFeedbacks.results[0].num_completed_lectures;
                if(this.courseFeedbackNumCompletedLectures < 8 && this.currentIndex !== this.timeline.length - 1) {
                    return !this.courseFeedbacks.results[0].score && this.courseProgress.num_completed_lectures > 7;
                } else {
                    return !this.courseFeedbacks.results[0].score
                        && this.currentIndex === this.timeline.length - 1;
                }
            }
        },
        updateFeedbackForm: function() {
            this.showCommentText = Math.random() * 100 < (this.npsRecentLow ? 80 : 50);
        },
        showFeedbackForm: function(obj) {
            this.hideFeedbackForm();
            var formDiv = $('.feedback-form', obj.element);
            formDiv.html(this.feedbackFormTemplate);
            formDiv.css('height', '70%');
            $('.progress-top', obj.element).css('height', '30%');

            $('input[name=score]:radio', obj.element).change(this.onFeedbackScoreChanged.bind(this));
            $('.score-button', obj.element).click(this.onFeedbackScoreChanged.bind(this));
            this.submitFeedbackBtn = $('.send-feedback', obj.element);
            this.submitFeedbackBtn.on('click', this.sendFeedbackBtn.bind(this));
            var askMeLaterBtn = $('.ask-feedback-later');
            var askMeAtTheEndBtn = $('.ask-feedback-at-the-end');
            askMeLaterBtn.add(askMeAtTheEndBtn).addClass('none');
            if(!this.courseFeedbackNumCompletedLectures) {
                askMeLaterBtn.removeClass('none').on('click', this.askFeedbackLaterBtn.bind(this));
            } else if(this.courseFeedbackNumCompletedLectures < 8) {
                askMeAtTheEndBtn.removeClass('none').on('click', this.askFeedbackLaterBtn.bind(this));
            }
            $('.star', this.element).on('click', this.npsStarRatingChanged.bind(this));
            $("input[name=rating]:radio").change(this.npsFractionalStarRatingChanged.bind(this));
            $('.half').hover(this.npsStarHover.bind(this), this.npsStarHoverOut.bind(this));
            $('.full').hover(this.npsStarHover.bind(this), this.npsStarHoverOut.bind(this));
            $('.star').hover(this.npsStarHover.bind(this), this.npsStarHoverOut.bind(this));
            this.feedbackCommentText = $('.feedback-comment-text');
            this.positiveOptions = $('.feedback-comment-option-positive');
            this.negativeOptions = $('.feedback-comment-option-negative');
            this.feedbackCommentOption = $();
            this.lowScoreLabel = $('.low-score-label');
            this.highScoreLabel = $('.high-score-label');
            this.allOptions = this.positiveOptions.add(this.negativeOptions)
                .add(this.lowScoreLabel).add(this.highScoreLabel);
        },
        hideFeedbackForm: function() {
            $('.feedback-form').empty();
            $('.progress-top').css('height', '100%');
        },
        onFeedbackScoreChanged: function(event) {
            var score = null;
            var radio = $('input[name=score]:radio:checked');
            if(radio && radio.length) {
                score = $('input[name=score]:radio:checked').val();
            } else if(event){
                var target = $(event.target);
                score = parseInt(target.text());
                $('.score-button').removeClass('btn-primary');
                target.addClass('btn-primary');
            }
            this.feedbackScore = score != undefined ? score : this.feedbackScore;
            this.allOptions.addClass('none');
            this.submitFeedbackBtn.removeClass('disabled');

            (this.feedbackScore < 9 ? this.lowScoreLabel : this.highScoreLabel).removeClass('none');
            if (this.showCommentText) {
                this.feedbackCommentText.removeClass('none');
            } else {
                this.feedbackCommentOption =
                    (this.feedbackScore < 9 ? this.negativeOptions : this.positiveOptions);
                this.feedbackCommentOption.removeClass('none');
                this.feedbackCommentOption.change(this.onFeedbackCommentOptionChanged.bind(this));
            }
            $('.course-review,.feedback__note,.subcategory__rating').removeClass('none');
            $('.public-post').removeClass('none');
        },
        onFeedbackCommentOptionChanged: function() {
            if(this.feedbackCommentOption.val() === 'Other') {
                this.feedbackCommentText.removeClass('none').focus();
            } else {
                this.feedbackCommentText.addClass('none');
            }
        },
        getFeedbackCommentValue: function() {
            var value = '';
            if(this.feedbackCommentOption && this.feedbackCommentOption.length) {
                value = this.feedbackCommentOption.val();
                if(value !== 'Other') {
                    return value;
                }
                value += ': ';
            }
            return value + this.feedbackCommentText.val();
        },
        npsFractionalStarRatingChanged: function() {
            this.feedbackScore = parseInt($("input[name=rating]:radio:checked").val());

            var ratingLabelClass = '.rating-selected-' + Math.ceil(this.feedbackScore / 2);
            $('.rating-label').addClass('none');
            $(ratingLabelClass).removeClass('none');

            this.onFeedbackScoreChanged();
        },
        npsStarRatingChanged: function(event) {
            var target = $(event.target);
            var stars = target.parent().children();
            var index = stars.index(target);
            for(var i=0; i < stars.length; i++) {
                if(i < index) {
                    $(stars[i]).removeClass('on');
                } else {
                    $(stars[i]).addClass('on');
                }
            }
            this.feedbackScore = (5 - index) * 2;
            this.onFeedbackScoreChanged();
        },
        npsStarHover: function(event) {
            var target = $(event.target);
            var ratingLabelClass = '.' + target.attr('for');
            $('.rating-label').addClass('none');                                                                                                                                
            $(ratingLabelClass).removeClass('none'); 
        },
        npsStarHoverOut: function(event) {
            var ratingLabelClass = null;
            if(this.feedbackScore) {
                ratingLabelClass = '.rating-selected-' + Math.ceil(this.feedbackScore / 2);
            } else {
                ratingLabelClass = '.rating-not-selected';
            }
            $('.rating-label').addClass('none');
            $(ratingLabelClass).removeClass('none'); 
        },
        sendFeedbackBtn: function(event) {
            if(event) {
                event.preventDefault();
            }
            this.postFeedbackAndRemoveForm(this.feedbackScore, this.getFeedbackCommentValue());
        },
        askFeedbackLaterBtn: function(event) {
            if(event) {
                event.preventDefault();
            }
            UD.API_V2.call('/visits/me/page-events', {
                type: 'POST',
                data: {
                    type: 'trackclick',
                    page: 'nps_form',
                    event: JSON.stringify({
                        courseId: this.options.courseId,
                        userId: udMe.id,
                        score: this.feedbackScore,
                        comment: this.getFeedbackCommentValue(),
                        postedPublicly: $('#publicCheckbox').is(':checked'),
                        curriculumItemType: this.timeline[this.currentIndex - 1].type,
                        curriculumItemId: this.timeline[this.currentIndex - 1].id
                    })
                }
            });
            this.postFeedbackAndRemoveForm(null, null);
        },
        postFeedbackAndRemoveForm: function(score, comment) {
            var method = 'POST';
            var feedbackId = '';
            if(this.courseFeedbacks && this.courseFeedbacks.count) {
                method = 'PUT';
                feedbackId = this.courseFeedbacks.results[0].id;
            }
            UD.API_V2.call('/users/me/course-feedbacks/' + feedbackId, {
                type: method,
                data: {
                    'score': score,
                    'comment': comment,
                    'course': this.options.courseId,
                    'posted_publicly': $('#publicCheckbox').is(':checked'),
                },
                success: function(data) {
                    this.courseFeedbacks.count = 1;
                    this.courseFeedbacks.results = [data];
                }.bind(this)
            });
            this.hideFeedbackForm();
            this.next();
        },
        onChangeIndex: function(oldIndex){
            var old;
            if(oldIndex !== null && this.timeline[oldIndex]){
                old = this.timeline[oldIndex];
                if(old.type === 'lecture'){
                    this.getLectureWidget(old.id).data('ud-ud_lectureangular').unload();
                }
            }
        },
        prepareLecture: function(lecture) {
            var startPosition = lecture.data.startPosition;
            if(this.options.autoPlay) {
                $('a.autoplay', this.element).addClass('on');
                $('a.autoplay .autoplay-text-on', this.element).removeClass('none');
                $('a.autoplay .autoplay-text-off', this.element).addClass('none');
            } else {
                $('a.autoplay', this.element).removeClass('on');
                $('a.autoplay .autoplay-text-on', this.element).addClass('none');
                $('a.autoplay .autoplay-text-off', this.element).removeClass('none');
            }

            this._setDefaultTab();
            var lectureWidget = this.getLectureWidget(lecture.id).data('ud-ud_lectureangular');
            lectureWidget.load(function(loadedLecture) {
                lectureWidget.autoPlay = this.options.autoPlay;
                lectureWidget.startPosition = startPosition;

                var noteWidget = this.getNoteWidget();
                if(noteWidget) {
                    noteWidget.resetParams();
                    noteWidget.getNotes(lecture);
                }

                this.$window.trigger('setPositionHandler', lectureWidget);

                var extrasWidget = this.getExtrasWidget();
                if(extrasWidget) {
                    lecture.data.asset = loadedLecture.asset;
                    extrasWidget.getExtras(lecture);
                }

                this.runPrettyPrint();

                // Enables qualaroo popups that target the lecture page.
                window._kiq && window._kiq.push(['set', {'on_lecture_page': true}]);
            }.bind(this));
        },
        prepareQuiz: function(quizId) {
            var quizzesXhrDeferred = $.Deferred(),
                latestQuizAttemptXHRDeferred = $.Deferred();
            UD.API_V2
                .call('/users/me/subscribed-courses/' + this.options.courseId +
                      '/quizzes/' + quizId +
                      '/user-attempted-quizzes/latest')
                .complete(latestQuizAttemptXHRDeferred.resolve);
            UD.API_V2
                .call('/courses/' + this.options.courseId +
                      '/quizzes/' + quizId +
                      '?fields[quiz]=@default,object_index,num_assessments')
                .complete(quizzesXhrDeferred.resolve);

            $.when(quizzesXhrDeferred, latestQuizAttemptXHRDeferred).done(
                $.proxy(this.prepareQuizSuccessHandler, this)
            );
        },
        prepareQuizSuccessHandler: function(quizzesXHR, latestQuizAttemptXHR) {
            var quiz = quizzesXHR[0].responseJSON,
                latestQuizAttempt = latestQuizAttemptXHR[0].responseJSON;

            // so we don't have to pass the whole verbose object around
            quiz.status = quizzesXHR[0].status;
            latestQuizAttempt.status = latestQuizAttemptXHR[0].status;

            // No quiz attempt, or we're retaking the quiz. Create one
            if(latestQuizAttempt.status === 404 || this.isRetakingQuiz) {
                UD.API_V2
                .call('/users/me/subscribed-courses/' + this.options.courseId +
                      '/quizzes/' + quiz.id +
                      '/user-attempted-quizzes', {
                    type: 'POST',
                    success: function(response) {
                        latestQuizAttempt = response;
                        latestQuizAttempt.status = 201;
                        this.createAndLaunchQuiz(quiz, latestQuizAttempt);
                    }.bind(this)
                });
            }
            else {
                this.createAndLaunchQuiz(quiz, latestQuizAttempt);
            }

        },
        createAndLaunchQuiz: function(quiz, latestQuizAttempt) {
            var assetContainer = $('.asset-container', this.timeline[this.reverseIndex['quiz' + quiz.id]].element);
            assetContainer.empty();

            if(quiz.status < 400) {
                quiz.user_completed = latestQuizAttempt.completion_time !== null ? true : false;
                if(quiz.is_published || this.options.isInstructor) {
                    var template = (constants.quiz_type.CODING_EXERCISE === quiz.quizType) ?
                        this.codingExerciseViewTemplate : this.quizViewTemplate;
                    assetContainer.html(template(quiz));
                    this.getQuizWidget(quiz.id, function(widget) {
                        var quizWidget = widget.data('ud-ud_quiz');
                        quizWidget._initializeQuiz(quiz, latestQuizAttempt, this.options.courseId, this.isRetakingQuiz);
                        this.isRetakingQuiz = false;
                        quizWidget.load(function(){
                            var noteWidget = this.getNoteWidget();
                            if(noteWidget) {
                                noteWidget.resetParams();
                            }
                            this.$window.trigger('setPositionHandler', quizWidget);
                            this.runPrettyPrint();
                        }.bind(this));
                    }.bind(this));
                }
                else {
                    assetContainer.html(this.quizNotPublishedViewTemplate(quiz));
                }
            } else if(quiz.status < 500 && latestQuizAttempt.status < 500) {
                Raven.captureMessage('Quiz is locked for user', {
                    'extra': {
                        'quizId': quiz.id,
                        'attemptedQuizzesStatusCode': latestQuizAttempt.status
                    }
                });
                assetContainer.html(this.quizLockedViewTemplate());
            }
            else {
                assetContainer.html(this.genericErrorTemplate());
            }
        },
        getExtrasWidget: function() {
            this.extraswidget = $('.ud-extras', this.element);
            if(this.extraswidget.length) {
                if(!this.extraswidget.data('ud-ud_extras')) {
                    this.extraswidget.ud_extras({courseId: this.options.courseId});
                }
            }
            return this.extraswidget.data('ud-ud_extras');
        },
        getNoteWidget: function() {
            this.notewidget = $('.ud-notetaking', this.element);
            if(this.notewidget.length) {
                if(!this.notewidget.data('ud-ud_notetaking')) {
                    this.notewidget.ud_notetaking();
                }
            }
            return this.notewidget.data('ud-ud_notetaking');
        },
        getLectureWidget: function(lectureId){
            var el = $('.asset-container .ud-lectureangular', this.timeline[this.reverseIndex['lecture' + lectureId]].element);
            if(!el.data('ud-ud_lectureangular')){
                var widgetOptions = {};
                widgetOptions.courseId = this.options.courseId;
                widgetOptions.courseUrl = this.options.courseUrl;
                widgetOptions.instructorPreviewMode = this.options.instructorPreviewMode;
                widgetOptions.gaId = this.options.gaId;
                el.ud_lectureangular(widgetOptions);
            }
            return el;
        },
        getQuizWidget: function(quizId, callback) {
            var el = $('.asset-container .ud-quiz', this.timeline[this.reverseIndex['quiz' + quizId]].element);
            if(!el.data('ud-ud_quiz')) {
                var widgetOptions = {};
                if(this.options.isInstructor) {
                    widgetOptions.instructorMode = true;
                    widgetOptions.studentMode = false;
                } else {
                    widgetOptions.instructorMode = false;
                    widgetOptions.studentMode = true;
                }
                widgetOptions.courseUrl = this.options.courseUrl;
                widgetOptions.gaId = this.options.gaId;
                require(['ud.quiz'], function() {
                    el.ud_quiz(widgetOptions);
                    if(callback) {
                        callback(el);
                    }
                });
            } else {
                if(callback) {
                    callback(el);
                }
            }
        },
        onLectureProgressCompleted: function(event, lectureId) {
            this.timeline[this.reverseIndex['lecture' + lectureId]].justCompleted = true;
            this.loadCourseProgress();
            this.loadCourseFeedbacks();
        },
        onQuizCompleted: function(event, quizId) {
            this.timeline[this.reverseIndex['quiz' + quizId]].justCompleted = true;
            this.loadCourseProgress();
        },
        onLectureLastPositionChanged: function(event, lectureId, lastPosition) {
            this.timeline[this.reverseIndex['lecture' + lectureId]].data.startPosition = lastPosition;
        },
        onLectureCompleted: function(event, lectureId) {
            // Pause autoplay if user is trying to start a discussion or take a note.
            // On IE, val() defaults to the placeholder value rather than empty string.
            var disc = $('textarea.js-discussion-title', this.element);
            var hasDiscVal = disc.val() && disc.val() !== disc.attr('placeholder');
            var note = this.element.find('textarea.js-note');
            var hasNoteVal = note.val() && note.val() !== note.attr('placeholder');
            if(this.options.autoPlay && !hasDiscVal && !hasNoteVal) {
                this.element.find('li[data-lectureid="' + lectureId + '"]').find('.next-lecture').trigger('click', {sendGaEvent: true, autoplay: true});


                var timelineObj = this.timeline[this.reverseIndex['lecture' + lectureId] + 2];
                if(timelineObj.type === 'chapter' && !this.canSendCourseFeedback()) {
                    var duration = this.timeline[this.reverseIndex['lecture' + lectureId] + 1].autoSkipIn * 2;
                    if(timelineObj.data.description) {
                        duration += 6000; // give students more time to read the description
                    }
                    var chapterContinueTimeout = setTimeout(function() {
                        $('.next-lecture.continue', timelineObj.element).trigger('click', {sendGaEvent: true, autoplay: true});
                    }, duration);

                    $('.next-lecture.continue', timelineObj.element).on('click.chaptercontinue', function() {
                        clearTimeout(chapterContinueTimeout);
                        $('.next-lecture.continue', timelineObj.element).off('click.chaptercontinue');
                    });
                }
            }
        },
        onTabClick: function(ev) {
            if ($(ev.target).hasClass('tab-discussions')) {
                autosize.update($('textarea.js-discussion-title', this.element).focus());
            } else if($(ev.target).hasClass('tab-materials')) {
                udCourseTakingTracker.track('Lecture', 'resource visit');
            } else if($(ev.target).hasClass('tab-notes')) {
                udCourseTakingTracker.track('Lecture', 'note visit');
            }
            this.clickedAnotherTab = true;
        },
        runPrettyPrint: function() {
            $('pre', this.element).addClass('prettyprint');
            prettyPrint();
        },
        markAsCompletedToggle: function(event){
            event.preventDefault();
            var button = $(event.target);

            if(button.hasClass('read')){
                udCourseTakingTracker.track('Lecture', 'mark-uncomplete');
                this.markedUncompletedByUser(function() {
                    button.removeClass('read');
                    this.timeline[this.currentIndex].justCompleted = false;
                }.bind(this));

            } else {
                udCourseTakingTracker.track('Lecture', 'mark-complete');
                this.markedCompletedByUser(function() {
                    button.addClass('read');
                    this.timeline[this.currentIndex].justCompleted = true;
                }.bind(this));

            }
        },
        _setDefaultTab: function() {
            if(!this.clickedAnotherTab) {
                // user may have hit 'View resources', so make
                // sure the curriculum tab is active
                // if user clicked another tab, the active tab does not need
                // to change
                $('.sidebar-container .tab-curriculum').attr('checked', 'checked');
            }
        }
    });
});
