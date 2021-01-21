(() => {
    var new_topic_body = new Screen('new_topic_body');

    new_topic_body.onstart = function() {
		let createTopic = document.getElementById('create_topic');
		
		createTopic.onclick = function(e) {
			let title = document.getElementById('title_input').value;
			let content = document.getElementById('new_topic_message_input').value;
			socket.emit("create_topic", {title: title, content: content});
		}
    }

    new_topic_body.onclose = function() {

    }
})();