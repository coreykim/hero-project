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
	Game.page.playerpanel = 
		"<div id='player-panel'>" + 
		"<img id='player-portrait' src='images/400x600/empty.png'>" + 
		"<div id='player-info'></div>" +
		"<div id='player-output'></div></div>"
	Game.page.centerpanel = "<div id='center-panel'><div id='field'>";
	for (var i = 3; i > -1; i--){
		Game.page.centerpanel += "<div>";
		for (j = 0; j < 3; j++){
			id = i.toString() + j.toString();
			Game.page.centerpanel +=
				"<div id='icon-container" + id + "'>" +
				"<img id='icon" + id + "' src='images/100x100/empty.png'>" +
				//"onclick='Game.clickField(" + i + ", " + j + ")'>" +
				"<div id='hp" + id + "'></div></div>"
		}
		Game.page.centerpanel += "</div>";
		if (i==2){
			Game.page.centerpanel += "<div style='height:20px'></div>"
		}
	};
	Game.page.centerpanel += "</div><div id='action'></div></div>";
	Game.page.enemypanel =
		"<div id='enemy-panel'>" + 
		"<img id='enemy-portrait' src='images/400x600/empty.png'>" + 
		"<div id='enemy-info'></div>" +
		"<div id='enemy-output'></div></div>"
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
		this.use = function(skill) {
			return skill.use(this);
		}
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
			var target = Game.field[i][j]
			var nowi = this.i;
			var nowj = this.j;
			Game.field[i][j] = this;
			Game.field[nowi][nowj] = target;
			this.i = i;
			this.j = j;
			target.i = nowi;
			target.j = nowj;
		}
		this.isValidTarget = function() {
			if (this.image_id == "empty.png") {
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
		this.target = "auto";
		//"adjacent"
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
			return(dam + " damage");
		};
		this.use = function(user){
			var target = user.getTarget();
			var output = ["", ""];
			output[0] = user.name + " uses " + this.name;
			if (this.hitRoll(user, target)){
				output[1] = this.damRoll(user, target);
			} else {
				output[1] = "Evaded!";
			}
			if (this.splash){}
			return output;
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
		name: "Move",
		id: "move",
		target: "adjacent",
		use: function(user){
			var i = Game.Target.Queue[0].i;
			var j = Game.Target.Queue[0].j;
			user.changePosition(i,j);
			return ["", ""]
		}
	});
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
	Game.ActingUnit = new Game.Unit();
	Game.Target = {};
	Game.Target.Reset = function(){
		Game.Target.Mode = false;
		Game.Target.Queue = [];
		Game.Target.Skill = {};
	}
	Game.Target.Reset();
	Game.field = [
		[{}, {}, {}],
		[{}, {}, {}],
		[{}, {}, {}],
		[{}, {}, {}]
	];
	var spawn = function(unit, i, j) {
		Game.field[i][j] = unit;
		unit.enterField(i, j);
	}
	for (var i=0; i<4; i++){
		for (var j=0; j<3; j++){
			spawn(new Game.Unit, i, j);
		}
	}
	var displayPortrait = function(unit) {
		var image_id = "images/400x600/" + unit.image_id;
		var text = "<div>HP: " + unit.HP + "/" + unit.max_HP +
			"</div><div>Special: " + unit.Special + "</div>";
		if (unit.i<2){
			el("player-portrait").src = image_id;
			el("player-info").innerHTML = text;
			displayAction(unit);
		} else {
			el("enemy-portrait").src = image_id
			el("enemy-info").innerHTML = text;
		}
	}
	var displayAction = function(unit){
		if (unit.i<2 && turn){
			Game.ActingUnit = unit;
			el("action").innerHTML = "";
			var buttons = unit.returnCurrentSkills();
			for (var i = 0; i<3; i++){
				if (buttons[i]==""){
					el("action").innerHTML += "<div class='btn'> - </div>"
				} else {
					var name = Game.Skill[buttons[i]].name;
					var id = Game.Skill[buttons[i]].id;
					el("action").innerHTML += "<div class='btn' id='act-" + id +
						"'>" + name + "</div>"
				}
			}
			el("action").innerHTML += "<div class='btn' id='act-move'>Move</div>"
		}
	}
	Game.clickField = function(e) {
		if (e.target.parentNode.id.slice(0,-2)!="icon-container")return
		var i = parseInt(e.target.parentNode.id.slice(-2, -1));
		var j = parseInt(e.target.parentNode.id.slice(-1));
		var unit = Game.field[i][j];
		if (Game.Target.Mode=="adjacent"){
			var ai = Game.ActingUnit.i;
			var aj = Game.ActingUnit.j;
			var adji = Math.abs(i-ai)==1 && j==aj;
			var adjj = Math.abs(j-aj)==1;
			var adjacent = adji || adjj;
			var sameside = (i<2 && ai<2)||(i>1 && ai>1);
			if (adjacent && sameside){
				Game.Target.Queue.push(unit);
				Game.executeSkill(Game.ActingUnit, Game.Target.Skill);
			} else {Game.Target.Reset()}
		} else {
			if (!unit.isValidTarget()){return};
			el("player-output").innerHTML = "";
			el("enemy-output").innerHTML = "";
			displayPortrait(unit);
			displayPortrait(unit.getTarget());
		}
	}
	el("field").addEventListener("click", Game.clickField);
	Game.clickSkill = function(e) {
		var unit = Game.ActingUnit;
		var skill = Game.Skill[e.target.id.slice(4)];
		if (skill.target=="auto"){
			Game.executeSkill(unit, skill);
		} else {
			Game.Target.Mode = skill.target;
			Game.Target.Skill = skill;
		}
	}
	Game.executeSkill = function(unit, skill) {
		var data = unit.use(skill)
		if (unit.i<2) {
			var output = [el("player-output"), el("enemy-output")];
		} else {
			var output = [el("enemy-output"), el("player-output")];
		}
		output[0].innerHTML = "<br>" + data[0];
		output[1].innerHTML = "<br>" + data[1];
		displayPortrait(unit.getTarget());
		Game.Target.Reset();
		el("action").innerHTML = "";
		el("player-panel").innerHTML =
			"<img id='player-portrait' src='images/400x600/empty.png'>" + 
			"<div id='player-info'></div>" +
			"<div id='player-output'></div>"
		el("enemy-panel").innerHTML =
			"<img id='enemy-portrait' src='images/400x600/empty.png'>" + 
			"<div id='enemy-info'></div>" +
			"<div id='enemy-output'></div>"
		drawField();
	}
	el("action").addEventListener("click", Game.clickSkill);
	var drawField = function() {
		var max_width = 100;
		for (var i = 0; i < 4; i++){
			for (var j = 0; j < 3; j++){
				unit = Game.field[i][j];
				el("icon"+i+j).src = "images/100x100/" + unit.image_id;
				if (unit.isValidTarget()){
					el("hp"+i+j).style = "width:" +
						Math.min(unit.HP/unit.max_HP*max_width,
							max_width).toFixed() + "px";
				} else {
					el("hp"+i+j).style = "width: 0"
				}
			}
		}
	}
	spawn(new Game.Sena(), 1, 1);
	spawn(new Game.Renaud(), 1, 0);
	spawn(new Game.Rose(), 2, 1);
	spawn(new Game.Lena(), 3, 1);
	drawField();
}