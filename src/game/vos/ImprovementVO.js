define(['ash', 'game/vos/ResourcesVO'], function (Ash, ResourcesVO) {
    
    // Global static definitions
    improvementNames = {
		collector_food: "Trap",
		collector_water: "Bucket",
		
		bridge: "Bridge",
		passageUpStairs: "Passage Up (S)",
		passageUpElevator: "Passage Up (E)",
		passageUpHole: "Passage Up (H)",
		passageDownStairs: "Passage Down (S)",
		passageDownElevator: "Passage Down (E)",
		passageDownHole: "Passage Down (H)",
        spaceship1: "Colony Hull",
        spaceship2: "Colony Shield",
        spaceship3: "Colony Life Support",
		
        home: "Tent",
		house: "Hut",
		house2: "Tower block",
		storage: "Storage",
		campfire: "Campfire",
		darkfarm: "Snail farm",
		hospital: "Hospital",
        generator: "Generator",
		tradepost: "Trading post",
		inn: "Inn",
		apothecary: "Apothecary shop",
		smithy: "Smithy",
		cementmill: "Cement mill",
		library: "Library",
		shrine: "Shrine",
		market: "Market",
		radiotower: "Radio tower",
		barracks: "Barracks",
		fortification: "Fortification",
		aqueduct: "Aqueduct",
		researchcenter: "Research center",
		lights: "Lights",
		ceiling: "Ceiling",
    };
	
	improvementTypes = {
		camp: "Camp",
		level: "Level",
	};
    
    var ImprovementVO = Ash.Class.extend({
	
        constructor: function (name) {
			this.name = name;
			this.count = 0;
			
			this.initStorage();
		},
	
		initStorage: function() {
			switch (this.name) {
				case improvementNames.collector_food:
					this.storedResources = new ResourcesVO();
					this.storageCapacity = new ResourcesVO();
					this.storageCapacity.food = 10;
					break;
				case improvementNames.collector_water:
					this.storedResources = new ResourcesVO();
					this.storageCapacity = new ResourcesVO();
					this.storageCapacity.water = 10;
					break;
			}
        },
		
		getType: function() {
            return getImprovementType(this.name);
		},
    });
    
    getImprovementType = function (name) {
        switch (name) {
            case improvementNames.collector_food:
            case improvementNames.collector_water:
            case improvementNames.bridge:
            case improvementNames.spaceship1:
            case improvementNames.spaceship2:
            case improvementNames.spaceship3:
            case improvementNames.passageUpStairs:
            case improvementNames.passageUpElevator:
            case improvementNames.passageUpHole:
            case improvementNames.passageDownStairs:
            case improvementNames.passageDownElevator:
            case improvementNames.passageDownHole:
                return improvementTypes.level;

            default:
                return improvementTypes.camp;
        }
    };
    
    return ImprovementVO;
});
