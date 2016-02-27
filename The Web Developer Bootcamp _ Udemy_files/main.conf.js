'use strict';

var version = (typeof UD !== 'undefined' && typeof UD.Config !== 'undefined') ? UD.Config.version : '1';

require.config({
  baseUrl: '/staticx/udemy/js/jq',
  urlArgs: 'v=' + version,
  config: {
    replace: {
      'facebook': {
        pattern: 'user_locale',
        value: function() {
          return UD.request.locale || 'en_US';
        }
      }
    }
  },
  paths: {
    // External
    'adroll': 'https://s.adroll.com/j/roundtrip',
    'facebook': 'https://connect.facebook.net/user_locale/all',
    'googleplusone': 'https://apis.google.com/js/client:plusone',
    'jwplayer': 'https://jwpsrv.com/library/zjJURF88EeKbKCIACp8kUw',
    'paypal-incontext': 'https://www.paypalobjects.com/js/external/paypal.v1',
    'stripe-checkout': 'https://checkout.stripe.com/checkout',
    'sift-science': 'https://cdn.siftscience.com/s',
    'twitterwidgets': 'https://platform.twitter.com/widgets',
    'webengage': 'https://ssl.widgets.webengage.com/js/widget/webengage-min-v-4.0',

    // Internal, but calls out to external javascript
    'olark': '../libs/olark',
    'branch-metrics': '../bower_components/branch-sdk/dist/web/build.min',
    'raven': '../bower_components/raven-js/dist/raven.min',

    // Internal
    'ace': '../bower_components/ace-builds/src-min/ace',
    'autocomplete': '../../../autocomplete_light/autocomplete',
    'autocomplete_widget': '../../../autocomplete_light/widget',
    'autocomplete_addanother': '../../../autocomplete_light/addanother',
    'autocomplete_text_widget': '../../../autocomplete_light/text_widget',
    'autocomplete_remote': '../../../autocomplete_light/remote',
    'autosize': '../bower_components/autosize/dest/autosize.min',
    'bootstrap': '../bower_components/bootstrap/dist/js/bootstrap.min',
    'easyXDM': '../libs/easyXDM-2.4.18.min',
    'handlebars': '../bower_components/handlebars/handlebars.min',
    'handlebars-templates': '../generated/handlebars.templates',
    'highcharts': '../bower_components/highcharts-release/highcharts',
    'highcharts-regression': '../bower_components/highcharts-regression/highcharts-regression',
    'introjs': '../bower_components/introjs/minified/introjs.min',
    'json2': '../bower_components/json2/json2',
    'moment': '../bower_components/momentjs/min/moment-with-locales.min',
    'moment-timezone': '../bower_components/moment-timezone/builds/moment-timezone-with-data-2010-2020.min',
    'mustache': '../bower_components/mustache.js/mustache',
    'prettify': '../bower_components/google-code-prettify/bin/prettify.min',
    'swfobject': '../bower_components/swfobject/swfobject/swfobject',
    'underscore': '../bower_components/underscore/underscore-min',
    'zeroclipboard': '../bower_components/zeroclipboard/dist/ZeroClipboard.min',
    'humanize-duration': '../bower_components/humanize-duration/humanize-duration',
    'fineuploader': '../libs/fineuploader/s3.jquery.fine-uploaderv5.1.3',
    'redactor': '../libs/redactor/redactor',
    'jsrepl': '../bower_components/jsrepl-build/jsrepl',
    'jsuri': '../bower_components/jsuri/Uri.min',

    // jquery and plugins
    'jquery': '../bower_components/jquery/jquery.min',
    'jquery-migrate': '../bower_components/jquery-migrate/jquery-migrate.min',
    'jquery.expander': '../bower_components/jquery-expander/jquery.expander.min',
    'jquery.json': '../bower_components/jquery-json/build/jquery.json.min',
    'jquery.menu-aim': '../bower_components/jquery-menu-aim/jquery.menu-aim.min',
    'jquery.number': '../bower_components/jquery-number/jquery.number.min',
    'jquery.pagination': '../bower_components/jquery-pagination/src/jquery.pagination',
    'jquery.rating': '../bower_components/jquery-rating/jquery.rating.pack',
    'jquery.serialize-object': '../bower_components/jquery-misc/jquery.ba-serializeobject.min',
    'jquery.timeto': '../bower_components/jquery-timeto/jquery.timeTo.min',
    'jquery.viewport': '../bower_components/jquery-viewport/jquery.viewport',
    'jquery-ui-timepicker-addon': '../bower_components/jqueryui-timepicker-addon/dist/jquery-ui-timepicker-addon.min',
    'jquery.ba-throttle-debounce': '../bower_components/jquery-throttle-debounce/jquery.ba-throttle-debounce.min',
    'jquery.cookie': '../bower_components/jquery-cookie/jquery.cookie',
    'jquery.fancybox': '../bower_components/fancybox/source/jquery.fancybox.pack',
    'jquery.fileupload': '../bower_components/blueimp-file-upload/js/jquery.fileupload',
    'jquery.iframe-transport': '../bower_components/blueimp-file-upload/js/jquery.iframe-transport',
    'jquery.jcrop': '../bower_components/jcrop/js/jquery.Jcrop.min',
    'jquery.jqGrid': '../bower_components/jqgrid/js/minified/jquery.jqGrid.min',
    'jquery.mousewheel': '../bower_components/jquery-mousewheel/jquery.mousewheel.min',
    'jquery.payment': '../bower_components/jquery.payment/lib/jquery.payment',
    'jquery.smartbanner': '../bower_components/jquery.smartbanner/jquery.smartbanner.min',
    'jquery.ui': '../bower_components/jquery-ui/ui/minified/jquery-ui.min',
    'jquery-datepicker-i18n': '../bower_components/jquery-ui/ui/minified/i18n/jquery-ui-i18n.min',
    'fastclick': '../bower_components/fastclick/lib/fastclick.min',
    'daterangepicker': '../bower_components/bootstrap-daterangepicker/daterangepicker',

    // angular
    'angular': '../bower_components/angular/angular.min',
    'angular-animate': '../bower_components/angular-animate/angular-animate.min',
    'angular-cookies': '../bower_components/angular-cookies/angular-cookies.min',
    'angular-gettext': '../bower_components/angular-gettext/dist/angular-gettext.min',
    'angular-inview': '../bower_components/angular-inview/angular-inview',
    'angular-module-patch': '../ng/patches/angular-module-patch',
    'angular-resource': '../bower_components/angular-resource/angular-resource.min',
    'angular-route': '../bower_components/angular-route/angular-route.min',
    'angular-sanitize': '../bower_components/angular-sanitize/angular-sanitize.min',
    'angular-timer': '../bower_components/angular-timer/dist/angular-timer.min',
    'angular-unsavedChanges': '../bower_components/angular-unsavedChanges/dist/unsavedChanges.min',
    'angular-velocity': '../bower_components/angular-velocity/angular-velocity.min',
    'ng-grid': '../bower_components/ng-grid/ng-grid-2.0.7.min',
    'highcharts-ng': '../bower_components/highcharts-ng/dist/highcharts-ng.min',

    'velocity': '../bower_components/velocity/velocity.min',
    'velocity-ui': '../bower_components/velocity/velocity.ui.min',
    'ng-root': '../ng',
    'ud-config': '../ng/ud-config',
    'ud-link': '../ng/ud-link',
    'ud-me': '../ng/ud-me',
    'ud-request': '../ng/ud-request',
    'ud-translate': '../ng/ud-translate',
    'ud-template': '../ng/ud-template',
    'ui-ace': '../bower_components/angular-ui-ace/ui-ace.min',
    'ui-router': '../bower_components/angular-ui-router/release/angular-ui-router.min',
    'ui-bootstrap': '../bower_components/angular-bootstrap/ui-bootstrap-tpls.min',

    'ud-core': '../ng/ud-core',
    // angular.js apps
    'activity-viewer.app': '../ng/apps/activity-viewer',
    'admin-fraud-inspection.app': '../ng/apps/admin-fraud-inspection',
    'channel-dashboard.app': '../ng/apps/channel-dashboard',
    'course-landing-page.app': '../ng/apps/course-landing-page',
    'course-taking-dashboard.app': '../ng/apps/course-taking-dashboard',
    'course-taking-v4.app': '../ng/apps/course-taking-v4',
    'enrollment.app': '../ng/apps/enrollment',
    'error-page.app': '../ng/apps/error-page',
    'my-courses.app': '../ng/apps/my-courses',
    'organization-discovery.app': '../ng/apps/organization-discovery',
    'organization-manage-courses.app': '../ng/apps/organization-manage-courses',
    'organization-manage-learners-activity.app': '../ng/apps/organization-manage-learners-activity',
    'organization-manage-usage-patterns.app': '../ng/apps/organization-manage-usage-patterns',
    'statement-details.app': '../ng/apps/statement-details',
    'statements-summary.app': '../ng/apps/statements-summary',
    'teaching-courses.app': '../ng/apps/teaching-courses',
    'shopping-cart.app': '../ng/apps/shopping-cart',
    'checkout.app': '../ng/apps/checkout',
    'messaging.app': '../ng/apps/messaging',

    // requirejs plugins
    'async': '../bower_components/requirejs-plugins/src/async',
    'depend': '../bower_components/requirejs-plugins/src/depend',
    'font': '../bower_components/requirejs-plugins/src/font',
    'goog': '../bower_components/requirejs-plugins/src/goog',
    'image': '../bower_components/requirejs-plugins/src/image',
    'json': '../bower_components/requirejs-plugins/src/json',
    'noext': '../bower_components/requirejs-plugins/src/noext',
    'mdown': '../bower_components/requirejs-plugins/src/mdown',
    'propertyParser': '../bower_components/requirejs-plugins/src/propertyParser',
    'text': '../bower_components/requirejs-text/text',
    'domReady': '../bower_components/requirejs-domready/domReady',
    'replace': '../bower_components/require.replace/require.replace',
    'videojs': '../bower_components/video.js/dist/video-js/video.dev.min',
    'videojs-youtube': '../bower_components/videojs-youtube/src/youtube',
    'videojs-speed-controller': '../jq/videojs-plugins/speed-controller',
    'videojs-controlbar-speed-controller': '../jq/videojs-plugins/controlbar-speed-controller',
    'videojs-speed-controller-button': '../jq/videojs-plugins/speed-controller-button',
    'videojs-settings-selector': '../jq/videojs-plugins/settings-selector',
    'videojs-timer': '../jq/videojs-plugins/timer',
    'videojs-udemy-patches': '../jq/videojs-plugins/udemy-patches',
    'videojs-mark-as-viewed': '../jq/videojs-plugins/mark-as-viewed',
    'videojs-bookmark': '../jq/videojs-plugins/bookmark',
    'videojs-hotkeys': '../jq/videojs-plugins/hotkeys',
    'videojs-mashup': '../jq/videojs-plugins/mashup',
    'vttjs': '../bower_components/vtt.js/vtt.min',
    'ud.videojs-ready': '../jq/iframe-widgets/ud.videojs-ready',
    'ud.progresser': '../jq/iframe-widgets/ud.progresser'
  },
  // Short-hand dependency configuration (i.e. 'lib-name' : ['dep-a', 'dep-b']) does not work with
  // wrapShim: true build option. Therefore, explicitly define deps with 'lib-name': { deps: [] }.
  shim: {
    'angular': {exports: 'angular'},
    'angular-animate': { deps: ['angular'] },
    'angular-cookies': { deps: ['angular'] },
    'angular-gettext': { deps: ['angular'] },
    'angular-resource': { deps: ['angular'] },
    'angular-route': { deps: ['angular'] },
    'angular-sanitize': { deps: ['angular'] },
    'angular-timer': { deps: ['angular', 'moment', 'humanize-duration'] },
    'angular-velocity': { deps: ['velocity', 'velocity-ui', 'angular', 'angular-animate'] },
    'autocomplete': { deps: ['jquery'] },
    'autocomplete_widget': {deps: ['autocomplete']},
    'autocomplete_addanother': {deps: ['autocomplete']},
    'autocomplete_text_widget': {deps: ['autocomplete']},
    'autocomplete_remote': {deps: ['autocomplete']},
    'bootstrap': { deps: ['jquery', 'jquery.ui'] },
    'facebook': { exports: 'FB' },
    'fineuploader': { deps: ['jquery'] },
    'handlebars': {
      deps: ['jquery'],
      exports: 'Handlebars'
    },
    'highcharts': {
      deps: ['jquery'],
      exports: 'Highcharts'
    },
    'highcharts-regression': { deps: ['highcharts'] },
    'ui-ace': {
        deps: ['ace']
    },
    'highcharts-ng': { deps: ['angular', 'highcharts'] },
    'jquery-migrate': { deps: ['jquery'] },
    'jquery-ui-timepicker-addon': { deps: ['jquery', 'jquery.ui'] },
    'jquery-datepicker-i18n': { deps: ['jquery', 'jquery.ui'] },
    'jquery.ba-throttle-debounce': { deps: ['jquery', 'jquery-migrate'] },
    'jquery.cookie': { deps: ['jquery', 'jquery-migrate'] },
    'jquery.expander': { deps: ['jquery'] },
    'jquery.fancybox': { deps: ['jquery', 'jquery-migrate'] },
    'jquery.fileupload': { deps: ['jquery', 'jquery.ui'] },
    'jquery.iframe-transport': { deps: ['jquery'] },
    'jquery.jcrop': { deps: ['jquery', 'jquery-migrate'] },
    'jquery.jqGrid': { deps: ['jquery', 'jquery-migrate'] },
    'jquery.json': { deps: ['jquery'] },
    'jquery.menu-aim': { deps: ['jquery'] },
    'jquery.mousewheel': { deps: ['jquery', 'jquery-migrate'] },
    'jquery.number': { deps: ['jquery'] },
    'jquery.pagination': { deps: ['jquery'] },
    'jquery.payment': { deps: ['jquery'] },
    'jquery.rating': { deps: ['jquery', 'jquery-migrate'] },
    'jquery.serialize-object': { deps: ['jquery'] },
    'jquery.smartbanner': { deps: ['jquery', 'jquery-migrate'] },
    'jquery.timeto': { deps: ['jquery'] },
    'jquery.ui': { deps: ['jquery'] },
    'daterangepicker': { deps: ['jquery', 'moment'] },
    'jsuri': { exports: 'Uri' },
    'jquery.viewport': { deps: ['jquery'] },
    'jwplayer': { deps: ['jquery'] },
    'moment-timezone': { deps: ['moment'] },
    'ng-grid': { deps: ['angular', 'jquery'] },
    'redactor': { deps: ['jquery'] },
    'sift-science': { exports: '_sift' },
    'ui-bootstrap': { deps: ['angular'] },
    'velocity': { deps: ['jquery'], exports: ['Velocity'] },
    'velocity-ui': { deps: ['velocity'] },
    'videojs': { deps: ['vttjs'] },
     // ud.videojs-ready.js and ud.progress.js are used in iframe as well which doesn't use require
     // to define dependencies, so we have to define dependencies here to use outside of iframe.
    'videojs-youtube': { deps: ['videojs'] },
    'videojs-speed-controller-button': { deps: ['videojs'] },
    'videojs-speed-controller': { deps: ['videojs'] },
    'videojs-controlbar-speed-controller': { deps: ['videojs', 'videojs-speed-controller'] },
    'videojs-settings-selector': { deps: ['videojs'] },
    'videojs-timer': { deps: ['videojs'] },
    'videojs-mark-as-viewed': { deps: ['videojs', 'underscore'] },
    'videojs-bookmark': { deps: ['videojs'] },
    'videojs-udemy-patches': { deps: ['videojs', 'underscore'] },
    'videojs-hotkeys': { deps: ['videojs', 'videojs-speed-controller'] },
    'videojs-mashup': { deps: ['videojs'] },
    'ud.videojs-ready': {
        deps: ['jquery', 'jquery.ui', 'jquery.cookie', 'videojs', 'videojs-speed-controller',
                'videojs-speed-controller-button', 'videojs-settings-selector', 'videojs-timer',
                'videojs-udemy-patches', 'videojs-mark-as-viewed', 'videojs-hotkeys',
                'videojs-mashup', 'videojs-youtube', 'videojs-bookmark',
                'videojs-controlbar-speed-controller']
    },
    'ud.progresser': { deps: ['jquery', 'jquery.ui'] }
  },
  map: {
    'jquery.fileupload': {
      'jquery.ui.widget': 'jquery.ui'
    }
  }
});


if ((typeof UD !== 'undefined' && typeof UD.is_external_sources_enabled !== 'undefined') && !UD.is_external_sources_enabled) {
    require.config({
        paths: {
          // External
          'adroll': false,
          'facebook': false,
          'googleplusone': false,
          'jwplayer': false,
          'paypal-incontext': false,
          'stripe-checkout': false,
          'sift-science': false,
          'twitterwidgets': false,
          'webengage': false,

          // Internal, but calls out to external javascript
          'olark': false,
          'branch-metrics': false
      }
    });
}


if(typeof UD !== 'undefined' && typeof UD.Config !== 'undefined' && UD.Config.ENV !== 'TEST') {
  require(['../jq/ud.requireerrorhandler'], function (requireErrorHandler) {
    require.onError = requireErrorHandler;
  });

  require(['ud.package.all']);
}
