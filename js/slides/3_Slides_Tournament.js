Loader.addToManifest(Loader.manifest,{
	// SFX
	drumroll: "assets/sounds/drumroll.mp3"
});

// round-robin tournament, place your bets
SLIDES.push({
	id: "tournament",
	onstart: function(self){

		// Tournament
		Tournament.resetGlobalVariables();
		Tournament.INITIAL_AGENTS = [
			{strategy:"tft", count:1},
			{strategy:"all_d", count:1},
			{strategy:"all_c", count:1},
			{strategy:"grudge", count:1},
			{strategy:"prober", count:1}
		];
		
		// Store the bet answer - keep original for display, Bitcoin name for comparison
		_.answerOriginal = _.answer; // Keep original (tft, all_d, etc.) for icon lookups
		if(window.BITCOIN_MODE && typeof getBitcoinStrategyName !== 'undefined'){
			_.answerBitcoin = getBitcoinStrategyName(_.answer);
		} else {
			_.answerBitcoin = _.answer;
		}
		Tournament.FLOWER_CONNECTIONS = true;
		self.add({id:"tournament", type:"Tournament", x:-20, y:20});

		// Words to the side
		self.add({
			id:"text", type:"TextBox",
			x:510, y:30, width:450, height:500,
			text_id:"place_your_bets"
		});

		// Button
		var _addButton = function(character, x, y){
			(function(character, x, y){
				self.add({
					id:"bet_"+character, type:"Button", x:x, y:y, 
					text_id: "icon_"+character,
					tooltip: "character_"+character,
					onclick:function(){
						_.answer = character;
						publish("slideshow/next");
					}
				});
			})(character, x, y);
		};
		_addButton("tft", 510, 220+25);
		_addButton("all_c", 730, 220+25);
		_addButton("all_d", 510, 300+25);
		_addButton("grudge", 730, 300+25);
		_addButton("prober", 510, 380+25);

		// WHO'S WHO?
		self.add({
			id:"forgot", type:"TextBox",
			x:728, y:408, width:200, height:50,
			align:"center", color:"#aaa", size:16,
			text_id:"forgot_whos_who"
		});
		
	},
	onend: function(self){
		self.remove("bet_tft");
		self.remove("bet_all_c");
		self.remove("bet_all_d");
		self.remove("bet_grudge");
		self.remove("bet_prober");
		self.remove("forgot");
	}
});

// Alright, let's start!
SLIDES.push({
	onstart: function(self){

		var o = self.objects;

		// Ensure answer is stored with correct mappings
		_.answerOriginal = _.answer; // Keep original (tft, all_d, etc.) for icon lookups
		if(window.BITCOIN_MODE && typeof getBitcoinStrategyName !== 'undefined'){
			_.answerBitcoin = getBitcoinStrategyName(_.answer);
		} else {
			_.answerBitcoin = _.answer;
		}
		console.log("Tournament intro - Answer stored:", _.answer, "Original:", _.answerOriginal, "Bitcoin:", _.answerBitcoin);

		// What was your bet?
		var tournament_intro = Words.get("tournament_intro");
		tournament_intro = tournament_intro.replace(/\[CHAR\]/g, "<span class='"+_.answerOriginal+"'>"+Words.get("icon_"+_.answerOriginal)+"</span>");
		o.text.setText(tournament_intro);
		_hide(o.text); _fadeIn(o.text, 100);

		// "First Match" Button
		self.add({
			id:"button", type:"Button",
			x:510, y:420, 
			text_id:"first_match",
			message: "slideshow/next"
		});
		_hide(o.button); _fadeIn(o.button, 100+500);

	},
	onend: function(self){
		self.remove("button");
	}
});

// The matches... ONE BY ONE.
SLIDES.push({
	onstart: function(self){

		var o = self.objects;

		// Words to the side
		self.add({
			id:"text_extra", type:"TextBox",
			x:510, y:270, width:450, height:460
		});

		// Store tournament in global scope for winner slide to access
		window._tournament = o.tournament;

		var showTournament = function(num){

			var words = "";
			var match_header;

			// PLAY MATCH
			var matchData = o.tournament.playMatch(num);
			var charA = matchData.charA;
			var charB = matchData.charB;
			var roundPayoffs = matchData.payoffs;

			// Match N: [A] versus [B]
			match_header = Words.get("match_header_1");
			match_header = match_header.replace(/\[N\]/g, (num+1)+"");
			var labelA = Words.get("icon_"+charA) || charA;
			var labelB = Words.get("icon_"+charB) || charB;
			match_header = match_header.replace(/\[A\]/g, "<span class='"+charA+"'>"+labelA+"</span>");
			match_header = match_header.replace(/\[B\]/g, "<span class='"+charB+"'>"+labelB+"</span>");
			words += match_header+"<br>";

			// The rounds
			words += Words.get("match_header_2")+"<br>";
			for(var i=0;i<roundPayoffs.length;i++){
				var payoff = roundPayoffs[i][0];
				if(payoff==PD.PAYOFFS.P) payoff="P"; // Punishment
				if(payoff==PD.PAYOFFS.R) payoff="R"; // Reward
				if(payoff==PD.PAYOFFS.S) payoff="S"; // Sucker
				if(payoff==PD.PAYOFFS.T) payoff="T"; // Temptation
				words += "<span class='score_small' payoff='"+payoff+"'></span>";
			}
			words += "<br>";

			// The total scores - show cumulative coins from all matches so far (rounded to 1 decimal)
			var agents = o.tournament.agents;
			var agentA = agents.find(function(a){ return a.strategyName === charA; });
			var agentB = agents.find(function(a){ return a.strategyName === charB; });
			var scoreA = agentA ? (Math.round(agentA.coins * 10) / 10) : 0;
			var scoreB = agentB ? (Math.round(agentB.coins * 10) / 10) : 0;
			if(scoreA>0) scoreA="+"+scoreA;
			if(scoreB>0) scoreB="+"+scoreB;
			match_header = Words.get("match_header_3");
			match_header = match_header.replace(/\[A\]/g, "<span class='"+charA+"'>"+scoreA+"</span>");
			match_header = match_header.replace(/\[B\]/g, "<span class='"+charB+"'>"+scoreB+"</span>");
			words += match_header+"<br><br><br>";

			// PUT IN THE WORDS
			o.text.setText(words);
			_hide(o.text); _fadeIn(o.text, 100);

			// Extra info
			o.text_extra.setTextID("tournament_"+(num+1));
			_hide(o.text_extra); _fadeIn(o.text_extra, 100+250);

			// FADE IN BUTTON
			_hide(o.button); _fadeIn(o.button, 100+500);

		};

		// "Next Match" Button
		self.add({
			id:"button", type:"Button",
			x:510, y:420, size:"long",
			text_id:"next_match",
			onclick:function(){
				_matchNumber++;
				if(_matchNumber < 10){
					showTournament(_matchNumber);
				} else {
					// All matches done, show winner
					publish("slideshow/next");
				}
			}
		});

		// MATCH NUMBER!
		_matchNumber = 0;
		showTournament(_matchNumber);

	},
	onend: function(self){
		self.remove("text_extra");
		self.remove("button");
	}
});

// drumroll please...
SLIDES.push({
	onstart: function(self){
		var o = self.objects;
		o.text.setText(""); // Clear text

		// NEXT
		self.add({
			id:"button", type:"Button",
			x:510, y:420, size:"long",
			text_id:"the_winner_is",
			message:"slideshow/next"
		});
		_hide(o.button); _fadeIn(o.button, 100);
	},
	onend: function(self){
		self.remove("button");
	}
});

// who the winner is!
SLIDES.push({
	onstart: function(self){

		var o = self.objects;
		
		// Use stored tournament from matches slide
		var tournament = window._tournament;
		if(!tournament){
			console.error("Tournament not found in window._tournament");
			return;
		}
		
		if(tournament.dehighlightAllConnections) {
			tournament.dehighlightAllConnections();
		}

		// CALCULATE THE ACTUAL WINNER - find agent with highest coins
		var agents = tournament.agents;
		var winnerStrategy = "tft"; // default fallback
		var maxCoins = -Infinity;
		
		for(var i=0; i<agents.length; i++){
			if(agents[i].coins > maxCoins){
				maxCoins = agents[i].coins;
				winnerStrategy = agents[i].strategyName;
			}
		}
		
		console.log("Winner calculation - Strategy:", winnerStrategy, "Coins:", maxCoins);
		console.log("User prediction - Original:", _.answerOriginal, "Bitcoin:", _.answerBitcoin);
		
		// Convert to original name (tft, all_d, etc.) for word lookups
		var winnerStrategyOriginal = winnerStrategy;
		if(window.BITCOIN_MODE && typeof getOriginalStrategyName !== 'undefined'){
			winnerStrategyOriginal = getOriginalStrategyName(winnerStrategy);
		}

		// WORDS - dynamically build winner announcement with correct strategy name
		var words = "";
		var winnerLabel = Words.get("icon_"+winnerStrategyOriginal) || winnerStrategyOriginal;
		var winnerAnnouncement = "<b class='"+winnerStrategyOriginal+"'>"+winnerLabel.toUpperCase()+" ACCUMULATED THE HIGHEST PAYOFF.</b>";
		words += winnerAnnouncement;
		
		// Check if prediction was correct - compare Bitcoin names
		var predictionCorrect = (_.answerBitcoin && _.answerBitcoin === winnerStrategy);
		console.log("Prediction correct?", predictionCorrect, "User:", _.answerBitcoin, "Winner:", winnerStrategy);
		
		if(predictionCorrect){
			words += Words.get("tournament_winner_2_yay");
		}else{
			words += Words.get("tournament_winner_2_nay").replace(/\[CHAR\]/g, "<span class='"+_.answerOriginal+"'>"+Words.get("icon_"+_.answerOriginal)+"</span>");
		}
		words += "<br><br>";
		words += Words.get("tournament_winner_3");
		
		// Ensure text object exists and set text
		if(!o.text){
			self.add({
				id:"text", type:"TextBox",
				x:510, y:30, width:450, height:500
			});
			o = self.objects;
		}
		o.text.setText(words);

		// Ensure button exists
		if(!o.button){
			self.add({
				id:"button", type:"Button",
				x:510, y:500, size:"long",
				text_id:"tournament_teaser",
				message: "slideshow/next"
			});
			o = self.objects;
		}

		// DRUMROLL
		Loader.sounds.drumroll.volume(0.8).play();
		_hide(o.text);
		_hide(o.button);
		setTimeout(function(){
			_show(o.text);
			_show(o.button);
		},2000);

	},
	onend: function(self){
		self.clear();
	}
});