/**
 * Video.js Settings Selector
 *
 * This plugin for Video.js adds a settings selector option to the toolbar. Settings include the
 * available resolutions for the video, as well as extra links such as "Download lecture".
 *
 * Usage:
 * <video>
 *  <source data-res="480" src="..." />
 *  <source data-res="240" src="..." />
 * </video>
 */

(function(_V_) {
    'use strict';

    /***********************************************************************************
     * Define some helper functions
     ***********************************************************************************/
    var methods = {
        /**
         * In a future version, this can be made more intelligent,
         * but for now, we'll just add a "p" at the end if we are passed
         * numbers.
         *
         * @param   (string)    res The resolution to make a label for
         *
         * @returns (string)    The label text string
         */
        resLabel: function(res) {
            return (/^\d+$/.test(res)) ? res + 'p' : res;
        },

        setEvent: function(menuItem, eventName) {
            menuItem.on('click', function() {
                this.player().trigger(eventName);
            });
        }
    };

    /***********************************************************************************
     * Setup our resolution menu items
     ***********************************************************************************/
    _V_.ResolutionMenuItem = _V_.MenuItem.extend({

        // Call variable to prevent the resolution change from being called twice
        callCount: 0,

        /** @constructor */
        init: function(player, options){

            // Modify options for parent MenuItem class's init.
            options.label = methods.resLabel(options.res);
            options.selected = (options.res.toString() === player.getCurrentRes().toString());

            // Call the parent constructor
            _V_.MenuItem.call(this, player, options);

            // Store the resolution as a property
            this.resolution = options.res;

            // Register our click and tap handlers
            this.on(['click', 'tap'], this.onClick);

            // Toggle the selected class whenever the resolution changes
            player.on('changeRes', _V_.bind(this, function() {
                if(this.resolution.toString() === player.getCurrentRes().toString()) {
                    this.selected(true);
                } else {
                    this.selected(false);
                }
                // Reset the call count
                this.callCount = 0;
            }));
        }
    });

    // Handle clicks on the menu items
    _V_.ResolutionMenuItem.prototype.onClick = function() {
        // Check if this has already been called
        if(this.callCount > 0) { return; }
        // Call the player.changeRes method
        this.player().changeRes(this.resolution);
        // Increment the call counter
        this.callCount++;
    };

    /***********************************************************************************
     * Setup our resolution menu title item
     ***********************************************************************************/
    _V_.ResolutionTitleMenuItem = _V_.MenuItem.extend({

        init: function(player, options) {
            // Call the parent constructor
            _V_.MenuItem.call(this, player, options);
            // No click handler for the menu title
            this.off('click');
        }
    });

    /***********************************************************************************
     * Define our resolution selector button
     ***********************************************************************************/
    _V_.ResolutionSelector = _V_.MenuButton.extend({

        /** @constructor */
        init: function(player, options) {

            // Add our list of available resolutions to the player object
            player.availableRes = options.availableRes;

            // Call the parent constructor
            _V_.MenuButton.call(this, player, options);

            // Set the button text based on the option provided
            this.el().firstChild.firstChild.innerHTML = options.buttonText;
        }
    });

    // Set class for resolution selector button
    _V_.ResolutionSelector.prototype.className = 'vjs-res-button';

    // Create a menu item for each available resolution
    _V_.ResolutionSelector.prototype.createItems = function() {

        var player = this.player(),
            item, items = [], extraLinks = this.options().extraLinks,
            currentRes;

        // Add the menu title item
        items.push(new _V_.ResolutionTitleMenuItem(player, {
            el: _V_.Component.prototype.createEl('li', {
                className: 'vjs-menu-title vjs-res-menu-title',
                innerHTML: player.localize('Quality')
            })
        }));

        // Add an item for each available resolution
        for(currentRes in player.availableRes) {

            // Don't add an item for the length attribute
            if(currentRes === 'length') { continue; }

            items.push(new _V_.ResolutionMenuItem(player, {
                res: currentRes
            }));
        }

        // Sort the available resolutions in descending order
        items.sort(function(a, b) {
            if(typeof a.resolution === 'undefined') {
                return -1;
            } else {
                return parseInt(b.resolution) - parseInt(a.resolution);
            }
        });

        // Add an item for each extra link
        for(var i = 0; i < extraLinks.length; i++) {
            item = new _V_.MenuItem(player, { label: extraLinks[i].name });
            item.el().className += ' vjs-res-menu-extra-item';
            item.off('click');
            methods.setEvent(item, extraLinks[i].event);
            items.push(item);
        }

        return items;
    };

    /***********************************************************************************
     * Register the plugin with videojs, main plugin function
     ***********************************************************************************/
    _V_.plugin('resolutionSelector', function(options) {

        /*******************************************************************
         * Setup variables, parse settings
         *******************************************************************/
        var player = this,
            i, j, currentRes, availableRes,
            // Override default options with those provided
            settings = _V_.util.mergeOptions({
                // (string) The resolution that should be selected by default ('480' or  '480,1080,240')
                defaultRes: '',
                // (array)  List of media types. If passed, we need to have source for each type in
                // each resolution or that resolution will not be an option
                forceTypes: false,
                // (array)  List of extra links. Each link is an object {"name": name of the link, "event": name of the event to trigger on click}.
                extraLinks: []
            }, options || {}),

            // Split default resolutions if set and valid, otherwise default to an empty array
            defaultResolutions = (settings.defaultRes && typeof settings.defaultRes === 'string') ? settings.defaultRes.split(',') : [];

        function getAvailableRes() {
            var sources = player.options().sources;
            i = sources.length;
            availableRes = { length: 0 };
            if(!player.el().firstChild.canPlayType) {
                return; // Cannot change resolution when Flash is used.
            }
            while (i > 0) {
                i--;
                // Skip sources that don't have data-res attributes
                if(!sources[i]['data-res']) { continue; }
                currentRes = sources[i]['data-res'];
                if(typeof availableRes[currentRes] !== 'object') {
                    availableRes[currentRes] = [];
                    availableRes.length++;
                }
                availableRes[currentRes].push(sources[i]);
            }
        }

        function checkForcedTypes(forceTypes) {
            var foundTypes;
            if(forceTypes) {
                for(currentRes in availableRes) {
                    // Don't count the length property as a resolution
                    if(currentRes === 'length') { continue; }
                    i = forceTypes.length;
                    foundTypes = 0;
                    // Loop through all required types
                    while (i > 0) {
                        i--;
                        j = availableRes[currentRes].length;
                        // Loop through all available sources in current resolution
                        while (j > 0) {
                            j--;
                            // Check if the current source matches the current type we're checking
                            if(forceTypes[i] === availableRes[currentRes][j].type) {
                                foundTypes++;
                                break;
                            }
                        }
                    }
                    // If we didn't find sources for all of the required types in the current res, remove it
                    if(foundTypes < forceTypes.length) {
                        delete availableRes[currentRes];
                        availableRes.length--;
                    }
                }
            }
        }

        // Loop through the chosen default resolutions if there were any
        getAvailableRes();
        checkForcedTypes(settings.forceTypes);
        for(i = 0; i < defaultResolutions.length; i++) {
            // Set the video to start out with the first available default res
            if(availableRes[defaultResolutions[i]]) {
                player.src(availableRes[defaultResolutions[i]]);
                player.currentRes = defaultResolutions[i];
                break;
            }
        }

        /*******************************************************************
         * Add methods to player object
         *******************************************************************/

        // Make sure we have player.localize() if it's not defined by Video.js
        if(typeof player.localize !== 'function') {
            player.localize = function(string) {
                return string;
            };
        }

        // Helper function to get the current resolution
        player.getCurrentRes = function() {
            if(typeof player.currentRes !== 'undefined') {
                return player.currentRes;
            } else {
                try {
                    return player.options().sources[0]['data-res'];
                } catch(e) {
                    return '';
                }
            }
        };

        // Define the change res method
        player.changeRes = function(targetResolution) {
            var videoEl = player.el().firstChild,
                isPaused = player.paused(),
                currentTime = player.currentTime(),
                buttonNodes,
                buttonNodeCount;
            // Do nothing if we aren't changing resolutions or if the resolution isn't defined
            if(player.getCurrentRes().toString() === targetResolution.toString()
                || !player.availableRes
                || !player.availableRes[targetResolution]) { return; }
            // Make sure the loadedmetadata event will fire
            if(videoEl.preload === 'none') { videoEl.preload = 'metadata'; }
            // Change the source and make sure we don't start the video over
            player.src(player.availableRes[targetResolution]).one('loadedmetadata', function() {
                player.currentTime(currentTime);
                // If the video was paused, don't show the poster image again
                player.addClass('vjs-has-started');
                if(!isPaused) { player.play(); }
            });
            // Save the newly selected resolution in our player options property
            player.currentRes = targetResolution;
            // Make sure the button has been added to the control bar
            if(player.controlBar.resolutionSelector) {
                buttonNodes = player.controlBar.resolutionSelector.el().firstChild.children;
                buttonNodeCount = buttonNodes.length;
                // Update the button text
                while (buttonNodeCount > 0) {
                    buttonNodeCount--;
                    if(buttonNodes[buttonNodeCount].className === 'vjs-control-text') {
                        buttonNodes[buttonNodeCount].innerHTML = methods.resLabel(targetResolution);
                        break;
                    }
                }
            }

            // Update the classes to reflect the currently selected resolution
            player.trigger('changeRes');
        };

        if(availableRes.length || settings.extraLinks.length) {
            // Add the ResolutionSelector to the control bar object and the DOM
            player.controlBar.resolutionSelector = player.controlBar.addChild(
                new _V_.ResolutionSelector(player, {
                    buttonText: player.localize(methods.resLabel(player.getCurrentRes() || 'Quality')),
                    availableRes: availableRes,
                    extraLinks: settings.extraLinks
                })
            );
        }
    });
})(window.videojs);
