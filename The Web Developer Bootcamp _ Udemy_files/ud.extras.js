define(['jquery-widget-init', 'handlebars.helpers', 'handlebars-templates',
    'ud.coursetakingtracker', 'ud.api.lecture', 'prettify'
], function($, Handlebars, handlebarsTemplates, udCourseTakingTracker, udLectureApi) {
    'use strict';
    /*eslint camelcase: [2, {properties: "never"}]*/
    $.widget('ud.ud_extras', {
        options: {
            lecture: null,
            courseId: null,
            instructorPreviewMode: null,
            isInstructor: null
        },
        currentRequest: {
            lectureId: null,
            loading: false,
            page: 1
        },
        extrasList: null,
        extras: [],
        courseDescription: null,
        _create: function() {
            $.extend(this.options, this.element.data());
            this._initHandlebarsTemplates();
            this.extrasNav = $('#extras-nav', this.element);

        },
        _initHandlebarsTemplates: function() {
            this.extrasTemplate = handlebarsTemplates['asset/extras'];
        },
        _initExtrasVariables: function() {
            this.options.lecture.hasExtras = false;
            this.options.lecture.downloadable_materials = [];
            this.options.lecture.external_materials = [];
            this.options.lecture.lecture_files = [];
        },
        getExtras: function(lecture) {
            this.options.lecture = lecture;
            this.currentRequest.lectureId = lecture.id;
            this._initExtrasVariables();

            this._getPaginatedExtras(lecture, this.currentRequest.page);
        },
        _getPaginatedExtras: function(lecture, page) {
            if(this.currentRequest.loading) {
                return;
            }
            this.currentRequest.loading = true;
            this.currentRequest.page = page;
            udLectureApi.getExtras(
                this.options.courseId, lecture.id, page,
                this.renderExtras.bind(this),
                this.renderExtrasError.bind(this)
            );
        },
        renderExtrasError: function(jqXHR) {
            this.currentRequest.loading = false;
            this.options.lecture.error_occurred = true;
            this.options.lecture.error_message = jqXHR.responseJSON.detail;
            this.options.preview_mode = this.options.lecture.preview_mode;
            this.addExtrasToNav();
        },
        renderExtras: function(response) {
            this.currentRequest.loading = false;
            this.options.lecture.error_occurred = false;
            this.options.lecture.extras = response;
            this.classifyExtras();
            if(this.options.lecture.hasExtras) {
                udCourseTakingTracker.track('Lecture', 'resource available');
                $(window).trigger('showSupplementaryBtn');
            }
            else {
                $(window).trigger('hideSupplementaryBtn');
            }
            this.addExtrasToNav();

            $('section.down li').off('click').on('click', this.downloadOnClick.context(this));
            if(response.next) {
                $('.load-more-extras', this.extrasNav).off('click').on('click', function() {
                    this._getPaginatedExtras(this.options.lecture, this.currentRequest.page + 1);
                }.bind(this)).show();
            } else {
                $('.load-more-extras', this.extrasNav).off('click').hide();
            }
        },
        addExtrasToNav: function() {
            this.extrasNav.html(this.extrasTemplate(this.options.lecture));
            $('pre', this.extrasNav).addClass('prettyprint');
            /* global prettyPrint */
            prettyPrint();
        },
        downloadOnClick: function(event) {
            if(event) {
                event.preventDefault();
            }
            var fileId = $(event.currentTarget).data('id');
            var file = this.findFileById(fileId);

            $(window).trigger('lectureDownloaded_' + this.options.lecture.id);

            this._scrollToTop();
            var durl;
            for(var i in file) {
                durl = file[i].file || durl;
            }

            $('body').append('<iframe src="' + durl + '" style="display: none;"></iframe>');
        },
        classifyExtras: function() {
            var lecture = this.options.lecture, extra, file, i, j;

            var canSeeExtras =
                lecture.data.is_published ||
                (this.options.isInstructor &&
                [null, 'instructor'].indexOf(this.options.instructorPreviewMode) !== -1);

            if(canSeeExtras && typeof lecture.extras.results !== 'undefined' &&
                lecture.extras.results.length > 0) {

                lecture.hasExtras = true;
                for(i in lecture.extras.results) {
                    extra = lecture.extras.results[i];
                    if(parseInt(extra.status) === 1) {
                        switch(extra.asset_type) {
                            case 'ExternalLink':
                                lecture.external_materials.push(extra);
                                break;
                            default:
                                for(j in extra.download_urls) {
                                    file = extra.download_urls[j];
                                    file.id = j + extra.id;
                                    file.title = '(' + j + ') ' + extra.title;
                                    lecture.downloadable_materials.push(file);
                                }
                        }
                    }
                }
            }

            var canSeeLectureFiles =
                (lecture.data.is_published && lecture.data.is_downloadable) ||
                (this.options.isInstructor &&
                [null, 'instructor'].indexOf(this.options.instructorPreviewMode) !== -1);

            if(canSeeLectureFiles && typeof lecture.data.asset !== 'undefined') {
                lecture.hasExtras = true;

                extra = lecture.data.asset;
                for(j in extra.download_urls) {
                    file = extra.download_urls[j];
                    file.id = j + extra.id;
                    file.title = '(' + j + ') ' + extra.title;
                    lecture.lecture_files.push(file);
                }
            }
        },
        findFileInListById: function(fileId, list) {
            for(var i in list) {
                var file = list[i];
                if(file.id === fileId) {
                    return file;
                }
            }
            return null;
        },
        findFileById: function(assetId) {
            var lecture = this.options.lecture;
            return this.findFileInListById(assetId, lecture.downloadable_materials) ||
                this.findFileInListById(assetId, lecture.external_materials) ||
                this.findFileInListById(assetId, lecture.lecture_files);
        },
        _scrollToTop: function() {
            this.element.scrollTop(0);
        }
    });
});
