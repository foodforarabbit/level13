// Lists miscellaneous improvements that the given entity (should be a Sector) contains
define(['ash', 'game/vos/ImprovementVO'], function (Ash, ImprovementVO) {
    var SectorImprovementsComponent = Ash.Class.extend({
        
        improvements: {},
        
        constructor: function () {
            this.initImprovements();
        },
        
        initImprovements: function() {
            this.improvements = {};
        },
        
        add: function(type, amount) {
            var vo = this.improvements[type];
            if (!vo) {
                this.improvements[type] = new ImprovementVO(type);
                vo = this.improvements[type];
            }
            if (!amount) {
                vo.count++;
            } else {
                vo.count += amount;
            }
            vo.count = parseInt(vo.count);
        },
        
        getCount: function(type) {
            var vo = this.improvements[type];
            if (vo) {
                return vo.count;
            } else {
                return 0;
            }
        },
        
        getVO: function(type) {
            var vo = this.improvements[type];
            if (vo) {
                return vo;
            } else {
                return new ImprovementVO(type);
            }
        },
        
        getAll: function (improvementType) {
            var allImprovements = [];
            for (var key in this.improvements) {
				var val = this.improvements[key];
				if (typeof val == "object") {
					if (!improvementType || val.getType() === improvementType)
						allImprovements.push(val);
				}
			}
            
            return allImprovements;
        },
		
		getTotal: function (improvementType) {
			var allImprovements = this.getAll(improvementType);
			var count = 0;
			for (var i = 0; i < allImprovements.length; i++) {
				count += allImprovements[i].count;
			}
			return count;
		},
        
        customLoadFromSave: function(componentValues) {
            for(var key in componentValues.improvements) {
                if (key == "undefined") continue;
                this.improvements[key] = new ImprovementVO(key);
                this.improvements[key].count = componentValues.improvements[key].count;
                if (componentValues.improvements[key].storedResources) {
                    for (var res in componentValues.improvements[key].storedResources) {
                        this.improvements[key].storedResources[res] = componentValues.improvements[key].storedResources[res];
                    }
                }
            }
        }
        
    });

    return SectorImprovementsComponent;
});
