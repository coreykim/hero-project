function Unit(){
	this.name = "Empty";
	this.image_id = "empty.png";
	this.max_HP = 1;
	this.max_DP = 1;
	this.HP = 0;
	this.DP = 0;
	this.Attack = 1;
	this.Defense = 1;
	this.Armor = 0;
	this.Hit = 0;
	this.Evade = 0;
	this.Cooldown = 0;
	// everything after this is obsolete
	this.Dam = 0;
	this.Speed = 0;
	this.Action = 0;
	this.CounterHitMod = 1;
	this.Resistance = 1;
	this.findTarget = function() {
		if (this.i < 2) {
			ti = 2;
			if (this.j == 0) {
				tj = [0, 1, 2];
			} else if (this.j == 1) {
				tj = [1, 0, 2];
			} else if (this.j == 2) {
				tj = [2, 1, 0];
			}
		} else {
			ti = 1;
			if (this.j == 0) {
				tj = [0, 1, 2];
			} else if (this.j == 1) {
				tj = [1, 2, 0];
			} else if (this.j == 2) {
				tj = [2, 1, 0];
			}
		}
		for (i = 0; i < tj.length; i++) {
			if (field[ti][tj[i]].isValidTarget()) {
				this.target = field[ti][tj[i]];
				break;
			}
		}
	}
	this.takeTurn = function() {
		this.redBorder();
		this.displayPortrait();
		if (this.DP == 0) {
			this.DP = this.max_DP;
			this.CounterHitMod = 1.5;
			console.log(this.name + " regains balance.");
		} else {
			this.attackTarget();
		}
	}
	this.attackTarget = function() {
		this.findTarget();
		this.target.blueBorder();
		this.target.displayPortrait();
		roll = Math.random() + 0.5;
		AttackHit = (roll*this.Hit).toFixed();
		this.CounterHitMod = 2 - roll;
		this.target.DP -= AttackHit;
		console.log(
			this.name + "(" + this.i + ", " + this.j + ") attacks " +
			this.target.name + "(" + this.target.i + ", " + this.target.j + 
			") for " + AttackHit + " DP."
		);
		if (this.target.DP > 0) {
			this.target.counterattack(this);
		} else {
			this.target.DP = 0;
			this.target.takeDamage(this.Dam);
		}
	}
	this.takeDamage = function(incomingDamage) {
		damage = (incomingDamage/this.Resistance).toFixed();
		this.HP -= damage;
		console.log(damage + " damage!");
		if (this.HP <= 0) {
			this.die();
		}
	}
	this.counterattack = function(attacker) {
		CounterHit = (this.CounterHitMod * this.Hit * 0.75).toFixed();
		attacker.DP -= CounterHit;
		console.log(this.name + " counterattacks for " + CounterHit + " DP.");
		if (attacker.DP < 0) {
			attacker.DP = 0;
			attacker.takeDamage(this.Dam);
		}
	}
	this.isValidTarget = function() {
		if (this.name == "Empty" || this.HP <= 0) {
			return false;
		} else {
			return true;
		}
	}
	this.displayPortrait = function() {
		if (this.i < 2) {
			displayedEnemy = this;
		} else {
			displayedPlayer = this;
		}
	}
	this.redBorder = function() {
		document.getElementById("icon-container"+this.i+this.j).style =
			"outline-color:red; outline-width:2px;";
	}
	this.blueBorder = function() {
		document.getElementById("icon-container"+this.i+this.j).style =
			"outline-color:blue; outline-width:2px;";
	}
	this.noBorder = function() {
		document.getElementById("icon-container"+this.i+this.j).style =
			"outline-color:red; outline-width:0px;";
	}
	this.moveTo = function(i, j) {
		partner = field[i][j];
		field[this.i][this.j] = partner;
		partner.i = this.i;
		partner.j = this.j;
		field[i][j] = this;
		this.i = i;
		this.j = j;
	}
	this.die = function() {
		this.HP = 0;
		this.DP = 0;
		this.Action = 0;
		if (this.i == 1 && field[0][this.j].isValidTarget()) {
			this.moveTo(0, this.j);
		} else if (this.i == 2 && field[3][this.j].isValidTarget()) {
			this.moveTo(3, this.j);
		}
		console.log(this.name + " (" + this.i + ", " + this.j + ") died");
		document.getElementById("icon"+this.i+this.j).style = "opacity:0.2";
	}
};

function Orb(){
	Unit.call(this);
	this.name = "Orb";
	this.image_id = "mon_orb.jpg";
	this.max_HP = 60;
	this.HP = 60;
	this.max_DP = 30;
	this.DP = 30;
	this.Hit = 30;
	this.Dam = 30;
	this.Speed = 30 + (Math.random()-0.5)*3;
};

var Sena = new Unit();
$(Sena).attr({
	name: "Sena",
	image_id: "sena.jpg",
	max_HP: 90,
	HP: 90,
	max_DP: 100,
	DP: 100,
	Hit: 45,
	Dam: 40,
	Speed: 40
});
var Renaud = new Unit();
$(Renaud).attr({
	name: "Renaud",
	image_id: "renaud.jpg",
	max_HP: 70,
	HP: 100,
	max_DP: 80,
	DP: 80,
	Hit: 35,
	Dam: 50,
	Speed: 35
});
var Rose = new Unit();
$(Rose).attr({
	name: "Rose",
	image_id: "rose.jpg",
	max_HP: 100,
	HP: 100,
	max_DP: 80,
	DP: 80,
	Hit: 35,
	Dam: 50,
	Speed: 35
});
var Lena = new Unit();
$(Lena).attr({
	name: "Lena",
	image_id: "lena.jpg",
	max_HP: 70,
	HP: 70,
	max_DP: 80,
	DP: 80,
	Hit: 35,
	Dam: 50,
	Speed: 35
});

field = [
	[new Unit(), Lena, new Unit()],
	[new Unit(), Rose, new Unit()],
	[new Unit(), Sena, new Unit()],
	[new Unit(), Renaud, new Unit()]
];

for (i = 0; i < 4; i++){
	for (j = 0; j < 3; j++){
		field[i][j].i = i;
		field[i][j].j = j;
		if (field[i][j].isValidTarget()){
			field[i][j].Action = 20*Math.random();
		}
	}
};

field[2][1].displayPortrait();
field[1][1].displayPortrait();

function updateDisplay() {
	max_width = 100
	document.getElementById("playerportrait").src =
		"images/400x600/" + displayedPlayer.image_id;
	document.getElementById("playerpaneltext").innerHTML =
		"HP: " + displayedPlayer.HP + "/" + displayedPlayer.max_HP;
	document.getElementById("enemyportrait").src =
		"images/400x600/" + displayedEnemy.image_id;
	document.getElementById("enemypaneltext").innerHTML =
		"HP: " + displayedEnemy.HP + "/" + displayedEnemy.max_HP;
	for (i = 0; i < 4; i++){
		for (j = 0; j < 3; j++){
			document.getElementById("icon"+i+j).src = 
				"images/100x100/" + field[i][j].image_id;
			document.getElementById("hp"+i+j).style =
				"width:" +
				Math.min(
					field[i][j].HP/field[i][j].max_HP*max_width,
					max_width).toFixed() + "px";
		}
	}
};

function clearBorders() {
	for (i = 0; i < 4; i++){
		for (j = 0; j < 3; j++){
			field[i][j].noBorder();
		}
	}
};

function nextTurn() {
	ready = [];
	clearBorders();
	function nextTick() {
		if (ready.length > 0) {
			clearInterval(myTimer);
			ready.sort(function(a, b){return b.Action-a.Action});
			ready[0].takeTurn();
			ready[0].Action = 0;
			ready.shift();
		} else {
			for (i = 0; i < 4; i++){
				for (j = 0; j < 3; j++){
					if (field[i][j].isValidTarget()) {
						field[i][j].Action += field[i][j].Speed/10;
						if (field[i][j].Action >= 100) {
							ready.push(field[i][j]);
						}
					}
				}
			}
		}
		updateDisplay();
	}
	var myTimer = setInterval(nextTick, 20);
};