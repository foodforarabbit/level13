// Marks that given entity (should be a Sector) contains a Camp
define(['ash', 'game/constants/CampConstants'], function (Ash, CampConstants) {
    var CampComponent = Ash.Class.extend({
        
        
        population: 0,
        rumourpool: 0,
        rumourpoolchecked: false,
        assignedWorkers: {},
        campName: "",
        
        constructor: function () {
            this.population = 0;
            this.rumourpool = 0;
            this.rumourpoolchecked = false;
            this.assignedWorkers = {};
            for(var worker in CampConstants.WORKER_TYPES) {
                this.assignedWorkers[worker] = 0;
            }
            this.campName = "";
        },
        
        getFreePopulation: function () {
            return Math.floor(this.population - this.getAssignedPopulation());
        },
        
        getAssignedPopulation: function () {
            var assigned = 0;
            for(var key in this.assignedWorkers) {
                assigned += this.assignedWorkers[key];
            }
            return assigned;
        },
        
        addPopulation: function (value) {
            this.population += value;
            this.rumourpool += value * CampConstants.POOL_RUMOURS_PER_POPULATION;
        },
        
        setPopulation: function (value) {
            var rumourpoolchange = (value - this.population) * CampConstants.POOL_RUMOURS_PER_POPULATION;
            this.population = value;
            this.rumourpool += rumourpoolchange;
        },
        
        getType: function () {
            return "Camp";
        },
        
        getName: function () {
            if (this.campName) {
                return this.getType() + " " + this.campName;
            } else {
                return this.getType();
            }
        }
    });

    return CampComponent;
});
