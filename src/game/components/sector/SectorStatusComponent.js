// Current sector control status & wins needed
define(['ash'], function (Ash) {

    var SectorStatusComponent = Ash.Class.extend({
        
        discoveredResources: [],
        scouted: false,
        localesScouted: [],
        glowStickSeconds: -100, // not saved
        wasteClearedDirections: [],
        
        constructor: function () {
            this.discoveredResources = [];
            this.scouted = false;
            this.localesScouted = [];
        },
        
        addDiscoveredResource: function (name) {
            if (this.discoveredResources.indexOf(name) < 0) {
                this.discoveredResources.push(name);
            }
        },
        
        isLocaleScouted: function (i) {
            if (!this.localesScouted[i]) return false;
            return this.localesScouted[i];
        },
        
        getNumLocalesScouted: function () {
            var scouted = 0;
            for (var i = 0; i < this.localesScouted.length; i++) {
                if (this.localesScouted[i]) scouted++;
            }
            return scouted;
        },
        
        isCleared: function (direction) {
            return this.wasteClearedDirections && this.wasteClearedDirections.indexOf(parseInt(direction)) >= 0;
        },
        
        setCleared: function (direction) {
            if (this.isCleared(direction))
                return;
            this.wasteClearedDirections.push(parseInt(direction));
        },
        
        getSaveKey: function () {
            return "SectorStatus";
        },
        
        getCustomSaveObject: function () {
            var copy = {};
            copy.dR = this.discoveredResources;
            copy.s = this.scouted;
            copy.lS = this.localesScouted;
            copy.wd = this.wasteClearedDirections ? this.wasteClearedDirections  : [];
            return copy;
        },
        
        customLoadFromSave: function (componentValues) {
            this.discoveredResources = componentValues.dR ? componentValues.dR : componentValues.discoveredResources;
            this.scouted = typeof componentValues.s !== "undefined" ? componentValues.s : componentValues.scouted;
            if (componentValues.lS)
                this.localesScouted = componentValues.lS;
            else
                this.localesScouted = componentValues.localesScouted;
            this.wasteClearedDirections = componentValues.wd ? componentValues.wd : [];
        }
        
    });

    return SectorStatusComponent;
});
