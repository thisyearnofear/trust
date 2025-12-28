SLIDES.push({
	id: "conclusion",
	onstart: function(self){

		// WORDS
		self.add({
			id:"text1", type:"TextBox",
			x:3, y:6, width:800,
			text_id:"conclusion_0"
		});
		self.add({
			id:"text2", type:"TextBox",
			x:176, y:65-10, width:760, size:30, color:"#4089DD",
			text_id:"conclusion_1_a"
		});
		self.add({
			id:"text3", type:"TextBox",
			x:176, y:115-10, width:760,
			text_id:"conclusion_1_a2"
		});
		self.add({
			id:"text4", type:"TextBox",
			x:176, y:192-10, width:760, size:30, color:"#efc701",
			text_id:"conclusion_2_a"
		});
		self.add({
			id:"text5", type:"TextBox",
			x:176, y:242-10, width:760,
			text_id:"conclusion_2_a2"
		});
		self.add({
			id:"text6", type:"TextBox",
			x:176, y:316-10, width:760, size:30, color:"#DD4040",
			text_id:"conclusion_3_a"
		});
		self.add({
			id:"text7", type:"TextBox",
			x:176, y:366-10, width:760,
			text_id:"conclusion_3_a2"
		});
		self.add({
			id:"text8", type:"TextBox",
			x:74, y:440, width:520, align:"right",
			text_id:"conclusion_4"
		});

		// IMAGE
		self.add({
			id:"img", type:"ImageBox",
			src: "assets/conclusion/summary.png",
			x:10, y:60, width:140, height:350
		});

		// Button
		self.add({
			id:"button", type:"Button", x:615, y:481, 
			text_id:"conclusion_btn", size:"long",
			message:"slideshow/scratch"
		});

	},
	onend: function(self){
		self.clear();
	}
});

// Your impact on Bitcoin - tier-specific celebration
SLIDES.push({
	onstart: function(self){
		
		var o = self.objects;
		const reputation = getGameReputation();
		const tier = reputation.getReputationTier();
		
		// Splash character with blush if trusted
		self.add({ 
			id:"splash", 
			type:"Splash", 
			blush: (tier.label === 'Trusted')
		});
		
		// Tier-specific celebration text
		var celebrationText = "";
		var tierColor = "#333";
		
		if (tier.label === 'Trusted') {
			celebrationText = `
				<b>YOU ARE TRUSTED.</b><br><br>
				Your consistent cooperation has made you a trusted member of the Bitcoin network.<br><br>
				With your ${reputation.getVotingPower()} votes, you shaped the rules that future players will follow.<br><br>
				<i>This is the power of decentralized consensus.</i>
			`;
			tierColor = "#4089DD";
		} else if (tier.label === 'Neutral') {
			celebrationText = `
				<b>YOU ARE BALANCED.</b><br><br>
				You cooperated ${reputation.cooperativeMoves} times out of ${reputation.totalMoves} moves.<br><br>
				With your ${reputation.getVotingPower()} votes, you helped decide the network's future.<br><br>
				<i>Every voice matters in Bitcoin's governance.</i>
			`;
			tierColor = "#efc701";
		} else {
			celebrationText = `
				<b>YOU ARE LEARNING.</b><br><br>
				Defection was tempting, but it didn't pay off long-term.<br><br>
				Even with less voting power, you participated in shaping Bitcoin's future.<br><br>
				<i>Try again. Cooperation pays off in the long run.</i>
			`;
			tierColor = "#FF5E5E";
		}
		
		self.add({
			id:"text", type:"TextBox",
			x:250, y:80, width:500, align:"center", size:16,
			text: celebrationText,
			color: tierColor
		});
		
		// Button
		self.add({
			id:"button", type:"Button", x:385, y:450, 
			text_id:"outro_1_btn",
			message:"slideshow/next"
		});
		
	},
	onend: function(self){
		self.clear();
	}
});

SLIDES.push({
	onstart: function(self){

		// Splash in background
		self.add({ id:"splash", type:"Splash", blush:true });

		// Circular Wordbox
		self.add({
			id:"text", type:"TextBox",
			x:160, y:10, width:640, height:500, align:"center",
			text_id:"outro_1"
		});

		// Button
		self.add({
			id:"button", type:"Button", x:385, y:466, 
			text_id:"outro_1_btn",
			message:"slideshow/next"
		});

	},
	onend: function(self){
		self.remove("text");
		self.remove("button");
	}
});

SLIDES.push({
	onstart: function(self){

		var o = self.objects;

		// Text
		self.add({
			id:"text", type:"TextBox",
			x:160, y:30, width:640, height:500, align:"center", size:22,
			text_id:"outro_2"
		});
		_hide(o.text); _fadeIn(o.text, 100);

		// Photo
		self.add({
			id:"img", type:"ImageBox",
			src: "assets/conclusion/truce.jpg",
			x:228, y:90, width:500,
		});
		_hide(o.img); _fadeIn(o.img, 200);

		// Text 2
		self.add({
			id:"text2", type:"TextBox",
			x:228, y:402, width:500,
			align:"center", color:"#aaa", size:14,
			text_id:"outro_2_credits"
		});
		_hide(o.text2); _fadeIn(o.text2, 200);

		// Button
		self.add({
			id:"button", type:"Button", x:427, y:466, 
			text_id:"outro_2_btn", size:"short",
			message:"slideshow/scratch"
		});
		_hide(o.button); _fadeIn(o.button, 2000);

	},
	onend: function(self){
		self.clear();
	}
});