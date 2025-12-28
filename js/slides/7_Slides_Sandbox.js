SLIDES.push({

	id: "sandbox",
	onstart: function(self){

		// The tournament simulation
		Tournament.resetGlobalVariables();
		self.add({id:"tournament", type:"Tournament", x:-20, y:-20});

		// Screw it, just ALL of the Sandbox UI
		self.add({id:"sandbox", type:"SandboxUI"});

		// Add live reputation meter (top right corner)
		if (window.initSandboxReputation) {
			window.initSandboxReputation(self);
		}

		// Label & Button for next...
		self.add({
			id:"label_next", type:"TextBox",
			x:55, y:481, width:535, align:"right",
			text_id: "sandbox_end"
		});
		self.add({
			id:"button_next", type:"Button",
			x:605, y:485, size:"long",
			text_id:"sandbox_end_btn",
			message: "slideshow/next"
		});
		
	},
	onend: function(self){
		// Clean up reputation meter
		if (window.getSandboxReputation) {
			window.getSandboxReputation().destroy();
		}
		self.clear();
	}

});