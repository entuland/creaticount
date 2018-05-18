
var utils = {	
	findSpriteByName: function(name) {
		for(var i in icondata) {
			var sprite = icondata[i];
			if(sprite.i == name) {
				return sprite;
			}
		}
		return false;
	},
	
	formatTime: function(seconds) {
		var minutes = Math.floor(seconds / 60);
		var leftSeconds = seconds % 60;
		var hours = Math.floor(minutes / 60);
		var leftMinutes = minutes % 60;
		var output = "";
		output += hours ? hours + "h, " : '';
		output += leftMinutes || hours ? leftMinutes + "m, " : '';
		output += leftSeconds || leftMinutes || hours ? leftSeconds + "s" : '';
		return output;
	},
	
	keys: function(obj) {
		var arr = [];
		for(var key in obj) {
			arr.push(key);
		}
		return arr;
	},
	
	sortedKeys: function(obj) {
		var arr = utils.keys(obj);
		arr.sort();
		return arr;
	},
	
	sortedKeysByProperty: function(obj, propname) {
		var arr = utils.keys(obj);
		arr.sort(function(a, b) {
			var textA = obj[a][propname].toUpperCase();
			var textB = obj[b][propname].toUpperCase();
			return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
		});
		return arr;
	},
};

var counter = {
	iconside: 64,
	
	matPrecedence: [
		"stone_item", "wood_oak_item", "leaves_oak_item", "stairs_medieval", "stairs_haunted", "chizzard_gizzard",
	],
	
	prepare: {},
	
	delay: 500,
	
	init: function() {
		counter.tieWorking();
		counter.attachInfo();
		counter.attachSearch();
		counter.processSearch();
	},
	
	attachSearch: function() {
		counter.searchResult = document.querySelector("#search-result");
		counter.searchInput = document.querySelector("#search");
		counter.searchInput.addEventListener("input", counter.processDelayedSearch);
	},
  
	tieWorking: function() {
		counter.chosenList = {};
		counter.timingRecapContainer = document.querySelector("#timing-recap");
		counter.chosenListContainer = document.querySelector("#chosen-list");
		counter.prepareListContainer = document.querySelector("#prepare-list");
		counter.forgesCount = document.querySelector("#forges");
		counter.processorsCount = document.querySelector("#processors");
		counter.leavesFlag = document.querySelector("#leaves");
		counter.coalFlag = document.querySelector("#coal");
		counter.tarfoodFlag = document.querySelector("#tarfood");
		counter.forgesCount.addEventListener("input", counter.displayTime);
		counter.processorsCount.addEventListener("input", counter.displayTime);
		counter.leavesFlag.addEventListener("change", counter.displayTime);
		counter.coalFlag.addEventListener("change", counter.displayTime);
		counter.tarfoodFlag.addEventListener("change", counter.displayTime);
	},
	
	clearTime: function() {
		counter.stations = {
			forge: {},
			processor: {},
		};
		counter.displayTime();
	},
	
	addTime: function(station, time, runs) {
		if(station === "none") {
			return;
		}
		if(!counter.stations[station][time]) {
			counter.stations[station][time] = 0;
		}
		counter.stations[station][time] += runs;
		counter.displayTime();
	},
	
	displayTime: function() {
		var totalTime = 0;
		var forges = parseInt(counter.forgesCount.value);
		var processors = parseInt(counter.processorsCount.value);
		var divisor = 1;
		if(counter.coalFlag.checked) {
			divisor = 2;
		}
		if(counter.tarfoodFlag.checked) {
			divisor = 10;
		}
		var forgeRuns = 0;
		for(var station in counter.stations) {
			for(var time in counter.stations[station]) {
				var runs = counter.stations[station][time];
				if(station === "processor") {
					var symRuns = Math.ceil(runs / processors);
					totalTime += symRuns * time;
					continue;
				}
				forgeRuns += runs;
				var symRuns = Math.ceil(runs / forges);
				totalTime += symRuns * (time / divisor);
			}
		}
		counter.timingRecapContainer.innerHTML = "";
		if(totalTime) {
			counter.timingRecapContainer.innerHTML = "Total station time: " + utils.formatTime(totalTime) + 		
														"<br>Forge runs: " + forgeRuns;			
		}
	},
	
	processDelayedSearch: function() {
		clearTimeout(counter.processDelayedSearchTimeout);
		counter.processDelayedSearchTimeout = setTimeout(counter.processSearch, 200);
	},
	
	processSearch: function() {
		counter.searchResult.innerHTML = "";
		var search = counter.searchInput.value.toLowerCase().replace(/^\s+(.+)\s+$/g, "$1");
		if(!search) {
			return;
		}
		for(var id in items) {
			var item = items[id];
			if(item.namesearch.indexOf(search) !== -1) {
				counter.addResult(items[id]);
			}
			if(item.recipes.length > 1) {
				//console.log(id + " " + counter.describeRecipe(counter.getRecipe(id)));
				//console.log(item.recipes);
			}
		}
	},
	
	addResult: function(item) {
		var node = document.createElement("div");
		node.setAttribute("class", "entry rounded shadow");
		var icon = counter.createIcon(item);
		icon.title += " - Click to add to the list";
		node.title = icon.title;
		node.appendChild(icon);
		node.dataset.itemid = item.id;
		counter.searchResult.appendChild(node);
		node.addEventListener("click", counter.addToChosenList);
	},
	
	createIcon: function(item, iconside) {
		var icon = document.createElement("div");
		icon.classList.add("icon");
		icon.classList.add("rounded");
		var sprite = utils.findSpriteByName(item.icon);
		icon.title = item.name + " ["  + item.id + ", " + item.icon + "]";
		if(!sprite) {
			icon.innerHTML = "<small>" + item.name + "</small>";
			return icon;
		}
		if(!iconside) {
			iconside = counter.iconside;
		}
		icon.style.width = iconside + "px";
		icon.style.height = iconside + "px";
		var ratio = iconside / 128;
		var x = sprite.x * ratio;
		var	y = (4096 - sprite.y - sprite.h) * ratio;
		icon.style.backgroundSize = 4096 * ratio + "px auto";
		if(sprite.s === "01") {
			icon.style.backgroundSize = 2048 * ratio + "px auto";
			y = (1024 - sprite.y - sprite.h) * ratio;
		}
		var internal = sprite.i;
		var visible = sprite.v
		icon.style.backgroundImage = 'url(img/icons_' + sprite.s + '.jpg)';
		icon.style.backgroundPosition = '-' + x + 'px -' + y + 'px';
		return icon;
	},
	
	describeRecipe: function(recipe) {
		if(!recipe) {
			return "no recipe";
		}
		var mats = [];
		for(var mat in recipe.materials) {
			mats.push(mat + " X" + recipe.materials[mat]);
		}
		return "X" + recipe.count + ": " + mats.join(", ");
	},
	
	getRecipe: function(id) {
		var item = items[id];
		var len = item.recipes.length; 
		if(!len) {
			return false;
		};
		
		if(len == 1) {
			return item.recipes[0];
		}
		
		var result = false;
		for(var r in item.recipes) {
			var recipe = item.recipes[r]
			if(!result) {
				result = recipe;
				continue;
			}
			if(recipe.count > result.count) {
				result = recipe;
				continue;
			}
			var mats = [];
			for(var mat in recipe.materials) {
				if(counter.matPrecedence.includes(mat)) {
					result = recipe;
					break;
				}
			}
		}
		return result;
	},
	
	addToChosenList: function() {
		var chosen = this;
		var id = chosen.dataset.itemid;
		var item = items[id];
		if(counter.chosenList[id]) {
			alert(item.name + " already added to the list");
			return;
		}
		var node = document.createElement("div");
		node.setAttribute("class", "entry rounded shadow");
		var icon = counter.createIcon(item);
		node.appendChild(icon);
		node.dataset.itemid = item.id;
		counter.chosenListContainer.appendChild(node);
		var deleteButton = document.createElement("button");
		deleteButton.title = "remove from list";
		deleteButton.innerHTML = "X";
		deleteButton.classList.add("delete-button");
		deleteButton.addEventListener("click", function() {
			counter.removeFromChosenList(node, item);
		});
		var needed = document.createElement("input");
		needed.setAttribute("type", "number");
		needed.setAttribute("min", "1");
		needed.value = 1;
		var neededLabel = counter.labelize("Need", needed);
		needed.addEventListener("input", counter.computePreparationDelayed);
		node.appendChild(neededLabel);
		node.appendChild(deleteButton);
		counter.chosenList[id] = node;
		counter.computePreparation();
	},
  
	removeFromChosenList: function(node) {
		delete counter.chosenList[node.dataset.itemid];
		node.parentNode.removeChild(node);
		counter.computePreparation();
	},
	
	computePreparation: function() {
		counter.resetPrepareQuantities();
		counter.pending = [];
		for(var id in counter.chosenList) {
			var node = counter.chosenList[id];
			var input = node.querySelector("input");
			var amount = parseInt(input.value);
			counter.pending.push([id, amount]);
		}
		var cur = null;
		while(cur = counter.pending.pop()) {
			counter.processPending(cur[0], cur[1]);
		}
		counter.displayPreparation();
		//console.log(counter.prepare);
	},
	
	displayPreparation: function() {
		counter.prepareListContainer.innerHTML = "";
		counter.clearTime();
		var ids = utils.sortedKeysByProperty(counter.prepare, "name");
		for(var i in ids) {
			counter.displayPrep(counter.prepare[ids[i]]);
		}
	},
	
	displayPrep: function(prep) {
		if(prep.use == 0) {
			return;
		}
		var obtain = prep.use - prep.possessed;
		if(obtain < 0) {
			obtain = 0;
		}
		var node = document.createElement("div");
		node.setAttribute("class", "entry rounded shadow");
		var item = items[prep.id];
		var icon = counter.createIcon(item);
		var possessed = document.createElement("input");
		possessed.type = "number";
		possessed.min = 0;
		possessed.value = prep.possessed;
		var labelPossessed = counter.labelize("Possessed", possessed);
		node.appendChild(icon);
		node.appendChild(labelPossessed);
		possessed.addEventListener("input", function() {
			prep.possessed = parseInt(possessed.value);
			counter.computePreparationDelayed();
		});
		var total = document.createElement("div");
		total.classList.add("total");
		total.style.textAlign = "right";
		total.innerHTML = "Still to obtain: " + obtain;				
		if(prep.recipe) {
			if(obtain) {
				var expand = document.createElement("button");
				expand.innerHTML = prep.expanded ? "Collapse" : "Expand";
				expand.addEventListener("click", function() {
					prep.expanded = !prep.expanded;
					counter.computePreparation();
				});
				node.appendChild(expand);				
			}
			if(prep.expanded) {
				total.innerHTML = "Still to create: " + obtain + "<br>";
				if(obtain) {
					var runs = Math.ceil(obtain / prep.recipe.count);
					var mult = prep.recipe.count;
					for(var matid in prep.recipe.materials) {
						var matquant = parseInt(prep.recipe.materials[matid]);
						var span = document.createElement("span");
						span.innerHTML = "X" + (matquant * runs) + " ";
						total.appendChild(counter.createIcon(items[matid], 32));
						total.appendChild(span);
					}
					total.innerHTML += " &rArr; ";
					var span = document.createElement("span");
					span.innerHTML = "X" + (runs * mult);
					total.appendChild(counter.createIcon(item, 32));
					total.appendChild(span);
					counter.addTime(prep.recipe.station, prep.recipe.time, runs);
				}
			}
		}
		node.appendChild(total);
		counter.prepareListContainer.appendChild(node);
	},
	
	finalComputeDelayed: function() {
		clearTimeout(counter.finalComputeDelayed.timeout);
		counter.finalComputeDelayed.timeout = setTimeout(counter.finalCompute, counter.delay);
	},
	
	finalCompute: function() {
		
	},
	
	labelize: function(labelText, content) {
		var label = document.createElement("label");
		label.innerHTML = labelText;
		label.appendChild(content);
		return label;
	},
	
	computePreparationDelayed: function() {
		clearTimeout(counter.computePreparationDelayed.timeout);
		counter.computePreparationDelayed.timeout = setTimeout(counter.computePreparation, counter.delay);
	},
	
	resetPrepareQuantities: function() {
		for(var id in counter.prepare) {
			counter.prepare[id].obtain = 0;
			counter.prepare[id].use = 0;
		}
	},
  
	processPending: function(id, amount) {
		var item = items[id];
		var recipe = counter.getRecipe(id);
		if(!counter.prepare[id]) {
			counter.prepare[id] = {
				id: id,
				obtain: 0,
				name: item.name,
				use: 0,
				possessed: 0,
				expanded: false,
				recipe: recipe,
			};
		}
		var prep = counter.prepare[id];
		var avail = prep.obtain - prep.use + prep.possessed;
		var needed = amount - avail;
		prep.use += amount;
		if(needed <= 0) {
			return;
		}
		if(!recipe) {
			prep.obtain += needed;
			return;
		}
		var count = parseInt(recipe.count);
		var runs = Math.ceil(needed / count);
		if(!prep.expanded) {
			prep.obtain += needed;
			return;
		}
		prep.obtain += runs * count;
		for(var mat in recipe.materials) {
			counter.pending.push([mat, parseInt(recipe.materials[mat]) * runs]);
		}
	},
	  
	attachInfo: function() {
		document.querySelector("#info-button").addEventListener("click", function() {
			document.querySelector("#info-cover").style.display = "block";
			document.querySelector("#info-content").style.display = "block";
		});
		document.querySelector("#info-cover").addEventListener("click", function() {
			document.querySelector("#info-cover").style.display = "none";
			document.querySelector("#info-content").style.display = "none";
		});
	},
};

window.addEventListener("load", counter.init);