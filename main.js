/*=====================================================================================
GLOBAL HELPER FUNCTIONS
=======================================================================================*/

function el(what) {return document.getElementById(what);}
function shuffle(array)
{
	var counter = array.length, temp, index;
	// While there are elements in the array
	while (counter--)
	{
		// Pick a random index
		index = (Math.random() * counter) | 0;

		// And swap the last element with it
		temp = array[counter];
		array[counter] = array[index];
		array[index] = temp;
	}
	return array;
}

/*=====================================================================================
GAME INITIALIZATION
=======================================================================================*/
var Game={};

Game.Launch=function(){
	Game.version = 0.001;
	Game.page={};
	Game.page.centerpanel = "<div class='center-panel'>";
	Game.page.playerpanel = 
		"<div class='side-panel'>" + 
		"<img id='playerportrait' src='images/400x600/empty.png'>" + 
		"<div id='playerpaneltext'></div></div>"
	Game.page.enemypanel =
		"<div class='side-panel'>" + 
		"<img id='enemyportrait' src='images/400x600/empty.png'>" + 
		"<div id='enemypaneltext'></div></div>"
	for (var i = 3; i > -1; i--){
		Game.page.centerpanel += "<div>";
		for (j = 0; j < 3; j++){
			id = i.toString() + j.toString();
			Game.page.centerpanel +=
				"<div id='icon-container" + id + "'>" +
				"<img id='icon" + id + "' src='images/100x100/empty.png'" +
				"onclick='Game.clickField(" + i + ", " + j + ")'>" +
				"<div id='hp" + id + "'></div></div>"
		}
		Game.page.centerpanel += "</div>";
		if (i==2){
			Game.page.centerpanel += "<div style='height:20px'></div>"
		}
	};
	Game.page.centerpanel += "</div>";
	el("wrapper").innerHTML =
		Game.page.playerpanel + "\r" + 
		Game.page.centerpanel + "\r" +
		Game.page.enemypanel;
	Game.Unit=function(){
		this.name = "Empty";
		this.image_id = "empty.png";
		this.max_HP = 1;
		this.HP = 0;
		this.Attack = 1;
		this.Defense = 1;
		this.Armor = 0;
		this.Hit = 0;
		this.Evade = 0;
		this.Cooldown = 0;
		this.Skill = {
			main: [
				["", "", "", ""],
				["", "", "", ""],
				["", "", "", ""],
				["", "", "", ""]
			],
			support: [
				["", "", "", ""],
				["", "", "", ""],
				["", "", "", ""],
				["", "", "", ""]
			],
			passive: [],
			unused: []
		};
		this.PreparedSkill = "";
		this.KO = false;
		this.stage = 0;
		this.enterField = function(i, j) {
			this.HP = this.max_HP;
			this.Special = this.Cooldown;
			this.i = i;
			this.j = j;
		}
		this.setSkill = function(id) {
			skill = Game.Skill[id];
			if (skill.passive){
				this.Skill.passive.push();
			} else if (skill.support){
				this.Skill.support[skill.stage][skill.type] = id;
			} else {
				this.Skill.main[skill.stage][skill.type] = id;
			}
		}
		this.returnCurrentSkills = function() {
			var range = "main";
			var result = [];
			if (this.i==0 || this.i==3){range = "support"}
			result = this.Skill[range][this.stage]
			for (var i = 0; i < result.length; i++) {
				if (result[i]=="" && this.stage==3){
					result[i] = this.Skill[range][1][i];
				} else if (result[i]=="" && this.stage==2){
					result[i] = this.Skill[range][0][i]
				} else if (result[i]=="" && this.stage==1){
					result[i] = this.Skill[range][0][i]
				}
			}
			return result;
		}
		this.changePosition = function(i, j) {
			swap = Game.field[i][j]
			Game.field[i][j] = this;
			Game.field[this.i][this.j] = swap;
			this.i = i;
			this.j = j;
		}
		this.isValidTarget = function() {
			if (this.name == "Empty" || this.KO) {
				return false;
			} else {
				return true;
			}
		}
		this.getTarget = function() {
			if (this.i < 2) {
				var ti = 2;
				if (this.j == 0) {
					var tj = [0, 1, 2];
				} else if (this.j == 1) {
					var tj = [1, 0, 2];
				} else if (this.j == 2) {
					var tj = [2, 1, 0];
				}
			} else {
				var ti = 1;
				if (this.j == 0) {
					var tj = [0, 1, 2];
				} else if (this.j == 1) {
					var tj = [1, 2, 0];
				} else if (this.j == 2) {
					var tj = [2, 1, 0];
				}
			}
			for (var i = 0; i < tj.length; i++) {
				if (Game.field[ti][tj[i]].isValidTarget()) {
					return Game.field[ti][tj[i]];
				}
			}
		}
		this.getPartner = function(){
			if (this.i==0){return Game.field[1][this.j]}
			else if (this.i==1){return Game.field[0][this.j]}
			else if (this.i==2){return Game.field[3][this.j]}
			else if (this.i==3){return Game.field[2][this.j]}
		}
	}
	Game.Skill={};
	Game.Skill.Template=function() {
		this.name = "Template";
		this.id = "template";
		this.passive = false;
		this.type = 0;
		//0 - Basic
		//1 - Light
		//2 - Heavy
		//3 - Defense
		this.stage = 0;
		//0 - Normal
		//1 - Alt
		//2 - Special
		//3 - AltSpecial
		this.support = false;
		this.basepower = 0;
		this.basehit = 0;
		this.hitcount = 1;
		this.splash = false;
		this.hitRoll = function(user, target){
			var hit = (user.Hit + this.basehit - target.Evade)/5
			hit = Math.min(Math.max(0, Math.floor(hit)*0.25+1),1);
			if (Math.random() < hit){
				return true
			} else {
				console.log(hit);
				return false
			}
		};
		this.damRoll = function(user, target){
			var dam = (user.Attack/target.Defense*this.basepower - target.Armor)/10;
			dam = dam * this.hitcount;
			dam = Math.max(0, Math.ceil(dam));
			target.HP -= dam;
			console.log("Hit for " + dam + " damage!");
		};
		this.use = function(user){
			var target = user.getTarget();
			if (this.hitRoll(user, target)){this.damRoll(user, target)}
			if (this.splash){}
		};
	}
	Game.Skill.Create=function(properties) {
		var skill = new Game.Skill.Template();
		for (var k in properties) {
			if (properties.hasOwnProperty(k)){
				skill[k]=properties[k]
			}
		}
		if (skill.id=="template"){
			console.log("Error: Skill id not defined");
			return
		} else {
			Game.Skill[skill.id] = skill;
		}
	}
	Game.Effect={};
	Game.Effect.Template=function() {
		this.name = "Template";
		this.id = "template";
		this.buff = true;
	}
	Game.Effect.Create=function(properties) {
		var effect = new Game.Effect.Template();
		for (var k in properties) {
			if (properties.hasOwnProperty(k)){
				effect[k]=properties[k]
			}
		}
		if (effect.id=="template"){
			console.log("Error: Effect id not defined");
			return
		} else {
			Game.Effect[effect.id] = effect;
		}
	}
	Game.Skill.Create({
		name: "Stab",
		id: "knifebasic",
		basepower: 25
	});
	Game.Skill.Create({
		name: "Slash",
		id: "swordbasic",
		basepower: 30
	});
	Game.Skill.Create({
		name: "Bolt",
		id: "staffbasic",
		support: true,
		basepower: 30
	});
	Game.Skill.Create({
		name: "Punch",
		id: "glovebasic",
		basepower: 25
	});
	Game.Skill.Create({
		name: "Double Cut",
		id: "doublecut",
		stage: 1,
		basepower: 25
	});
	Game.Skill.Create({
		name: "Light Slash",
		id: "lightslash",
		type: 1,
		basepower: 35
	});
	Game.Skill.Create({
		name: "Heavy Slash",
		id: "heavyslash",
		type: 2,
		basepower: 80
	});
	Game.Sena=function() {
		Game.Unit.call(this);
		this.name = "Sena";
		this.image_id = "sena.jpg";
		this.max_HP = 90;
		this.Attack = 120;
		this.Defense = 70;
		this.Armor = 0;
		this.Hit = 6;
		this.Evade = 8;
		this.Cooldown = 9;
		this.setSkill("swordbasic");
		this.setSkill("lightslash");
		this.setSkill("heavyslash");
	}
	Game.Renaud=function() {
		Game.Unit.call(this);
		this.name = "Renaud";
		this.image_id = "renaud.jpg";
		this.max_HP = 70;
		this.Attack = 110;
		this.Defense = 50;
		this.Armor = 0;
		this.Hit = 8;
		this.Evade = 10;
		this.Cooldown = 6;
		this.setSkill("knifebasic");
	}
	Game.Lena=function() {
		Game.Unit.call(this);
		this.name = "Lena";
		this.image_id = "lena.jpg";
		this.max_HP = 70;
		this.Attack = 130;
		this.Defense = 40;
		this.Armor = 0;
		this.Hit = 4;
		this.Evade = 3;
		this.Cooldown = 8;
	}
	Game.Rose=function() {
		Game.Unit.call(this);
		this.name = "Rose";
		this.image_id = "rose.jpg";
		this.max_HP = 100;
		this.Attack = 80;
		this.Defense = 100;
		this.Armor = 10;
		this.Hit = 2;
		this.Evade = 0;
		this.Cooldown = 9;
	}
	Game.Battle();
}
/*=====================================================================================
BATTLE
=======================================================================================*/
Game.Battle = function(){
	var turn = true;
	Game.field = [
		[new Game.Unit(), new Game.Unit(), new Game.Unit()],
		[new Game.Unit(), new Game.Unit(), new Game.Unit()],
		[new Game.Unit(), new Game.Unit(), new Game.Unit()],
		[new Game.Unit(), new Game.Unit(), new Game.Unit()]
	];
	var spawn = function(unit, i, j) {
		Game.field[i][j] = unit;
		unit.enterField(i, j);
	}
	var displayPortrait = function(unit) {
		var image_id = "images/400x600/" + unit.image_id;
		var text = "<div>HP: " + unit.HP + "/" + unit.max_HP +
			"</div><div>Special: " + unit.Special + "</div>";
		if (unit.i<2){
			if (turn){
				var buttons = unit.returnCurrentSkills();
				for (var i = 0; i<3; i++){
					if (buttons[i]==""){
						text += "<div class='btn'> - </div>"
					} else {
						var name = Game.Skill[buttons[i]].name;
						var id = "&quot;" + Game.Skill[buttons[i]].id + "&quot;";
						text += "<div class='btn' onclick='Game.clickSkill(" + 
							unit.i + ", " + unit.j + ", " + id + ")'>" +
							name + "</div>"
					}
				}
				text += "<div class='btn'>Move</div>"
			}
			el("playerportrait").src = image_id;
			el("playerpaneltext").innerHTML = text;
		} else {
			el("enemyportrait").src = image_id
			el("enemypaneltext").innerHTML = text;
		}
	}
	Game.clickField = function(i, j) {
		var unit = Game.field[i][j];
		if (unit.name=="Empty"){return};
		displayPortrait(unit);
		displayPortrait(unit.getTarget());
	}
	Game.clickSkill = function(i, j, skillname) {
		var unit = Game.field[i][j];
		console.log(unit.name + " uses " + Game.Skill[skillname].name + ".")
		Game.Skill[skillname].use(unit)
	}
	var draw = function() {
		var max_width = 100;
		for (var i = 0; i < 4; i++){
			for (var j = 0; j < 3; j++){
				el("icon"+i+j).src = 
					"images/100x100/" + Game.field[i][j].image_id;
				el("hp"+i+j).style =
					"width:" +
					Math.min(
						Game.field[i][j].HP/Game.field[i][j].max_HP*max_width,
						max_width).toFixed() + "px";
			}
		}
	}
	spawn(new Game.Sena(), 1, 1);
	spawn(new Game.Renaud(), 1, 0);
	spawn(new Game.Rose(), 2, 1);
	spawn(new Game.Lena(), 3, 1);
	draw();
}