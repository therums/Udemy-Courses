/**
 * Require the script, if you want to use courseDashboardTracker ga property.
 * It will ensure, you set up account and default values.
 */
define(['ud-config', 'ud-me', 'ud.googleanalytics', 'ud.api.v2'], function(udConfig, udMe, udGoogleAnalytics, udApiV2) {
    'use strict';

    function CourseTakingTracker() {
        this._trackerName = 'courseDashboardTracker';
        this._dimensions = {
            userId: 'dimension1',
            userType: 'dimension3',
            courseType: 'dimension4',
            ctVersion: 'dimension5'
        };
        this._eventData = {
            userId: udMe.id,
            userType: null,
            courseId: null,
            courseType: null,
            objectId: null,
            objectType: null,
            ctVersion: null
        };

        //default setup
        udGoogleAnalytics.createAccount(udConfig.third_party.google_analytics_id_for_course_taking, this._trackerName);
        udGoogleAnalytics.setValue(this._dimensions.userId, udMe.id, this._trackerName);
    }

    // ctVersion constants
    CourseTakingTracker.prototype.BASE = 'base';
    CourseTakingTracker.prototype.R1 = '1';

    CourseTakingTracker.prototype.setUserType = function(value) {
        udGoogleAnalytics.setValue(this._dimensions.userType, value, this._trackerName);
        this._eventData.userType = value;
    };

    CourseTakingTracker.prototype.setCourseId = function(value) {
        this._eventData.courseId = value;
    };    

    CourseTakingTracker.prototype.setCourseType = function(value) {
        udGoogleAnalytics.setValue(this._dimensions.courseType, value, this._trackerName);
        this._eventData.courseType = value;
    };

    CourseTakingTracker.prototype.setCurriculumObject = function(objectType, objectId) {
        this._eventData.objectType = objectType;
        this._eventData.objectId = objectId;
    };

    CourseTakingTracker.prototype.setCTVersion = function(value) {
        udGoogleAnalytics.setValue(this._dimensions.ctVersion, value, this._trackerName);
        this._eventData.ctVersion = value;
    };

    CourseTakingTracker.prototype.track = function(category, action, label, value, extraParam) {
        if(!this._eventData.courseId) {
            // This happens when we use course taking code outside of course taking app.
            // For example, we use ud.lectureangular.js to show videos on student satisfaction app.
            return;
        }
        udGoogleAnalytics.trackEvent(category, action, label, value, this._trackerName, extraParam);
        var eventData = {};
        for(var key in this._eventData) {
            eventData[key] = this._eventData[key];
        }
        eventData.category = category;
        eventData.action = action;
        eventData.extra = JSON.stringify(extraParam);
        udApiV2.call('/visits/me/page-events', {
            type: 'POST',
            data: {
                type: 'trackclick',
                page: 'coursetaking',
                event: JSON.stringify(eventData)
            }
        });
    };

    return new CourseTakingTracker();
});
