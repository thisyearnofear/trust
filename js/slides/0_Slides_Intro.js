/********************

0. Introduction
1. One Game
2. Repeated Game
3. One Tournament
4. Repeated Tournament
5. Making Mistaeks
6. Sandbox
7. Conclusion
X. Credits

Labels should be in the en.html folder

*********************/

Loader.addToManifest(Loader.manifest,{

	// CSS ASSETS
	cssAsset0: "assets/ui/button.png",
	cssAsset1: "assets/ui/button_short.png",
	cssAsset2: "assets/ui/button_long.png",
	cssAsset3: "assets/ui/sandbox_tabs.png",
	cssAsset4: "assets/ui/sandbox_incdec.png",
	cssAsset5: "assets/ui/slider_bg.png",
	cssAsset6: "assets/ui/slider_knob.png",
	cssAsset7: "assets/ui/sandbox_hats.png",
	cssAsset8: "assets/ui/scratch.png",
	cssAsset9: "assets/iterated/iterated_scoreboard.png",
	cssAsset10: "assets/tournament/peep_characters.png",
	cssAsset11: "assets/ui/sandbox_hats.png",
	cssAsset12: "assets/tournament/score_small.png",

	// Music!
	bg_music: "assets/sounds/bg_music.mp3",

	// IMAGE BOXES
	image1: "assets/evolution/evolution_intro.png",
	image2: "assets/conclusion/summary.png",
	image3: "assets/conclusion/truce.jpg",

});

SLIDES.push({

	//id: "preloader",
	onstart: function(self){

		var o = self.objects;

		// Splash in background
		self.add({ id:"splash", type:"Splash" });

		// TITLE TEXT
		self.add({
			id:"title", type:"TextBox",
			x:130, y:80, width:700,
			size:100, lineHeight:0.9, align:"center",
			text_id:"title"
		});
		self.add({
			id:"subtitle", type:"TextBox",
			x:267, y:344, width:420,
			align:"center", color:"#aaa", size:15,
			text_id:"subtitle"
		});

		// Button
		self.add({
			id:"loading_button", type:"Button", x:382, y:410,
			text_id:"loading",
			active:false
		});
		var _loadingWords = function(ratio){
			ratio = Math.round(ratio*100);
			o.loading_button.setText2(Words.get("loading")+" "+ratio+"%");
		};

		// PRELOADER
		listen(self,"preloader/progress", function(ratio){
			_loadingWords(ratio);
		});
		listen(self,"preloader/done", function(){
			o.loading_button.setText("loading_done");
			o.loading_button.activate();
			o.loading_button.config.onclick = function(){
				publish("start/game");
				Loader.sounds.bg_music.volume(0.75).loop(true).play(); // play music!
			};
		});

	},
	onend: function(self){
		unlisten(self);
		self.remove("title");
		self.remove("subtitle");
		self.remove("loading_button");
	}

});

SLIDES.push({
	id: "intro",
	onjump: function(self){
		// Splash in background
		self.add({ id:"splash", type:"Splash" });
	},
	onstart: function(self){

		var o = self.objects;
		
		// Circular Wordbox
		self.add({
			id:"intro_text", type:"TextBox",
			x:130, y:10, width:700, height:500, align:"center",
			text_id:"intro"
		});

		// Button
		self.add({
			id:"intro_button", type:"Button", x:304, y:466, size:"long",
			text_id:"intro_button", 
			message:"slideshow/scratch"
		});

		_hide(o.intro_text); _fadeIn(o.intro_text, 200);
		_hide(o.intro_button); _fadeIn(o.intro_button, 700);

	},
	onend: function(self){
		self.clear();
	}

});

// Why Bitcoin's solution worked
SLIDES.push({
	id: "why_this_works",
	onstart: function(self){

		var o = self.objects;

		// Splash in background
		self.add({ id:"splash", type:"Splash" });

		// Why this works - part 1
		self.add({
			id:"why_1", type:"TextBox",
			x:130, y:20, width:700, height:200, align:"center",
			text_id:"why_this_works_1"
		});

		// Why this works - part 2
		self.add({
			id:"why_2", type:"TextBox",
			x:130, y:240, width:700, height:200, align:"center",
			text_id:"why_this_works_2"
		});

		// Button
		self.add({
			id:"button", type:"Button", x:304, y:466, size:"long",
			text_id:"why_this_works_btn",
			message:"slideshow/scratch"
		});

		_hide(o.why_1); _fadeIn(o.why_1, 200);
		_hide(o.why_2); _fadeIn(o.why_2, 400);
		_hide(o.button); _fadeIn(o.button, 700);

	},
	onend: function(self){
		self.clear();
	}

});

// Charms Explanation Slide 1: After game - what you learned
SLIDES.push({
	id: "charms_intro",
	onstart: function(self){

		var o = self.objects;

		// Splash in background
		self.add({ id:"splash", type:"Splash" });

		// Charms explanation text
		self.add({
			id:"charms_text", type:"TextBox",
			x:130, y:60, width:700, height:350, align:"center",
			text_id:"charms_intro"
		});

		// Button
		self.add({
			id:"charms_button", type:"Button", x:304, y:466, size:"long",
			text_id:"charms_button",
			message:"slideshow/scratch"
		});

		_hide(o.charms_text); _fadeIn(o.charms_text, 200);
		_hide(o.charms_button); _fadeIn(o.charms_button, 700);

	},
	onend: function(self){
		self.clear();
	}

});

// Charms Explanation Slide 2: What you just experienced
SLIDES.push({
	id: "charms_what",
	onstart: function(self){

		var o = self.objects;

		// Splash in background
		self.add({ id:"splash", type:"Splash", blush:true });

		// Explanation of mechanics
		self.add({
			id:"what_text", type:"TextBox",
			x:130, y:60, width:700, height:350, align:"center",
			text_id:"charms_what"
		});

		// Button to continue to credits
		self.add({
			id:"what_button", type:"Button", x:304, y:466, size:"long",
			text: "Continue →",
			message:"slideshow/scratch"
		});

		_hide(o.what_text); _fadeIn(o.what_text, 200);
		_hide(o.what_button); _fadeIn(o.what_button, 700);

	},
	onend: function(self){
		self.clear();
	}

});