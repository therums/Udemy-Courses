define(['jquery-widget-init', 'handlebars.helpers', 'handlebars-templates', 'ud.coursetakingtracker',
    'jquery.serialize-object', 'ud.api.v2', 'ud.initializer'
], function($, Handlebars, handlebarsTemplates, udCourseTakingTracker) {
    'use strict';
    /*eslint camelcase: [2, {properties: "never"}]*/
    $.widget('ud.ud_notetaking', {
        options: {
            courseId: null
        },
        currentRequest: {
            lectureId: null,
            noteId: null,
            page: 1,
            pageSize: 12,
            notesListActive: false,
            notesListDisabled: false
        },
        notes: [],
        notesList: null,
        _positionHandler: {
            getPosition: function(){ return null; },
            getTotal: function(){return null; },
            renderPosition: function(position){return position === null ? '' : position; }
        },
        template: '',
        isStartedTakingNote: false,
        position: 0,
        getAPIEndpoint: function(lectureId, noteId) {
            var courseId = this.options.courseId;
            return '/users/me/subscribed-courses/' + courseId + '/lectures/' +
            lectureId + '/notes/' + (noteId || '');
        },
        _create: function(){
            $.extend(this.options, this.element.data());
            this._initHandlebarsTemplates();
            this.noteForm = $('#create-note-form', this.element);
            this.noteLocked = $('.note-locked', this.element);
            this.noteFormTextArea = $('textarea', this.noteForm);
            this.notesList = $('#notes-list', this.element);
            this.notesMask = $('#notes-mask', this.element);
            this.noteForm.submit(this.noteSubmit.bind(this));
            this.noteFormTextArea
                .keypress(function(event) {
                    if(event.which === 13) {
                        if(!event.shiftKey) {
                            this.noteSubmit(event);
                            event.preventDefault();
                        }
                    }
                }.bind(this))
                .keyup(function(event) {
                    this.setPosition(event);
                }.bind(this));

            $('time', this.element).live('click', this.gotoPosition.bind(this));
            this.initializeNotesListInfiniteScroll();

            $('input[type=radio]', $('.sidebar-container')).bind('change', function() {
                this.scrollNotesToBottom();
            }.bind(this));

            $(window).on('setPositionHandler', null, null, this.setPositionHandler.bind(this));
        },
        _initHandlebarsTemplates: function() {
            this.noteTemplate = handlebarsTemplates['course-taking/note'];
        },
        noteSubmit: function(event) {
            event.preventDefault();
            this.enableDownloadNotesButton();
            var noteObject = this.noteForm.serializeObject();
            noteObject.note = $.trim(noteObject.note);
            if(!noteObject.note) {
                return;
            }

            udCourseTakingTracker.track('Lecture', 'note create');

            var includeLecture = encodeURI('?fields[note]=@default,lecture');
            UD.API_V2.call(this.getAPIEndpoint(this.currentRequest.lectureId) + includeLecture, {
                type: 'POST',
                data: {
                    body: noteObject.note,
                    position: parseInt(this.position || 1)
                },
                success: this.renderNewNote.bind(this)
            });
        },
        // static function:
        submitNoteUpdate: function(noteId, newNoteBody, lectureId){
            udCourseTakingTracker.track('Lecture', 'note update');
            this.currentRequest.noteId = noteId;
            this.currentRequest.lectureId = lectureId;
            UD.API_V2.call(this.getAPIEndpoint(lectureId, noteId), {
                type: 'PATCH',
                data: {
                    body: newNoteBody
                },
                success: this.handleSubmitNoteUpdateSuccess.bind(this)
            });
        },
        handleSubmitNoteUpdateSuccess: function(){
        },
        // static function:
        submitRemoveNote: function(noteId, lectureId) {
            udCourseTakingTracker.track('Lecture', 'note delete');
            this.currentRequest.noteId = noteId;
            this.currentRequest.lectureId = lectureId;
            UD.API_V2.call(this.getAPIEndpoint(lectureId, noteId), {
                type: 'DELETE',
                success: this.handleSubmitRemoveNoteSuccess.bind(this)
            });
        },
        handleSubmitRemoveNoteSuccess: function() {
            $('li[data-noteid=' + this.currentRequest.noteId + ']').remove();
            if(this.element.find('#notes-list').children().length === 0){
                this.disableDownloadNotesButton();
            }
        },
        renderNewNote: function(response) {
            this.isStartedTakingNote = false;
            this.notes.push(response);
            var notes = [response];
            this.addRenderPositionMethod(notes);
            this.checkPositionLabel(notes);
            var result = {data: notes};
            this.notesList.append(this.noteTemplate(result));
            this.notesList.ud_initialize();

            this.noteFormTextArea.val('');
            this.scrollNotesToBottom();
        },
        getNotes: function(lecture) {
            this.addDownloadNotesURL(lecture.id);
            this.currentRequest.lecture = lecture;
            this.currentRequest.lectureId = lecture.id;
            this.currentRequest.notesListActive = true;

            if(this.currentRequest.page) {
                UD.API_V2.call(this.getAPIEndpoint(lecture.id), {
                    type: 'GET',
                    data: {
                        page: this.currentRequest.page,
                        page_size: this.currentRequest.pageSize,
                        'fields[note]': '@default,lecture'
                    },
                    success: this.renderNotes.bind(
                        this, this.currentRequest.page, this.currentRequest.pageSize),
                    error: this.renderNotesError.bind(this)
                });
            }
        },
        addDownloadNotesURL: function(lectureId) {
            this.element.find('#download-button').attr('href',
                '/notes/download?lecture_id=' + lectureId);
        },
        disableDownloadNotesButton: function() {
            this.element.find('#download-notes').hide();
        },
        enableDownloadNotesButton: function() {
            this.element.find('#download-notes').show();
        },
        checkPositionLabel: function(notes) {
            for(var i in notes) {
                if(notes[i].positionLabel === '00:00') {
                    notes[i].positionLabel = false;
                }
            }
        },
        renderNotesError: function(jqXHR) {
            this.noteForm.addClass('none');
            this.notesMask.addClass('none');
            this.disableDownloadNotesButton();
            $('.error-message', this.noteLocked).text(jqXHR.responseJSON.error.details);
            this.noteLocked.removeClass('none');
        },
        renderNotes: function(page, pageSize, response) {
            this.noteForm.removeClass('none');
            this.noteLocked.addClass('none');
            this.notesMask.removeClass('none');
            var notes = response.results;
            notes.reverse();
            this.notes.push.apply(this.notes, notes);
            if(response.previous !== null &&
                (notes.length === 0 || notes.length < pageSize)) {
                this.currentRequest.notesListDisabled = true;
            }
            if(response.previous === null) {
                this.notesList.html('');
            }
            this.addRenderPositionMethod(this.notes);
            this.checkPositionLabel(notes);

            this.notesList.prepend(this.noteTemplate({data: response.results}));
            this.notesList.ud_initialize();

            this.currentRequest.page = response.next ? page + 1 : null;
            this.currentRequest.notesListActive = false;

            if(this.element.find('#notes-list').children().length === 0){
                this.disableDownloadNotesButton();
            }
            else {
                this.enableDownloadNotesButton();
            }
        },
        addRenderPositionMethod: function(notes){
            $.each(notes, function(i, note){
                if(typeof note.positionLabel === 'undefined') {
                    note.positionLabel = this._positionHandler.renderPosition(note.position);
                }
            }.bind(this));
        },
        scrollNotesToBottom: function() {
            this.notesMask.scrollTop(this.notesMask.get(0).scrollHeight);
        },
        setPositionHandler: function(event, positionHandler) {
            this._positionHandler = positionHandler;
        },
        setPosition: function(event) {
            if(event.which === 13) {
                return;
            }
            if(this.isStartedTakingNote === false) {
                this.isStartedTakingNote = true;
                this.position = this._positionHandler.getPosition();
            }
        },
        initializeNotesListInfiniteScroll: function() {
            this.notesMask.scroll(function() {
                var scrollTopHeight = this.notesMask.scrollTop();
                if (!this.currentRequest.notesListActive && !this.currentRequest.notesListDisabled
                    && (scrollTopHeight <= 250)) {
                    this.getNotes(this.currentRequest.lecture);
                }
            }.bind(this));
        },
        resetParams: function() {
            this.currentRequest.page = 1;
            this.currentRequest.notesListActive = false;
            this.currentRequest.notesListDisabled = false;
        },
        gotoPosition: function(event) {
            window.location.hash = '/lecture' + '/' + this.currentRequest.lectureId;
            window.location.hash += ':' + $(event.currentTarget).data('position');
        }
    });
});
