define([
    'ash',
	'game/constants/GameConstants',
    'game/constants/ItemConstants',
    'game/constants/PlayerStatConstants',
    'game/nodes/player/VisionNode',
    'game/nodes/PlayerLocationNode',
    'game/components/common/PositionComponent',
    'game/components/sector/improvements/SectorImprovementsComponent',
    'game/components/sector/SectorFeaturesComponent',
    'game/components/sector/SectorStatusComponent',
], function (Ash, GameConstants, ItemConstants, PlayerStatConstants, VisionNode, PlayerLocationNode, PositionComponent, SectorImprovementsComponent, SectorFeaturesComponent, SectorStatusComponent) {
    var VisionSystem = Ash.System.extend({
	
        gameState: null,
    
        visionNodes: null,
        locationNodes: null,

        constructor: function (gameState) {
            this.gameState = gameState;
        },

        addToEngine: function (engine) {
            this.engine = engine;
            this.visionNodes = engine.getNodeList(VisionNode);
            this.locationNodes = engine.getNodeList(PlayerLocationNode);
        },

        removeFromEngine: function (engine) {
            this.visionNodes = null;
            this.locationNodes = null;
            this.engine = null;
        },

        update: function (time) {
            for (var node = this.visionNodes.head; node; node = node.next) {
                this.updateNode(node, time + this.engine.extraUpdateTime);
            }
        },

        updateNode: function (node, time) {
            if (this.gameState.isPaused) return;
            
			var vision = node.vision;
			var oldMaximum = vision.maximum;
			var oldValue = vision.value;
			
			if (!this.locationNodes.head) return;
            
			var featuresComponent = this.locationNodes.head.entity.get(SectorFeaturesComponent);
            var statusComponent = this.locationNodes.head.entity.get(SectorStatusComponent);
			var itemsComponent = node.items;
			var improvements = this.locationNodes.head.entity.get(SectorImprovementsComponent);
			var inCamp = node.entity.get(PositionComponent).inCamp;
			var sunlit = featuresComponent.sunlit;
            
            var maxValue = 0;
            var visionPerSec = 0;
            var accSpeedFactor = Math.max(100 - oldValue, 10) / 200;
            
            vision.accSources = [];
            var addAccumulation = function (sourceName, value) {
                var visionPerSecSource = Math.round(value * accSpeedFactor * 10) / 10 * GameConstants.gameSpeedExploration;
                visionPerSec += visionPerSecSource;
                vision.accSources.push({ source: sourceName, amount: visionPerSecSource });
            };
            
            // Check max value and accumulation
			var maxValueBase = sunlit ? PlayerStatConstants.VISION_BASE_SUNLIT : PlayerStatConstants.VISION_BASE;
			maxValue = maxValueBase;
            addAccumulation("Base", 25 / maxValueBase);
			
			if (inCamp) {
				if (!sunlit) {
					if (improvements.getCount(improvementNames.campfire) > 0) {
                        maxValue = Math.max(maxValue, 70);
                        addAccumulation("Campfire", 70 / maxValueBase);
                    }
					if (improvements.getCount(improvementNames.lights) > 0) {
                        maxValue = Math.max(maxValue, 100);
                        addAccumulation("Lights", 100 / maxValueBase);
                    }
				} else {
					if (improvements.getCount(improvementNames.ceiling) > 0) {
                        maxValue = Math.max(maxValue, 100);
                        addAccumulation("Ceiling", 100 / maxValueBase);
                    }
				}
			}
			
			if (sunlit) {
				var shadeBonus = itemsComponent.getCurrentBonus(ItemConstants.itemBonusTypes.res_sunlight);
				if (shadeBonus + maxValueBase > maxValue) {
					maxValue = shadeBonus + maxValueBase;
					addAccumulation("Equipment", shadeBonus / maxValueBase);
				}
			} else {
				var lightItem = itemsComponent.getEquipped(ItemConstants.itemTypes.light)[0];
				if (lightItem && lightItem.getBonus(ItemConstants.itemBonusTypes.light) + maxValueBase > maxValue) {
					maxValue = lightItem.getBonus(ItemConstants.itemBonusTypes.light) + maxValueBase;
					addAccumulation(lightItem.name, lightItem.getBonus(ItemConstants.itemBonusTypes.light) / maxValueBase);
				}
                if (statusComponent.glowStickSeconds > 0) {
                    // TODO remove hardcoded glowstick vision value
                    maxValue = 30 + maxValueBase;
                    addAccumulation("Glowstick", 30 / maxValueBase);
                }
                statusComponent.glowStickSeconds -= time * GameConstants.gameSpeedExploration;
			}
			
			// Increase
			vision.value += time * visionPerSec;
			vision.accumulation = visionPerSec;
			vision.maximum = maxValue;
			
            // Effects of moving from different light environments
			if (oldMaximum > 0 && maxValue < oldMaximum) {
				vision.value = Math.min(vision.value, Math.min(vision.value, maxValue) - Math.abs(oldMaximum - maxValue));
			}
			if (oldMaximum > 0 && maxValue > oldMaximum && sunlit) {
				vision.value = Math.min(vision.value, vision.value - Math.abs(oldMaximum - maxValue));
			}
			
            // Limit to min / max
			if (vision.value > maxValue) {
				vision.value = maxValue;
			}
			if (vision.value < 0) {
				vision.value = 0;
			}
        },
    });

    return VisionSystem;
});
