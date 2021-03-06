define([
    'ash',
    'game/GlobalSignals',
    'game/constants/GameConstants',
    'game/constants/UIConstants',
    'game/constants/ItemConstants',
    'game/constants/FightConstants',
    'game/constants/UpgradeConstants',
    'game/constants/PlayerStatConstants',
    'game/worldcreator/WorldCreatorHelper',
    'game/systems/SaveSystem',
    'game/nodes/player/PlayerStatsNode',
    'game/nodes/player/AutoPlayNode',
    'game/nodes/PlayerLocationNode',
    'game/nodes/tribe/TribeUpgradesNode',
    'game/nodes/player/DeityNode',
    'game/components/player/BagComponent',
    'game/components/player/DeityComponent',
    'game/components/player/ItemsComponent',
    'game/components/player/PerksComponent',
    'game/components/player/PlayerActionComponent',
    'game/components/common/PositionComponent',
    'game/components/common/CampComponent',
    'game/components/sector/SectorFeaturesComponent',
    'game/components/sector/ReputationComponent'
], function (Ash,
    GlobalSignals, GameConstants, UIConstants, ItemConstants, FightConstants, UpgradeConstants, PlayerStatConstants,
    WorldCreatorHelper, SaveSystem,
	PlayerStatsNode, AutoPlayNode, PlayerLocationNode, TribeUpgradesNode, DeityNode,
    BagComponent,
	DeityComponent,
	ItemsComponent,
	PerksComponent,
	PlayerActionComponent,
	PositionComponent,
    CampComponent,
	SectorFeaturesComponent,
    ReputationComponent
) {
    var UIOutHeaderSystem = Ash.System.extend({
	
		playerStatsNodes: null,
		deityNodes: null,
		tribeNodes: null,
		currentLocationNodes: null,
		
		gameState: null,
		uiFunctions: null,
		resourcesHelper: null,
        upgradeEffectsHelper: null,
		engine: null,
		
		lastUpdateTimeStamp: 0,
		updateFrequency: 1000 * 1,
	
		constructor: function (uiFunctions, gameState, resourcesHelper, upgradeEffectsHelper) {
			this.gameState = gameState;
			this.uiFunctions = uiFunctions;
			this.resourcesHelper = resourcesHelper;
            this.upgradeEffectsHelper = upgradeEffectsHelper;
			return this;
		},
	
		addToEngine: function (engine) {
			this.engine = engine;
			this.playerStatsNodes = engine.getNodeList(PlayerStatsNode);
			this.deityNodes = engine.getNodeList(DeityNode);
            this.tribeNodes = engine.getNodeList(TribeUpgradesNode);
			this.currentLocationNodes = engine.getNodeList(PlayerLocationNode);
			this.autoPlayNodes = engine.getNodeList(AutoPlayNode);
            
            var sys = this;
            GlobalSignals.playerMovedSignal.add(function () { sys.onPlayerMoved(); });
			
			this.generateStatsCallouts();
		},
	
		removeFromEngine: function (engine) {
			this.engine = null;
			this.playerStatsNodes = null;
			this.deityNodes = null;
			this.currentLocationNodes = null;
			this.autoPlayNodes = null;
		},
		
		generateStatsCallouts: function () {
			$.each($("#statsbar-self .stats-indicator"), function () {
				$(this).wrap("<div class='info-callout-target'></div>");
			});
			$.each($("#header-self-bar .stats-indicator"), function () {
				$(this).wrap("<div class='info-callout-target'></div>");
			});
			$.each($("#header-camp-reputation"), function () {
				$(this).wrap("<div class='info-callout-target'></div>");
			});
			this.uiFunctions.generateCallouts("#statsbar-self");
			this.uiFunctions.generateCallouts("#header-self-bar");
			this.uiFunctions.generateCallouts("#header-camp-container");
		},
	
		update: function (time) {
			if (!this.currentLocationNodes.head) return;
			
            var playerPosition = this.playerStatsNodes.head.entity.get(PositionComponent);
			var campComponent = this.currentLocationNodes.head.entity.get(CampComponent);
			var isInCamp = playerPosition.inCamp;
			
			this.updateOverlay();
			this.updateLevelColours();
			this.updateGameMsg();
			this.updateNotifications(isInCamp);
            this.updateLocation(isInCamp);
            
            if (isInCamp && !campComponent) return;
			
			$("#game-version").text("v. " + this.uiFunctions.changeLogHelper.getCurrentVersionNumber());
            
            var headerText = isInCamp ? campComponent.getName() + "  (level " + playerPosition.level + ")" : "level " + playerPosition.level;
            var showCalendar = this.tribeNodes.head.upgrades.hasUpgrade(this.upgradeEffectsHelper.getUpgradeIdForUIEffect(UpgradeConstants.upgradeUIEffects.calendar));
            $("#grid-location-header h1").text(headerText);
            $("#in-game-date").text(UIConstants.getInGameDate(this.gameState.gamePlayedSeconds));
            this.uiFunctions.toggle("#in-game-date", showCalendar);
            this.uiFunctions.toggle("#grid-tab-header", this.gameState.uiStatus.currentTab !== this.uiFunctions.elementIDs.tabs.out || isInCamp);
			
			if (new Date().getTime() - this.lastUpdateTimeStamp < this.updateFrequency) return;
			this.updatePlayerStats(isInCamp);
			this.updateDeity();
			this.updateItems(false, isInCamp);
			this.updatePerks();
			this.updateResources(isInCamp);
            this.updateItemStats(isInCamp);
			this.lastUpdateTimeStamp = new Date().getTime();
		},
        
        onPlayerMoved: function () {
            var playerPosition = this.playerStatsNodes.head.entity.get(PositionComponent);
			var isInCamp = playerPosition.inCamp;
            this.uiFunctions.slideToggleIf("#main-header-camp", null, isInCamp, 250, 50);
            this.uiFunctions.slideToggleIf("#main-header-bag", null, !isInCamp, 250, 50);
            this.uiFunctions.slideToggleIf("#main-header-equipment", null, !isInCamp, 250, 50);
            this.uiFunctions.slideToggleIf("#main-header-items", null, !isInCamp, 250, 50);
        },
		
		updateOverlay: function () {
			var featuresComponent = this.currentLocationNodes.head.entity.get(SectorFeaturesComponent);
			var sunlit = featuresComponent.sunlit;
            var visionPercentage = (this.playerStatsNodes.head.vision.value / 100);
			var alphaVal = (0.5 - visionPercentage * 0.5);
            alphaVal = Math.min(alphaVal, 1);
			alphaVal = Math.max(alphaVal, 0);
			
			var bgColorVal = 0;
			if (sunlit) bgColorVal = 255;
			// TODO performance consider appending to stylesheet (https://learn.jquery.com/performance/use-stylesheets-for-changing-css/)
			$("#page-overlay").css("background-color", "rgba(" + bgColorVal + "," + bgColorVal + "," + bgColorVal + "," + (alphaVal * 0.5) + ")");
			$("body").toggleClass("sunlit", sunlit);
			$("body").toggleClass("dark", !sunlit);
			$("img").css("opacity", (1 - alphaVal));
		},
		
		updateLevelColours: function () {
			var levelColour = this.getLevelColour();
			var levelColourS = "rgba(" + levelColour.r + ", " + levelColour.g + ", " + levelColour.b + ", 0.85)";
			$.each($(".level-bg-colour"), function () {
				$(this).css("background-color", levelColourS);
			});
			$.each($(".level-text-colour"), function () {
				$(this).css("color", levelColourS);
			});
		},
		
		updatePlayerStats: function (isInCamp) {
			var playerStatsNode = this.playerStatsNodes.head;
            var playerStamina = playerStatsNode.stamina.stamina;
			var playerVision = playerStatsNode.vision.value;
			var maxVision = playerStatsNode.vision.maximum;
			var maxStamina = Math.round(playerStatsNode.stamina.health * PlayerStatConstants.HEALTH_TO_STAMINA_FACTOR);
			
			$("#stats-vision .value").text(UIConstants.roundValue(playerVision, true, false) + " / " + maxVision);
			this.updateStatsCallout("stats-vision", playerStatsNode.vision.accSources);
			
			$("#stats-stamina .value").text(UIConstants.roundValue(playerStamina, true, false) + " / " + maxStamina);
			this.updateStatsCallout("stats-stamina", playerStatsNode.stamina.accSources);

            $("#stats-health .value").text(playerStatsNode.stamina.health);
            this.updateStatsCallout("stats-health", null);

            var staminaWarningLimit = PlayerStatConstants.getStaminaWarningLimit(this.uiFunctions.playerActions.playerActionsHelper, playerStatsNode.stamina);
            $("#stats-health .value").toggleClass("warning", playerStatsNode.stamina.health <= 25);
            $("#stats-vision .value").toggleClass("warning", playerVision <= 25);
            $("#stats-stamina .value").toggleClass("warning", playerStamina <= staminaWarningLimit);
			
			$("#stats-rumours .value").text(UIConstants.roundValue(playerStatsNode.rumours.value, true, false));
			this.uiFunctions.toggle("#stats-rumours", playerStatsNode.rumours.isAccumulating);
			this.updateStatsCallout("stats-rumours", playerStatsNode.rumours.accSources);
			
			$("#stats-evidence .value").text(UIConstants.roundValue(playerStatsNode.evidence.value, true, false));
			this.uiFunctions.toggle("#stats-evidence", this.gameState.unlockedFeatures.evidence);
			this.updateStatsCallout("stats-evidence", playerStatsNode.evidence.accSources);
            
            $("#header-tribe-container").toggle(this.gameState.unlockedFeatures.evidence || playerStatsNode.rumours.isAccumulating);

			var reputationComponent = this.currentLocationNodes.head.entity.get(ReputationComponent);
            if (reputationComponent) {
                $("#header-camp-reputation .value").text(UIConstants.roundValue(reputationComponent.value, true, false) + " / " + reputationComponent.targetValue + " %");
                this.uiFunctions.toggle("#header-camp-reputation", reputationComponent.isAccumulating);
                var reputationCalloutContent = "";
                for (var i in reputationComponent.targetValueSources) {
                    var source = reputationComponent.targetValueSources[i];
                    if (source.amount !== 0) {
                        var amount = Math.round(source.amount * 10000)/10000;
                        if (amount === 0 && source.amount > 0) {
                            amount = "< 0.0001";
                        }
                        reputationCalloutContent += source.source + ": " + amount + "<br/>";
                    }
                }
                UIConstants.updateCalloutContent("#header-camp-reputation", reputationCalloutContent);
            } else {
                this.uiFunctions.toggle("#header-camp-reputation", false);                
            }
            
			var itemsComponent = this.playerStatsNodes.head.entity.get(ItemsComponent);
            var fightAtt = FightConstants.getPlayerAtt(playerStatsNode.stamina, itemsComponent);
            var fightDef = FightConstants.getPlayerDef(playerStatsNode.stamina, itemsComponent);
            var fightStrength = fightAtt + fightDef;
            
            $("#stats-fight .value").text(fightStrength);
            $("#stats-fight-att .value").text(fightAtt);
            $("#stats-fight-def .value").text(fightDef);
			this.uiFunctions.toggle("#stats-fight", this.gameState.unlockedFeatures.fight);
			this.uiFunctions.toggle("#stats-fight-att", this.gameState.unlockedFeatures.fight);
			this.uiFunctions.toggle("#stats-fight-def", this.gameState.unlockedFeatures.fight);
            
            this.uiFunctions.toggle("#stats-scavenge", this.gameState.unlockedFeatures.scavenge && !isInCamp);
			var scavengeEfficiency = Math.round(this.uiFunctions.playerActions.playerActionResultsHelper.getScavengeEfficiency() * 200) / 2;
			$("#stats-scavenge .value").text(scavengeEfficiency + "%");
			UIConstants.updateCalloutContent("#stats-scavenge", "health: " + Math.round(maxStamina/10) + "<br/>vision: " + Math.round(playerVision));
		},
		
		updateStatsCallout: function (indicatorID, changeSources) {
			var content = "";
			var source;
			for (var i in changeSources) {
				source = changeSources[i];
				if (source.amount != 0) {
					var amount = Math.round(source.amount * 1000)/1000;
					if (amount == 0 && source.amount > 0) {
						amount = "<&nbsp;" + (1/1000);
					}
					content += source.source + ": " + amount + "/s<br/>";
				}
			}
			
			if (content.length <= 0) {
				content = "(no change)";
			}
			UIConstants.updateCalloutContent("#" + indicatorID, content);
		},
		
		updateDeity: function () {
			var hasDeity = this.deityNodes.head != null;
			this.uiFunctions.toggle("#statsbar-deity", hasDeity);
			
			if (hasDeity) {
				$("#deity-favour .value").text(Math.round(this.deityNodes.head.deity.favour));
				$("#deity-name").text(this.deityNodes.head.deity.name);
			}
		},
		
		updateItems: function (forced, inCamp) {
            if (inCamp) return;
            
			var itemsComponent = this.playerStatsNodes.head.entity.get(ItemsComponent);
			
			var items = itemsComponent.getUnique(inCamp);
			if (forced || items.length !== this.lastItemsUpdateItemCount) {
                $("ul#list-header-equipment").empty();
                $("ul#list-header-items").empty();
                $("ul#list-items-followers").empty();
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    var count = itemsComponent.getCount(item, inCamp);
                    switch (item.type) {                        
                        case ItemConstants.itemTypes.follower:
                            $("ul#list-items-followers").append("<li>" + UIConstants.getItemDiv(item, -1, true, false) + "</li>");
                            break;
                            
                        case ItemConstants.itemTypes.bag:
                        case ItemConstants.itemTypes.clothing_over:
                        case ItemConstants.itemTypes.clothing_upper:
                        case ItemConstants.itemTypes.clothing_lower:
                        case ItemConstants.itemTypes.clothing_head:
                        case ItemConstants.itemTypes.clothing_hands:
                        case ItemConstants.itemTypes.shoes:
                        case ItemConstants.itemTypes.light:
                        case ItemConstants.itemTypes.weapon:
                            if (item.equipped)
                                $("ul#list-header-equipment").append("<li>" + UIConstants.getItemDiv(item, -1, true, false) + "</li>");
                            break;
                        
                        case ItemConstants.itemTypes.exploration:
                            $("ul#list-header-items").append("<li>" + UIConstants.getItemDiv(item, count, true, false) + "</li>");
                            break;
                    }
                }
                
                this.uiFunctions.generateCallouts("ul#list-header-items");
                this.uiFunctions.generateCallouts("ul#list-header-equipment");
                this.uiFunctions.generateCallouts("ul#list-items-followers");
                
                this.lastItemsUpdateItemCount = items.length;
			}
		},
		
		updatePerks: function (forced) {
			var perksComponent = this.playerStatsNodes.head.entity.get(PerksComponent);
			
			var perks = perksComponent.getAll();
            var resetList = forced || perks.length !== $("ul#list-items-perks li").length;
			if (resetList) {
				$("ul#list-items-perks").empty();
            }
            
            for (var i = 0; i < perks.length; i++) {
                var perk = perks[i];
                var desc = perk.name + " (" + UIConstants.getPerkDetailText(perk) + ")";
                if (resetList) {
                    var url = perk.icon;
                    var isNegative = perksComponent.isNegative(perk);
                    var liClass = isNegative ? "li-item-negative" : "li-item-positive";
                    liClass += " item item-equipped";
                    var li =
                        "<li class='" + liClass + "' id='perk-header-" + perk.id + "'>" +
                        "<div class='info-callout-target info-callout-target-small' description='" + desc + "'>" +
                        "<img src='" + url + "' alt='" + perk.name + "'/>" +
                        "</div></li>";
                } else {
                    $("#perk-header-" + perk.id + " .info-callout-target").attr("description", desc);
                    $("#perk-header-" + perk.id).toggleClass("event-ending", perk.effectTimer >= 0 && perk.effectTimer < 5);
                }
                $("ul#list-items-perks").append(li);
            }
			
            if (resetList) {
                this.uiFunctions.generateCallouts("ul#list-items-perks");
            }
		},
		
		updateResources: function (inCamp) {
            var itemsComponent = this.playerStatsNodes.head.entity.get(ItemsComponent);
			var showResources = this.getShowResources();
			var showResourceAcc = this.getShowResourceAcc();
			var storageCap = this.resourcesHelper.getCurrentStorageCap();
			var showStorageName = this.resourcesHelper.getCurrentStorageName();
			var currencyComponent = this.resourcesHelper.getCurrentCurrency();
			var inventoryUnlocked = false;
            
            this.uiFunctions.toggle("#header-camp-storage", inCamp);
            this.uiFunctions.toggle("#header-camp-currency", inCamp && this.gameState.unlockedFeatures.currency);
            this.uiFunctions.toggle("#statsbar-resources", inCamp);
            this.uiFunctions.toggle("#header-bag-storage", !inCamp && this.gameState.unlockedFeatures.bag);
            this.uiFunctions.toggle("#header-bag-currency", !inCamp && currencyComponent.currency > 0);
            this.uiFunctions.toggle("#bag-resources", !inCamp);
            $("#header-camp-container").toggleClass("hidden", !inCamp && !this.gameState.unlockedFeatures.bag && itemsComponent.getAll().length == 0 && showResources.getTotal() === 0);
	
            $("#header-camp-currency .value").text(currencyComponent ? currencyComponent.currency : "??");
            $("#header-bag-currency .value").text(currencyComponent ? currencyComponent.currency : "??");
    
			for (var key in resourceNames) {
				var name = resourceNames[key];
				var resourceUnlocked = this.gameState.unlockedFeatures.resources[name] === true;
				inventoryUnlocked = inventoryUnlocked || resourceUnlocked;
                if (inCamp) {
                    UIConstants.updateResourceIndicator(
                        this.uiFunctions,
                        "#resources-" + name,
                        showResources.getResource(name),
                        showResourceAcc == null ? 0 : Math.round(showResourceAcc.resourceChange.getResource(name) * 10000) / 10000,
                        storageCap,
                        false,
                        true,
                        true,
                        true,
                        name === resourceNames.food || name === resourceNames.water,
                        resourceUnlocked
                    );
                    if (showResourceAcc) {
                        UIConstants.updateResourceIndicatorCallout("#resources-" + name, showResourceAcc.getSources(name));
                    }
                    $("#header-camp-storage .label").text(showStorageName);
                    $("#header-camp-storage .value").text(storageCap);
                } else {
                    var isSupplies = name === resourceNames.food || name === resourceNames.water;
                    UIConstants.updateResourceIndicator(
                        this.uiFunctions,
                        "#resources-bag-" + name,
                        showResources.getResource(name),
                        showResourceAcc == null ? 0 : Math.round(showResourceAcc.resourceChange.getResource(name) * 10000) / 10000,
                        storageCap,
                        false,
                        false,
                        false,
                        false,
                        name === resourceNames.food || name === resourceNames.water,
                        resourceUnlocked && (name === "water" || name === "food" || showResources.getResource(name) > 0)
                    );
                    
                    var bagComponent = this.playerStatsNodes.head.entity.get(BagComponent);
                    $("#header-bag-storage .value").text(Math.floor(bagComponent.usedCapacity * 10) / 10);
                    $("#header-bag-storage .value-total").text(storageCap);
                }
			}
		},
        
        updateItemStats: function (inCamp) {
            var itemsComponent = this.playerStatsNodes.head.entity.get(ItemsComponent);
            var playerStamina = this.playerStatsNodes.head.stamina;
            var visibleStats = 0;
            for (var bonusKey in ItemConstants.itemBonusTypes) {
                var bonusType = ItemConstants.itemBonusTypes[bonusKey];
                var bonus = itemsComponent.getCurrentBonus(bonusType);
                var value = bonus;
                var detail = bonus + " from items";
                var isVisible = true;
                switch (bonusType) {
                    case ItemConstants.itemBonusTypes.fight_att:
                        value = FightConstants.getPlayerAtt(playerStamina, itemsComponent);
                        detail = FightConstants.getPlayerAttDesc(playerStamina, itemsComponent);
                        isVisible = this.gameState.unlockedFeatures.fight;
                        break;
                    case ItemConstants.itemBonusTypes.fight_def:
                        value = FightConstants.getPlayerDef(playerStamina, itemsComponent);
                        detail = FightConstants.getPlayerDefDesc(playerStamina, itemsComponent);
                        isVisible = this.gameState.unlockedFeatures.fight;
                        break;
                    case ItemConstants.itemBonusTypes.light:
                    case ItemConstants.itemBonusTypes.bag:
                        isVisible = false;
                        //value = playerVision.maximum;
                        break;
                        
                    default:                        
                        isVisible = true;
                        break;
                }
                $("#stats-equipment-" + bonusKey + " .value").text(UIConstants.roundValue(value, true, true));
                this.uiFunctions.toggle("#stats-equipment-" + bonusKey, isVisible && value > 0);
                UIConstants.updateCalloutContent("#stats-equipment-" + bonusKey, detail);
                
                if (isVisible && value > 0)
                    visibleStats++;
            }
            
            this.uiFunctions.toggle("#header-self-bar hr", visibleStats > 0)
        },
		
		updateGameMsg: function () {
			if (this.engine) {
				var gameMsg = "";
				var saveSystem = this.engine.getSystem(SaveSystem);
				var timeStamp = new Date().getTime();
                
                if (saveSystem.error)
                    gameMsg = saveSystem.error;
				else if (saveSystem.lastSaveTimeStamp > 0 && timeStamp - saveSystem.lastSaveTimeStamp < 3 * 1000)
					gameMsg = "Game saved ";
					
				if (this.autoPlayNodes.head) gameMsg += "Autoplaying";
				
				$("#game-msg").text(gameMsg);
			}
		},
		
		updateNotifications: function (inCamp) {
            this.uiFunctions.toggle("#notification-player", inCamp);
            if (inCamp) {
                var busyComponent = this.playerStatsNodes.head.entity.get(PlayerActionComponent);
                var isBusy = this.playerStatsNodes.head.entity.has(PlayerActionComponent) && busyComponent.isBusy();
                if (isBusy) {
                    $("#notification-player-bar").data("progress-percent", busyComponent.getBusyPercentage());
                    $("#notification-player-bar .progress-label").text(busyComponent.getBusyDescription());
                }
                $("#notification-player").css("opacity", isBusy ? 1 : 0);
            }
		},
        
        updateLocation: function (inCamp) {
			$("body").toggleClass("location-inside", inCamp);
			$("body").toggleClass("location-outside", !inCamp);
            
            var featuresComponent = this.currentLocationNodes.head.entity.get(SectorFeaturesComponent);
            var sunlit = featuresComponent.sunlit;
            var imgName = "img/ui-" + (inCamp ? "camp" : "explore") + (sunlit ? "" : "-dark") + ".png";
            if ($("#header-self-inout img").attr("src") !== imgName)
                $("#header-self-inout img").attr("src", imgName);
            $("#header-self-inout img").attr("alt", (inCamp ? "in camp" : "outside"));
            $("#header-self-inout img").attr("title", (inCamp ? "in camp" : "outside"));
            
            var itemsComponent = this.playerStatsNodes.head.entity.get(ItemsComponent);
            var hasMap = itemsComponent.getCountById(ItemConstants.itemDefinitions.uniqueEquipment[0].id, true) > 0;
            $("#out-position-indicator").text(hasMap ? this.currentLocationNodes.head.entity.get(PositionComponent).getPosition().getInGameFormat(false) : "??");
        },
		
		getShowResources: function () {
			return this.resourcesHelper.getCurrentStorage().resources;
		},
		
		getShowResourceAcc: function () {
			return this.resourcesHelper.getCurrentStorageAccumulation(false);
		},
		
		getLevelColour: function () {
			var featuresComponent = this.currentLocationNodes.head.entity.get(SectorFeaturesComponent);
			var level = this.currentLocationNodes.head.entity.get(PositionComponent).level;
			var maxLevel = WorldCreatorHelper.getHighestLevel(this.gameState.worldSeed);
			var minLevel = WorldCreatorHelper.getBottomLevel(this.gameState.worldSeed);
			var sunlit = featuresComponent.sunlit;
			
			var c = new Object();
			if (sunlit) {
				c.r = 255;
				c.g = 255;
				c.b = 255;
			} else {
				if (level > 3) {
					c.r = Math.pow(level/maxLevel,10)*420;
					c.g = Math.pow(level/maxLevel,8)*335;
					c.b = Math.pow(level/maxLevel,8)*345;
				} else {
					c.r = Math.pow((level-20)/(minLevel-20),8)*2;
					c.g = Math.pow((level-20)/(minLevel-20),9)*120;
					c.b = Math.pow((level-20)/(minLevel-20),8)*80;
				}
			}
			
			c.r = Math.max( Math.min( Math.round(c.r), 255), 0);
			c.g = Math.max( Math.min( Math.round(c.g), 255), 0);
			c.b = Math.max( Math.min( Math.round(c.b), 255), 0);
			
			return c;
		},
    });

    return UIOutHeaderSystem;
});
