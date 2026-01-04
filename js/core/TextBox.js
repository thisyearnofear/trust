function TextBox(config){

	var self = this;
	self.id = config.id;

	// Create DOM
	self.dom = document.createElement("div");
	self.dom.className = "object";
	self.dom.classList.add("textbox");

	// Customize
	_configText(config, self.dom);

	// Set Text!
	self.setText = function(words){
		self.dom.innerHTML = words;
	};
	self.setTextID = function(id){
		self.text_id = id;
		var text = Words.get(self.text_id);
		if(text !== undefined) {
			self.setText(text);
		} else {
			// Words not loaded yet, set placeholder and retry when ready
			self.dom.innerHTML = "";
		}
	};
	if(config.text_id) self.setTextID(config.text_id);
	else if(config.text) self.setText(config.text);

	// Add & Remove
	self.add = function(){ _add(self); };
	self.remove = function(){ _remove(self); };

}

function CharacterTextBox(config){

	var self = this;
	self.id = config.id;

	// Create DOM
	self.dom = document.createElement("div");
	self.dom.className = "object";
	self.dom.classList.add("textbox");
	self.dom.classList.add("character");
	self.dom.classList.add(config.character);

	// Customize
	_configText(config, self.dom);

	// Peep
	var peep = document.createElement("div");
	peep.id = "peep";
	peep.setAttribute("char", config.character);
	self.dom.appendChild(peep);

	// Description
	var desc = document.createElement("div");
	desc.id = "desc";
	var charText = Words.get("character_"+config.character);
	if(charText){
		desc.innerHTML = charText;
	} else {
		// Words not loaded yet, retry after delay
		desc.innerHTML = "";
		var retryCount = 0;
		var retryLoad = function(){
			if(retryCount < 20){ // Try up to 20 times
				var text = Words.get("character_"+config.character);
				if(text){
					desc.innerHTML = text;
				} else {
					retryCount++;
					setTimeout(retryLoad, 100);
				}
			}
		};
		setTimeout(retryLoad, 100);
	}
	self.dom.appendChild(desc);

	// Add & Remove
	self.add = function(){ _add(self); };
	self.remove = function(){ _remove(self); };

}