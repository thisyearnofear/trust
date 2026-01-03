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
			x:130, y:408, width:700, height:50, align:"center"
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
			id:"btnAttack", type:"Button", x:275, y:470, text_id:"label_attack", uppercase:true,
			onclick:function(){
				_.answer = "ATTACK";
				publish("slideshow/next");
			}
		});
		self.add({
			id:"btnCooperate", type:"Button", x:495, y:470, text_id:"label_cooperate", uppercase:true,
			onclick:function(){
				_.answer = "COOPERATE";
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

		// Text
		var t = o.topWords;
		var b = o.btmWords;
		if(_.answer=="COOPERATE"){
			t.setText(Words.get("oneoff_1_cooperated")+"<br>"+Words.get("oneoff_1_top"));
		}else{
			t.setText(Words.get("oneoff_1_attacked")+"<br>"+Words.get("oneoff_1_top"));
		}
		b.setTextID("oneoff_1_btm");

		// Hide & fade
		_hide(o.topWords); _fadeIn(o.topWords, 150+10);
		_hide(o.btmWords); _fadeIn(o.btmWords, 150+600);
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

		// Text
		var t = o.topWords;
		if(_.answer=="COOPERATE"){
			t.setText(Words.get("oneoff_2_cooperated")+"<br>"+Words.get("oneoff_2_top"));
		}else{
			t.setText(Words.get("oneoff_2_attacked")+"<br>"+Words.get("oneoff_2_top"));
		}
		self.add({
			id:"btmWords", type:"TextBox", text_id:"oneoff_2_btm",
			x:130, y:392, width:700, height:100, align:"center"
		});

		// Replace button
		self.remove("btnAttack");
		self.remove("btnCooperate");
		self.add({
			id:"btnNext", type:"Button", x:304, y:481, size:"long",
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

