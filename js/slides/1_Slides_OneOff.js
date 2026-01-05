// THE TRUST GAME - COOPERATE, YA NO?
SLIDES.push({

	id: "oneoff",

	onstart: function(self){

		Tournament.resetGlobalVariables();

		// Iterated Simulation
		self.add({id:"iterated", type:"Iterated", x:130, y:133});

		// Words on top & bottom
		self.add({
			id:"topWords", type:"TextBox", text_id:"oneoff_0_top",
			x:130, y:10, width:700, height:110, align:"center"
		});
		self.add({
			id:"btmWords", type:"TextBox", text_id:"oneoff_0_btm",
			x:130, y:400, width:700, height:65, align:"center"
		});

		// Labels
		self.add({
			id:"labelYou", type:"TextBox",
			x:211, y:140, width:50, height:50,
			align:"center", color:"#aaa", size:17,
			text_id:"label_you"
		});
		self.add({
			id:"labelThem", type:"TextBox",
			x:702, y:128, width:50, height:50,
			align:"center", color:"#aaa", size:17,
			text_id:"label_them"
		});

		// Buttons
		self.add({
			id:"btnAttack", type:"Button", x:275, y:485, text_id:"label_attack", uppercase:true,
			onclick:function(){
				_.answer = "FORK";
				publish("slideshow/next");
			}
		});
		self.add({
			id:"btnCooperate", type:"Button", x:495, y:485, text_id:"label_cooperate", uppercase:true,
			onclick:function(){
				_.answer = "CONSENSUS";
				publish("slideshow/next");
			}
		});

	},
	onend: function(self){
		//self.remove("labelYou");
		//self.remove("labelThem");
	}

},{

	onstart: function(self){

		var o = self.objects;

		// Payoff
		o.iterated.oneoffHighlight1(_.answer);

		// Text - Progressive revelation with toggle
		var t = o.topWords;
		var b = o.btmWords;
		var showingDetailed = false;
		
		// Initial immediate feedback
		if(_.answer=="CONSENSUS"){
			t.setText(Words.get("oneoff_1_cooperated")+"<br>"+Words.get("oneoff_1_top"));
		}else{
			t.setText(Words.get("oneoff_1_attacked")+"<br>"+Words.get("oneoff_1_top"));
		}
		b.setTextID("oneoff_1_btm");

		// Hide & fade - immediate feedback
		_hide(o.topWords); _fadeIn(o.topWords, 150+10);
		_hide(o.btmWords); _fadeIn(o.btmWords, 150+600);
		
		// Toggle function
		var toggleExplanation = function() {
			if (!showingDetailed) {
				// Show detailed explanation
				if(_.answer=="CONSENSUS"){
					t.setText(Words.get("oneoff_1_cooperated")+"<br>"+Words.get("oneoff_1_explanation"));
				}else{
					t.setText(Words.get("oneoff_1_attacked")+"<br>"+Words.get("oneoff_1_explanation"));
				}
				showingDetailed = true;
			} else {
				// Show immediate feedback
				if(_.answer=="CONSENSUS"){
					t.setText(Words.get("oneoff_1_cooperated")+"<br>"+Words.get("oneoff_1_top"));
				}else{
					t.setText(Words.get("oneoff_1_attacked")+"<br>"+Words.get("oneoff_1_top"));
				}
				showingDetailed = false;
			}
		};
		
		// Auto-toggle to detailed after delay
		setTimeout(toggleExplanation, 3000);
		
		// Make text clickable for manual toggle
		t.onclick = toggleExplanation;
		_hide(o.btnAttack); _fadeIn(o.btnAttack, 150+1200);
		_hide(o.btnCooperate); _fadeIn(o.btnCooperate, 150+1200);

	},
	onend: function(self){
		self.remove("btmWords");
	}

},{

	onstart: function(self){

		var o = self.objects;

		// Payoff
		o.iterated.oneoffHighlight2(_.answer);

		// Text - Progressive revelation with toggle
		var t = o.topWords;
		var showingDetailed = false;
		
		// Initial immediate feedback
		if(_.answer=="CONSENSUS"){
			t.setText(Words.get("oneoff_2_cooperated")+"<br>"+Words.get("oneoff_2_top"));
		}else{
			t.setText(Words.get("oneoff_2_attacked")+"<br>"+Words.get("oneoff_2_top"));
		}
		self.add({
			id:"btmWords", type:"TextBox", text_id:"oneoff_2_btm",
			x:130, y:385, width:700, height:90, align:"center"
		});
		
		// Toggle function
		var toggleExplanation = function() {
			if (!showingDetailed) {
				// Show detailed explanation
				if(_.answer=="CONSENSUS"){
					t.setText(Words.get("oneoff_2_cooperated")+"<br>"+Words.get("oneoff_2_explanation"));
				}else{
					t.setText(Words.get("oneoff_2_attacked")+"<br>"+Words.get("oneoff_2_explanation"));
				}
				showingDetailed = true;
			} else {
				// Show immediate feedback
				if(_.answer=="CONSENSUS"){
					t.setText(Words.get("oneoff_2_cooperated")+"<br>"+Words.get("oneoff_2_top"));
				}else{
					t.setText(Words.get("oneoff_2_attacked")+"<br>"+Words.get("oneoff_2_top"));
				}
				showingDetailed = false;
			}
		};
		
		// Auto-toggle to detailed after delay
		setTimeout(toggleExplanation, 3000);
		
		// Make text clickable for manual toggle
		t.onclick = toggleExplanation;

		// Replace button
		self.remove("btnAttack");
		self.remove("btnCooperate");
		self.add({
			id:"btnNext", type:"Button", x:304, y:495, size:"long",
			text_id:"oneoff_button_next", 
			message:"slideshow/next"
		});

		// Hide & fade
		_hide(o.topWords); _fadeIn(o.topWords, 150+10);
		_hide(o.btmWords); _fadeIn(o.btmWords, 150+600);
		_hide(o.btnNext); _fadeIn(o.btnNext, 150+1200);

	},

	onend: function(self){
		self.objects.iterated.dehighlightPayoff();
		self.remove("topWords");
		self.remove("btmWords");
		self.remove("btnNext");
		_.clear();
	}

});

