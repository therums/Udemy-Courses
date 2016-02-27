/**
 * We have extended regular popover() method of bootstrap where you can now have an inner div.popover-html-content
 * to fetch an html content from html DOM rather than using data-content.
 *
 * @example Look at organization-manage-user-row.phtml for an example usage
 * @author cansinyildiz
 */
var timeoutObj;
(function($) {
    'use strict'; // enable ECMAScript 5 strict mode
    $.widget('ud.ud_popover', {
        options: {
            animation: false,
            html: true,
            // If a contentUrl is given to ud-popover widget, that url will be dynamically loaded and shown as content.
            contentUrl: null,
            trigger: 'click',
            // If a div.popover-html-content exists inside div.ud-popover, the content of .popover-html-content element will be shown.
            content: function() { return $(".popover-html-content", this).html()}
        },
        _create: function() {
            $.extend(this.options, this.element.data());

            if(this.options.trigger === 'click') {
                this.element.on('click', $.proxy(this._clickHandler, this));
            }

            if(this.options.contentUrl) {
                this.options.content = '<div class="ajax-loader-stick"></div>';
                this.element.on('shown.bs.popover', $.proxy(this._urlContentShownHandler, this));
            } else {
                this.element.on('shown.bs.popover', $.proxy(this._staticContentShownHandler, this));
            }

            /**
             * This hacks prevents popover to be closed when you hover
             * from link to the popover content
             * @author cansinyildiz
             */
            if(this.options.trigger == 'hover') {
                this.options.trigger = 'manual';

                this.element.on("mouseenter", function() {
                    clearTimeout(this.mouseEnterTimeout);
                    clearTimeout(this.mouseLeaveTimeout);
                    this.mouseEnterTimeout = setTimeout(function() {
                        this.element.popover("show");
                        this.element.siblings(".popover").on("mouseleave", function() {
                            this.element.popover('hide');
                        }.context(this));
                    }.context(this), this.options.delay || 0);
                }.context(this));

                this.element.on("mouseleave", function() {
                    clearTimeout(this.mouseEnterTimeout);
                    clearTimeout(this.mouseLeaveTimeout);
                    this.mouseLeaveTimeout = setTimeout(function() {
                        if (!$(".popover:hover").length) {
                            this.element.popover("hide")
                        }
                    }.context(this), this.options.delay || 100);
                }.context(this));

            }

            this.element.popover(this.options);
        },
        _clickHandler: function(event) {
            event && event.stopPropagation();
            return false;
        },
        _urlContentShownHandler: function(event) {
            $.ajax({
                type: 'GET',
                data: {displayType: 'ajax'},
                url: this.options.contentUrl,
                success: $.proxy(this.setContent, this)
            });
        },
        _staticContentShownHandler: function(event) {
            var popover = this.element.siblings(".popover");
            // if this options is body, then search for the .popover under body
            if(this.options.container){
                popover = $(this.options.container+" > .popover");
            }
            popover.ud_initialize();
        },
        setContent: function(response) {
            // if this options is set, then search for the .popover under given container
            if(this.options.container){
                var popover = $(this.options.container+" > .popover");
            } else {
                var popover = this.element.siblings(".popover");
            }
            var initialWidth = popover.outerWidth();
            var initialLeft = popover.css('left').replace('px', '');
            popover.find(".popover-content").html(response);
            var newWidth = popover.outerWidth();
            var newLeft = initialLeft-(newWidth-initialWidth)/2;
            popover.css('left', newLeft+"px");
            popover.ud_initialize();
        }
    });
})(jQuery);
