Loader.addToManifest(Loader.manifest,{
	// SFX
	fart: "assets/sounds/fart.mp3"
});

// Evolution Intro
SLIDES.push({
	id: "evolution",
	onstart: function(self){

		// WORDS
		self.add({
			id:"text1", type:"TextBox",
			x:0, y:20, width:774, height:42,
			text_id:"evolution_intro"
		});
		self.add({
			id:"text2", type:"TextBox",
			x:0, y:235, width:287, height:117, align:"center",
			text_id:"evolution_intro_1"
		});
		self.add({
			id:"text3", type:"TextBox",
			x:336, y:235, width:287, height:117, align:"center",
			text_id:"evolution_intro_2"
		});
		self.add({
			id:"text4", type:"TextBox",
			x:669, y:235, width:287, height:117, align:"center",
			text_id:"evolution_intro_3"
		});
		self.add({
			id:"text5", type:"TextBox",
			x:132, y:390, width:817, height:130, align:"center",
			text_id:"evolution_intro_footer"
		});

		// IMAGE
		self.add({
			id:"img", type:"ImageBox",
			src: "assets/evolution/evolution_intro.png",
			x:0, y:60, width:960, height:170
		});

		// Button
		self.add({
			id:"button", type:"Button", x:615, y:485, 
			text_id:"evolution_intro_button", size:"long",
			message:"slideshow/scratch"
		});

	},
	onend: function(self){
		self.clear();
	}
});

// Place Your Bets
SLIDES.push({
	onstart: function(self){

		// Tournament
		Tournament.resetGlobalVariables();
		Tournament.INITIAL_AGENTS = [
			{strategy:"all_c", count:15},
			{strategy:"all_d", count:5},
			{strategy:"tft", count:5}
		];
		self.add({id:"tournament", type:"Tournament", x:-20, y:20});

		// Words to the side
		self.add({
			id:"text", type:"TextBox",
			x:510, y:30, width:450, height:500,
			text_id:"evo_1"
		});

		// BETS
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
		_addButton("all_c", 510, 380);
		_addButton("all_d", 510, 380+70);
		_addButton("tft", 510, 380+70*2);

		// WHO'S WHO?
		self.add({
			id:"forgot", type:"TextBox",
			x:728, y:500, width:200, height:50,
			align:"center", color:"#aaa", size:16,
			text_id:"forgot_whos_who"
		});

	},
	onend: function(self){
		self.remove("bet_tft");
		self.remove("bet_all_c");
		self.remove("bet_all_d");
		self.remove("forgot");
	}
});

// Result: ROUNDS ALL THE WAY 'TIL THE END
SLIDES.push({
	onstart: function(self){

		var o = self.objects;

		// Store prediction and get tournament winner
		_.evolutionPrediction = _.answer;
		var tournament = o.tournament;
		if(tournament && tournament.agents){
			var maxCoins = -Infinity;
			var winnerStrategy = "tft";
			for(var i=0; i<tournament.agents.length; i++){
				if(tournament.agents[i].coins > maxCoins){
					maxCoins = tournament.agents[i].coins;
					winnerStrategy = tournament.agents[i].strategyName;
				}
			}
			_.evolutionTournamentWinner = winnerStrategy;
			console.log("Evolution - User prediction:", _.answer, "Tournament winner:", winnerStrategy);
		}

		// What was your bet?
		var response = Words.get("evo_2_"+_.evolutionPrediction)+" "+Words.get("evo_2");
		o.text.setText(response);
		_hide(o.text); _fadeIn(o.text, 100);

		// The tournament control buttons
		var x = 510;
		var y = 200;
		var nextStep;
		// [FOR DEBUGGING]
		var textStep = 2;
		// var textStep = 8;
		self.add({
			id:"step_1", type:"Button", x:x, y:y, 
			text_id: "label_play_tournament", size:"long",
			onclick:function(){
				o.step_1.deactivate();
				nextStep = o.step_2;
				publish("tournament/play");
			}
		});
		self.add({
			id:"step_2", type:"Button", x:x, y:y+70, 
			text_id: "label_eliminate_bottom_5", size:"long",
			onclick:function(){
				o.step_2.deactivate();
				nextStep = o.step_3;
				publish("tournament/eliminate");
			},
			active: false
		});
		self.add({
			id:"step_3", type:"Button", x:x, y:y+70*2, 
			text_id: "label_reproduce_top_5", size:"long",
			onclick:function(){
				o.step_3.deactivate();
				nextStep = o.step_1;
				publish("tournament/reproduce");
			},
			active: false
		});
		listen(_, "tournament/step/completed", function(step){
			nextStep.activate();
			if(step=="reproduce"){
				textStep++;
				var response;
				if(textStep<9){
					if(textStep==3){
						// Show evo_3 based on actual tournament winner, not prediction
						response = Words.get("evo_3_"+_.evolutionTournamentWinner)+" "+Words.get("evo_3");
					}else{
						response = Words.get("evo_"+textStep);
					}
					o.text.setText(response);
					_hide(o.text); _fadeIn(o.text, 100);
					_showButtons();
				}else{
					publish("slideshow/next");
				}
			}
		});
		var _showButtons = function(){
			_hide(o.step_1); _fadeIn(o.step_1, 500);
			_hide(o.step_2); _fadeIn(o.step_2, 600);
			_hide(o.step_3); _fadeIn(o.step_3, 700);
		};
		_showButtons();

	},
	onend: function(self){
		unlisten(_);
		self.remove("step_1");
		self.remove("step_2");
		self.remove("step_3");
	}
});

// Result Explanation
SLIDES.push({
	onstart: function(self){

		var o = self.objects;

		// Show result based on whether prediction was correct
		var winner = _.evolutionTournamentWinner || "tft";
		var prediction = _.evolutionPrediction || _.answer;
		var predictionCorrect = (winner === prediction);
		var resultMessage = predictionCorrect ? "evo_9_"+prediction : "evo_9_"+winner;
		
		var response = Words.get("evo_9")+"<br><br>"+Words.get(resultMessage)+" "+Words.get("evo_9_end");
		o.text.setText(response);
		console.log("Evolution result - Winner:", winner, "Prediction:", prediction, "Correct:", predictionCorrect);
		_hide(o.text); _fadeIn(o.text, 100);

		// Oh by the way...
		self.add({
			id:"button", type:"Button", x:510, y:320, 
			text_id:"evo_9_btn", size:"long",
			message: "slideshow/next"
		});
		_hide(o.button); _fadeIn(o.button, 400);

	},
	onend: function(self){
		self.remove("button");
	}
});

// How Bitcoin Makes This Automatic
SLIDES.push({
	onstart: function(self){

		var o = self.objects;

		var response = Words.get("evo_bitcoin_mechanism");
		o.text.setText(response);
		_hide(o.text); _fadeIn(o.text, 100);

		self.add({
			id:"button", type:"Button", x:510, y:480, 
			text_id:"evo_bitcoin_mechanism_btn", size:"long",
			message: "slideshow/next"
		});
		_hide(o.button); _fadeIn(o.button, 400);

	},
	onend: function(self){
		self.remove("button");
	}
});

// (Yup, even w Grudgers & Detectives)
SLIDES.push({
	onstart: function(self){

		var o = self.objects;
		
		// SCRATCH IN TOURNAMENT
		Scratcher.smallScratch(0, 0, 480, 540, function(){
			Tournament.resetGlobalVariables();
			Tournament.INITIAL_AGENTS = [
				{strategy:"all_c", count:5},
				{strategy:"all_d", count:5},
				{strategy:"tft", count:5},
				{strategy:"grudge", count:5},
				{strategy:"prober", count:6}
			];
			o.tournament.reset();
		});

		// The same with grudger & detetive!
		o.text.setTextID("evo_10");
		_hide(o.text); _fadeIn(o.text, 1000);

		// Button: start/stop
		var isPlaying = false;
		self.add({
			id:"autoplay", type:"Button", x:510, y:100, 
			text_id:"evo_autoplay", size:"long",
			onclick: function(){
				if(!isPlaying){
					o.autoplay.setText("evo_autoplay_stop");
					publish("tournament/autoplay/start");
					isPlaying = true;
				}else{
					o.autoplay.setText("evo_autoplay");
					publish("tournament/autoplay/stop");
					isPlaying = false;
				}
			}
		});
		_hide(o.autoplay); _fadeIn(o.autoplay, 1200);

		// Listen...
		var step = 0;
		listen(_, "tournament/step/completed", function(aahhhh){
			step++;
			if(step==13){
				_goOn();
			}
		});

		var _goOn = function(){

			// Text followup (hidden)
			self.add({
				id:"text2", type:"TextBox",
				x:510, y:180, width:450, height:500,
				text_id:"evo_10_followup"
			});
			_hide(o.text2); _fadeIn(o.text2, 400);

			// Button: next (hidden)
			self.add({
				id:"next", type:"Button", x:510, y:450, 
				text_id:"evo_10_btn", size:"long",
				message: "slideshow/next"
			});
			_hide(o.next); _fadeIn(o.next, 600);

		};

	},
	onend: function(self){
		unlisten(_);
		self.remove("autoplay");
		self.remove("text2");
		self.remove("next");
	}
});

// Problem 1: Number of interactions
SLIDES.push({
	onstart: function(self){
		var o = self.objects;

		// FART SOUNDS
		Loader.sounds.fart.play();

		// New tournament...
		Tournament.resetGlobalVariables();
		Tournament.INITIAL_AGENTS = [
			{strategy:"all_d", count:24},
			{strategy:"tft", count:1}
		];
		o.tournament.reset();

		// Text
		o.text.setTextID("evo_11");
		//_hide(o.text); _fadeIn(o.text, 100);

		// Next
		self.add({
			id:"next", type:"Button", x:510, y:425, 
			text_id:"evo_11_btn", size:"long",
			message: "slideshow/next"
		});
		//_hide(o.next); _fadeIn(o.next, 200);

	},
	onend: function(self){
		self.remove("text");
		self.remove("next");
		_.clear();
	}
});

// Problem 2: Payoffs

// Teaser...


