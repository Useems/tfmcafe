(() => {
    var cafe_screen = new Screen('cafe_screen');

    cafe_screen.onstart = function(data) {
		document.getElementById('leave').style.display = '';
		Screen.get('topics_body').render(data);
		Screen.get('default_topic_body').render();
    }

    cafe_screen.onclose = function() {

    }
})();