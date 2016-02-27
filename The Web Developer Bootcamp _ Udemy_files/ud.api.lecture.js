define(['ud.api.v2'], function(udApiV2){
    'use strict';
    return {
        create: function(courseId, postData, callback, errorCallback){
            return udApiV2.call('/users/me/taught-courses/' + courseId + '/lectures/', {
                type: 'POST',
                data: postData,
                success: callback,
                error: errorCallback
            });
        },
        read: function(courseId, lectureId, getParams, callback, errorCallback) {
            return udApiV2.call('/users/me/taught-courses/' + courseId + '/lectures/' + lectureId, {
                type: 'GET',
                data: getParams,
                success: callback,
                error: errorCallback
            });
        },
        update: function(courseId, lectureId, postData, callback, errorCallback) {
            postData.method = 'PUT';
            postData.disableMemcacheGets = 1;
            return udApiV2.call('/users/me/taught-courses/' + courseId + '/lectures/' + lectureId, {
                type: 'PUT',
                data: postData,
                success: callback,
                error: errorCallback
            });
        },
        partialUpdate: function(courseId, lectureId, postData, callback, errorCallback) {
            postData.method = 'PATCH';
            postData.disableMemcacheGets = 1;
            return udApiV2.call('/users/me/taught-courses/' + courseId + '/lectures/' + lectureId, {
                type: 'PATCH',
                data: postData,
                success: callback,
                error: errorCallback
            });
        },
        destroy: function(courseId, lectureId, callback, errorCallback) {
            return udApiV2.call('/users/me/taught-courses/' + courseId + '/lectures/' + lectureId, {
                type: 'DELETE',
                success: callback,
                error: errorCallback
            });
        },
        getExtras: function(courseId, lectureId, page, callback, errorCallback) {
            page = page || 1;
            return udApiV2.call('/users/me/subscribed-courses/' + courseId + '/lectures/' + lectureId + '/supplementary-assets/', {
                type: 'GET',
                data: {
                    fields: {
                        asset: '@default,asset_type,data,download_urls,title'
                    },
                    page: page,
                    // There are 9 lectures with over 60 extras.
                    // We show a "Load more" button for these edge cases.
                    page_size: 60
                },
                success: callback,
                error: errorCallback
            });
        }
    };
});
