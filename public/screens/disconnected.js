(() => {
    var disconnection_screen = new Screen('disconnection_screen');
	let interval;

    disconnection_screen.onstart = function(reason) {
		if (reason)
			document.getElementById('disconnection_screen').innerHTML = '<a>'+getMessage('$kicked')+'</a><br><a>'+getMessage(reason)+'</a>'
    }

    disconnection_screen.onclose = function(num) {
        if (interval)
			clearInterval(interval);
    }
})();