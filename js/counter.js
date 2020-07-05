
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
	
	el: function(tag, html) {
		var res = document.createElement(tag);
		res.innerHTML = html || "";
		return res;
	},
};

var counter = {
	iconside: 64,
	
	matPrecedence: [
		"water_item",
		"stone_item",
		"wood_oak_item",
		"leaves_oak_item",
		"stairs_medieval",
		"stairs_haunted",
		"chizzard_gizzard",
	],
	
	prepare: {},
	
	delay: 500,
	
	init: function() {
		counter.tieWorking();
		counter.attachInfo();
		counter.attachSearch();
		counter.prepareSorting();
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
			Furnace: {},
			Processor: {},
			Culinary: {},
		};
		counter.displayTime();
	},
	
	addTime: function(station, time, runs) {
		if(["Backpack", "Culinary"].indexOf(station) >= 0) {
			return;
		}
		if(!time) {
			time = 1;
		}
		if(!counter.stations[station][time]) {
			counter.stations[station][time] = 0;
		}
		counter.stations[station][time] += runs;
		counter.displayTime();
	},
	
	displayTime: function() {
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
		var forgeTime = 0;
		var processorTime = 0;
		for(var station in counter.stations) {
			for(var time in counter.stations[station]) {
				var runs = counter.stations[station][time];
				if(station === "processor") {
					var symRuns = Math.ceil(runs / processors);
					processorTime += symRuns * time;
					continue;
				}
				forgeRuns += runs;
				var symRuns = Math.ceil(runs / forges);
				forgeTime += symRuns * (time / divisor);
			}
		}
		var totalTime = processorTime + forgeTime;
		var output = "";
		output += totalTime ? "Total time: " + utils.formatTime(totalTime) + "<br>" : "";
		output += processorTime ? "Processor time: " + utils.formatTime(processorTime) + "<br>" : "";
		output += forgeTime ? "Forge time: " + utils.formatTime(forgeTime) + "<br>" : "";
		output += forgeRuns ? "Forge runs: " + forgeRuns : "";
		counter.timingRecapContainer.innerHTML = output;
	},
	
	processDelayedSearch: function() {
		clearTimeout(counter.processDelayedSearchTimeout);
		counter.processDelayedSearchTimeout = setTimeout(counter.processSearch, 200);
	},
	
	prepareSorting: function() {
		var values = Object.values(crafts);
		values.sort(function(a, b) {
			if(a.name < b.name) {
				return -1;
			}
			if(a.name > b.name) {
				return 1;
			}
			return 0;
		});
		counter.sorted = [];
		for(var i = 0; i < values.length; ++i) {
			counter.sorted.push(values[i].id);
		}
	},
	
	processSearch: function() {
		counter.searchResult.innerHTML = "";
		var search = counter.searchInput.value.toLowerCase().replace(/^\s+(.+)\s+$/g, "$1");
		var notice = document.querySelector("#search-notice");
		var added = 0;
		for(var i = 0; i < counter.sorted.length; ++i) {
			var craft = crafts[counter.sorted[i]];
			if(search.length > 1 && craft.namesearch.indexOf(search) !== -1) {
				counter.addResult(craft);
				++added;
			}
		}
		if(!added) {
			notice.innerHTML = "No matches found or no search query";
			for(var i = 0; i < counter.sorted.length; ++i) {
				var craft = crafts[counter.sorted[i]];
				counter.addResult(craft);
				++added;
			}
		} else {
			notice.innerHTML = "Search matches found";
		}
		notice.innerHTML += " - shown items: " + added;
	},
	
	addResult: function(craft) {
		var node = document.createElement("div");
		node.setAttribute("class", "entry rounded shadow");
		var icon = counter.createIcon(craft, null, "Click to add to the list");
		icon.style.cursor = "copy";
		node.title = icon.title;
		node.appendChild(icon);
		node.dataset.itemid = craft.id;
		counter.searchResult.appendChild(node);
		node.addEventListener("click", counter.addToChosenList);
	},
	
	createIcon: function(craft, iconside, postfix) {
		var icon = document.createElement("div");
		icon.classList.add("icon");
		icon.classList.add("rounded");
		var sprite = utils.findSpriteByName(craft.icon);
		if(postfix == null) {
			postfix = "\n\nClick to see full recipe and usages";
		} else if(postfix != "") {
			postfix = "\n\n" + postfix;
		}
		icon.title = craft.name + "\n\nIcon name: " + craft.icon + "\nInternal: " + craft.id + postfix;
		if(!sprite) {
			icon.innerHTML = "<small>" + craft.name + "</small>";
			return icon;
		}
		if(!iconside) {
			iconside = counter.iconside;
		}
		icon.style.width = iconside + "px";
		icon.style.height = iconside + "px";
		var ratio = iconside / 128;
		var x = sprite.x * ratio;
		var	y = sprite.y * ratio;
		icon.style.backgroundSize = 4096 * ratio + "px auto";
		var internal = sprite.i;
		var visible = sprite.v
		icon.style.backgroundImage = 'url(img/icons_' + sprite.s + '.jpg)';
		icon.style.backgroundPosition = '-' + x + 'px -' + y + 'px';
		return icon;
	},
	
	getRecipe: function(id) {
		var craft = crafts[id];
		var len = craft.recipes.length; 
		if(!len) {
			return false;
		};
		
		if(len == 1) {
			return craft.recipes[0];
		}
		
		var result = false;
		for(var r in craft.recipes) {
			var recipe = craft.recipes[r]
			if(!result) {
				result = recipe;
				continue;
			}
			if(recipe.count > result.count) {
				result = recipe;
				continue;
			}
			for(var i in recipe.materials) {
				var mat = recipe.materials[i];
				for(var j in mat.valid_items) {
					if(counter.matPrecedence.includes(mat.valid_items[j])) {
						result = recipe;
						break;
					}
				}
			}
		}
		return result;
	},
	
	addToChosenList: function() {
		var chosen = this;
		var id = chosen.dataset.itemid;
		var craft = crafts[id];
		if(counter.chosenList[id]) {
			alert(craft.name + " already added to the list");
			return;
		}
		var node = document.createElement("div");
		node.setAttribute("class", "entry rounded shadow");
		var icon = counter.createIcon(craft);
		node.appendChild(icon);
		node.dataset.itemid = craft.id;
		counter.chosenListContainer.appendChild(node);
		var deleteButton = document.createElement("button");
		deleteButton.title = "remove from list";
		deleteButton.innerHTML = "X";
		deleteButton.classList.add("delete-button");
		deleteButton.addEventListener("click", function() {
			counter.removeFromChosenList(node, craft);
		});
		var needed = document.createElement("input");
		needed.setAttribute("type", "number");
		needed.setAttribute("min", "1");
		needed.value = 1;
		var neededLabel = counter.labelize(craft.name + "<br>Need", needed);
		needed.addEventListener("input", counter.computePreparationDelayed);
		node.appendChild(neededLabel);
		node.appendChild(deleteButton);
		counter.chosenList[id] = node;
		counter.computePreparation();
		counter.attachIconInfo(icon, craft);
	},
	
	attachIconInfo: function(icon, craft) {
		icon.style.cursor = "help"
		icon.addEventListener("click", function() {
			counter.displayDetails(craft);
		});
	},
	
	createRecipeBox: function(recipe, craft) {
		var container = document.createElement("div");
		container.classList.add("recipe-box");
		
		var result = utils.el("div", "<strong>Result: </strong>");
		
		var icon = counter.createIcon(craft, counter.iconside / 2, "");
		result.appendChild(icon);
		
		result.appendChild(document.createTextNode(" " + craft.name + " X " + recipe.count));
		container.appendChild(result);
		
		var station = utils.el("div",
			"<strong>Where: </strong>" 
			+ recipe.station 
			+ (recipe.recipe_category ? " (" + recipe.recipe_category + ")" : "")
			+ (["Backpack", "Culinary"].indexOf(recipe.station) < 0 ? " (" + recipe.time + "s)" : "")
		);
		container.appendChild(station);
		container.appendChild(utils.el("div", "<strong>Ingredients: </strong>"));
		
		for(var m = 0; m < recipe.materials.length; ++m) {
			var mat_cont = utils.el("div");
			mat_cont.classList.add("boxed");
			var mat = recipe.materials[m];
			var suffix = " ";
			if(mat.valid_items.length > 1) {
				suffix = "any of ";
			}
			mat_cont.appendChild(document.createTextNode(mat.count + " X " + suffix));
			for(var v = 0; v < mat.valid_items.length; ++v) {
				var id = mat.valid_items[v];
				var c = crafts[id]
				var icon = counter.createIcon(c, counter.iconside / 2);
				counter.attachIconInfo(icon, c);
				mat_cont.appendChild(icon);
				var trail = "";
				if(v < mat.valid_items.length - 1) {
					trail = ", "
				}
				mat_cont.appendChild(document.createTextNode(" " + c.name + trail));
			}
			container.appendChild(mat_cont);
		}
		
		return container;	
	},
	
	displayDetails: function(craft) {
		var cover = document.querySelector("#info-cover");
		var container = document.querySelector("#details-content");
		container.innerHTML = "";
		
		var icon = counter.createIcon(craft);
		
		var title = document.createElement("h2");
		title.innerText = craft.name;
		
		container.appendChild(counter.createIcon(craft, null, ""));
		
		container.appendChild(title);
		
		if(!craft.recipes || !craft.recipes.length) {
			var s = document.createElement("strong");
			s.innerHTML = "<hr>This item has no recipes.";
			container.appendChild(s);
		} else {
			var s = document.createElement("strong");
			s.innerHTML = "<hr>Recipes:";
			container.appendChild(s);
			for(var i = 0; i < craft.recipes.length; ++i) {
				var table = counter.createRecipeBox(craft.recipes[i], craft);
				container.append(table);
			}
		}
		
		if(!craft.creates || !craft.creates.length) {
			var s = document.createElement("strong");
			s.innerHTML = "<hr>This item is not used to create any other item.";
			container.appendChild(s);
		} else {
			var s = document.createElement("strong");
			s.innerHTML = "<hr>Used to create the following items:";
			container.appendChild(s);
			for(var i = 0; i < craft.creates.length; ++i) {
				var c = crafts[craft.creates[i]];
				var icon = counter.createIcon(c, counter.iconside / 2);
				counter.attachIconInfo(icon, c)
				var text = document.createElement("div");
				text.appendChild(icon);
				text.appendChild(document.createTextNode(" " + c.name))
				container.appendChild(text);
			}
		}
	
		container.style.display = "block";
		cover.style.display = "block";
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
	},
	
	displayPreparation: function() {
		counter.prepareListContainer.innerHTML = "";
		counter.clearTime();		
		var ids = utils.keys(counter.prepare);
		ids.sort(function(a, b) {
			var itemA = counter.prepare[a];
			var itemB = counter.prepare[b];
			var expandedA = itemA.expanded;
			var expandedB = itemB.expanded;
			if(expandedA < expandedB) {
				return -1;
			}
			if(expandedA > expandedB) {
				return 1;
			}
			var textA = itemA.name.toUpperCase();
			var textB = itemB.name.toUpperCase();
			return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
		});
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
		node.setAttribute("class", "entry rounded shadow collapsed");
		var craft = crafts[prep.id];
		var icon = counter.createIcon(craft);
		counter.attachIconInfo(icon, craft);
		var possessed = document.createElement("input");
		possessed.type = "number";
		possessed.min = 0;
		possessed.value = prep.possessed;
		var labelPossessed = counter.labelize(craft.name + "<br>Possessed", possessed);
		node.appendChild(icon);
		node.appendChild(labelPossessed);
		possessed.addEventListener("input", function() {
			prep.possessed = parseInt(possessed.value);
			counter.computePreparationDelayed();
		});
		var total = document.createElement("div");
		total.classList.add("total");
		total.style.textAlign = "right";
		total.innerHTML = "Obtain: " + obtain;				
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
				node.classList.remove("collapsed");
				node.classList.add("expanded");
				switch(true) {
					case prep.recipe.station == "Processor":
						verb = "Process";
						break;
					case prep.recipe.station == "Furnace":
						verb = "Forge";
						break;
					case prep.recipe.station == "Culinary":
						verb = "Cook (" + prep.recipe.recipe_category + ")";
						break;
					default:
						verb = "Craft";
				}
				total.innerHTML = verb + ": " + obtain + "<br>";
				if(obtain) {
					var runs = Math.ceil(obtain / prep.recipe.count);
					var mult = prep.recipe.count;
					for(var i in prep.recipe.materials) {
						var mat = prep.recipe.materials[i]
						var matid = mat.valid_items[0];
						var matquant = parseInt(mat.count);
						var span = document.createElement("span");
						span.innerHTML = "X" + (matquant * runs) + " ";
						var icon = counter.createIcon(crafts[matid], counter.iconside / 2);
						counter.attachIconInfo(icon, crafts[matid]);
						total.appendChild(icon);
						total.appendChild(span);
					}
					total.innerHTML += " &rArr; ";
					var span = document.createElement("span");
					span.innerHTML = "X" + (runs * mult);
					var icon = counter.createIcon(craft, counter.iconside / 2);
					counter.attachIconInfo(icon, craft);
					total.appendChild(icon);
					total.appendChild(span);
					counter.addTime(prep.recipe.station, prep.recipe.time, runs);
				}
			}
		}
		node.appendChild(total);
		counter.prepareListContainer.appendChild(node);
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
		var craft = crafts[id];
		var recipe = counter.getRecipe(id);
		if(!counter.prepare[id]) {
			counter.prepare[id] = {
				id: id,
				obtain: 0,
				name: craft.name,
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
		for(var i in recipe.materials) {
			var mat = recipe.materials[i];
			var valid = mat.valid_items[0];
			var count = parseInt(mat.count);
			counter.pending.push([valid, count * runs]);
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
			document.querySelector("#details-content").style.display = "none";
		});
	},
};

window.addEventListener("load", counter.init);
