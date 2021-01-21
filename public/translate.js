(function(self) {
	var translate_messages = {};
	const checkElements = ['textContent', 'placeholder'];
	
	let current_language = 'en';

	self.setLanguage = function(language = 'en') {
		if (!translate_messages[language])
			return;
		
		current_language = language;
	}

	self.getMessage = function(message) {
		return message ? (translate_messages[current_language][message.slice(1)] || translate_messages['en'][message.slice(1)] || message) : '';
	}
	
	self.translateAllElements = function(elements) {
		
		for (let i in elements) {
			let e = elements[i];
			
			for (let a in checkElements) {
				let name = checkElements[a];
				
				if (e[name]) {
					if (e[name].indexOf('$') === 0 && e[name].indexOf(' ') === -1) {
						
						e[name] = self.getMessage(e[name]);
					}
				}
			}
			
			if (e.children)
				self.translateAllElements(e.children);
		}
	}
	
	self.setMessages = function(messages = []) {
		translate_messages = messages;
	}
})(this);