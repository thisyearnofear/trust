var PEEP_METADATA = {
	   tft: {frame:0, color:"#4089DD"}, 
	 all_d: {frame:1, color:"#52537F"},
	 all_c: {frame:2, color:"#FF75FF"},
	grudge: {frame:3, color:"#efc701"},
	prober: {frame:4, color:"#f6b24c"},
	  tf2t: {frame:5, color:"#88A8CE"},
	pavlov: {frame:6, color:"#86C448"},
	random: {frame:7, color:"#FF5E5E"}
};

var PD = {};
PD.COOPERATE = "CONSENSUS"; // Build on consensus chain
PD.ATTACK = "FORK";         // Build own minority fork

PD.PAYOFFS_DEFAULT = {
	P: 0, // punishment: neither of you get anything
	S: -1, // sucker: you put in coin, other didn't.
	R: 2, // reward: you both put 1 coin in, both got 3 back
	T: 3 // temptation: you put no coin, got 3 coins anyway
};

PD.PAYOFFS = JSON.parse(JSON.stringify(PD.PAYOFFS_DEFAULT));

subscribe("pd/editPayoffs", function(payoffs){
	PD.PAYOFFS = payoffs;
});
subscribe("pd/editPayoffs/P", function(value){ PD.PAYOFFS.P = value; });
subscribe("pd/editPayoffs/S", function(value){ PD.PAYOFFS.S = value; });
subscribe("pd/editPayoffs/R", function(value){ PD.PAYOFFS.R = value; });
subscribe("pd/editPayoffs/T", function(value){ PD.PAYOFFS.T = value; });
subscribe("pd/defaultPayoffs", function(){

	PD.PAYOFFS = JSON.parse(JSON.stringify(PD.PAYOFFS_DEFAULT));

	publish("pd/editPayoffs/P", [PD.PAYOFFS.P]);
	publish("pd/editPayoffs/S", [PD.PAYOFFS.S]);
	publish("pd/editPayoffs/R", [PD.PAYOFFS.R]);
	publish("pd/editPayoffs/T", [PD.PAYOFFS.T]);

});

PD.NOISE = 0;
subscribe("rules/noise",function(value){
	PD.NOISE = value;
});

PD.getPayoffs = function(move1, move2){
	var payoffs = PD.PAYOFFS;
	if(move1==PD.ATTACK && move2==PD.ATTACK) return [payoffs.P, payoffs.P]; // both build forks - network split
	if(move1==PD.COOPERATE && move2==PD.ATTACK) return [payoffs.S, payoffs.T]; // one consensus, one fork
	if(move1==PD.ATTACK && move2==PD.COOPERATE) return [payoffs.T, payoffs.S]; // one fork, one consensus
	if(move1==PD.COOPERATE && move2==PD.COOPERATE) return [payoffs.R, payoffs.R]; // both follow consensus
};

// Bitcoin consensus rule: miners who follow the longest chain are rewarded
PD.applyForkChoiceRule = function(playerA, playerB, scores) {
	// In Bitcoin, the network follows the longest valid chain (Nakamoto consensus)
	// Miners who build on the consensus chain get full rewards
	// Miners who build on minority forks get reduced rewards (fewer nodes validate their blocks)
	
	var aCooperated = playerA.lastMove === PD.COOPERATE;
	var bCooperated = playerB.lastMove === PD.COOPERATE;
	
	// Both follow consensus chain - both earn full rewards
	if (aCooperated && bCooperated) {
		return scores; // No change needed
	}
	
	// One builds on minority fork, one follows consensus
	if (!aCooperated && bCooperated) {
		// Player A chose minority fork - fewer nodes accept their blocks
		// Player B follows consensus - full network support
		scores[0] = Math.max(0, scores[0] * 0.5); // Minority fork gets 50% acceptance
		scores[1] = scores[1] * 1.0; // Consensus chain gets normal reward
	}
	
	if (aCooperated && !bCooperated) {
		// Player B chose minority fork, Player A follows consensus
		scores[0] = scores[0] * 1.0; // Consensus chain gets normal reward
		scores[1] = Math.max(0, scores[1] * 0.5); // Minority fork gets 50% acceptance
	}
	
	// Both build on different forks - network splits, both chains are weaker
	if (!aCooperated && !bCooperated) {
		scores[0] = Math.max(0, scores[0] * 0.5); // Split network means less validation
		scores[1] = Math.max(0, scores[1] * 0.5);
	}
	
	return scores;
};

PD.playOneGame = function(playerA, playerB){

	// Make your moves!
	var A = playerA.play();
	var B = playerB.play();

	// Noise: random mistakes, flip around!
	if(Math.random()<PD.NOISE) A = ((A==PD.COOPERATE) ? PD.ATTACK : PD.COOPERATE);
	if(Math.random()<PD.NOISE) B = ((B==PD.COOPERATE) ? PD.ATTACK : PD.COOPERATE);
	
	// Get payoffs
	var payoffs = PD.getPayoffs(A,B);

	// Remember own & other's moves (or mistakes)
	playerA.remember(A, B);
	playerB.remember(B, A);

	// Apply Bitcoin fork choice rule (longest chain wins)
	if (window.BITCOIN_MODE) {
		payoffs = PD.applyForkChoiceRule(playerA, playerB, payoffs);
	}

	// Add to scores (only in tournament?)
	playerA.addPayoff(payoffs[0]);
	playerB.addPayoff(payoffs[1]);

	// Return the payoffs...
	return payoffs;

};

PD.playRepeatedGame = function(playerA, playerB, turns){

	// I've never met you before, let's pretend
	playerA.resetLogic();
	playerB.resetLogic();

	// Play N turns
	var scores = {
		totalA:0,
		totalB:0,
		payoffs:[]
	};
	for(var i=0; i<turns; i++){
		var p = PD.playOneGame(playerA, playerB);
		scores.payoffs.push(p);
		scores.totalA += p[0];
		scores.totalB += p[1];
	}

	// Return the scores...
	return scores;

};

PD.playOneTournament = function(agents, turns){

	// Reset everyone's coins
	for(var i=0; i<agents.length; i++){
		agents[i].resetCoins();
	}

	// Round robin!
	for(var i=0; i<agents.length; i++){
		var playerA = agents[i];
		for(var j=i+1; j<agents.length; j++){
			var playerB = agents[j];
			PD.playRepeatedGame(playerA, playerB, turns);
		}	
	}

};

///////////////////////////////////////////////////////
///////////////////////////////////////////////////////
///////////////////////////////////////////////////////

function Logic_tft(){
	var self = this;
	var otherMove = PD.COOPERATE;
	self.play = function(){
		return otherMove;
	};
	self.remember = function(own, other){
		otherMove = other;
	};
}

function Logic_tf2t(){
	var self = this;
	var howManyTimesAttacked = 0;
	self.play = function(){
		if(howManyTimesAttacked>=2){
			return PD.ATTACK; // retaliate ONLY after two betrayals
		}else{
			return PD.COOPERATE;
		}
	};
	self.remember = function(own, other){
		if(other==PD.ATTACK){
			howManyTimesAttacked++;
		}else{
			howManyTimesAttacked = 0;
		}
	};
}

function Logic_grudge(){
	var self = this;
	var everAttackedMe = false;
	self.play = function(){
		if(everAttackedMe) return PD.ATTACK;
		return PD.COOPERATE;
	};
	self.remember = function(own, other){
		if(other==PD.ATTACK) everAttackedMe=true;
	};
}

function Logic_all_d(){
	var self = this;
	self.play = function(){
		return PD.ATTACK;
	};
	self.remember = function(own, other){
		// nah
	};
}

function Logic_all_c(){
	var self = this;
	self.play = function(){
		return PD.COOPERATE;
	};
	self.remember = function(own, other){
		// nah
	};
}

function Logic_random(){
	var self = this;
	self.play = function(){
		return (Math.random()>0.5 ? PD.COOPERATE : PD.ATTACK);
	};
	self.remember = function(own, other){
		// nah
	};
}

// Start off Cooperating
// Then, if opponent cooperated, repeat past move. otherwise, switch.
function Logic_pavlov(){
	var self = this;
	var myLastMove = PD.COOPERATE;
	self.play = function(){
		return myLastMove;
	};
	self.remember = function(own, other){
		myLastMove = own; // remember MISTAKEN move
		if(other==PD.ATTACK) myLastMove = ((myLastMove==PD.COOPERATE) ? PD.ATTACK : PD.COOPERATE); // switch!
	};
}

// TEST by Cooperate | Attack | Cooperate | Cooperate
// If EVER retaliates, keep playing TFT
// If NEVER retaliates, switch to ALWAYS DEFECT
function Logic_prober(){

	var self = this;

	var moves = [PD.COOPERATE, PD.ATTACK, PD.COOPERATE, PD.COOPERATE];
	var everAttackedMe = false;

	var otherMove = PD.COOPERATE;
	self.play = function(){
		if(moves.length>0){
			// Testing phase
			var move = moves.shift();
			return move;
		}else{
			if(everAttackedMe){
				return otherMove; // TFT
			}else{
				return PD.ATTACK; // Always Attack
			}
		}
	};
	self.remember = function(own, other){
		if(moves.length>0){
			if(other==PD.ATTACK) everAttackedMe=true; // Testing phase: ever retaliated?
		}
		otherMove = other; // for TFT
	};

}
