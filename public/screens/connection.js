(() => {
    var connection_screen = new Screen('connection_screen');
	let interval;

    connection_screen.onstart = function() {
		let count = 0;
		let default_text = connection_screen.element.textContent;
		
		interval = setInterval(() => {
			count++;
			if (count == 4) {
				connection_screen.element.textContent = default_text + '.'
				count = 1;
			} else
				connection_screen.element.textContent += '.';
		}, 1000);
    }

    connection_screen.onclose = function(num) {
        if (interval)
			clearInterval(interval);
    }
})();