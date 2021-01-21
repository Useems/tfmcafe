(() => {
    var topics_body = new Screen('topics_body');

    topics_body.onstart = function(data) {
		let createNewTopic = document.getElementById('create_new_topic');
		
		createNewTopic.onclick = function(e) {
			Screen.get('new_topic_body').render();
			Screen.get('default_topic_body').close();
			Screen.get('topic_body').close();
		}
    }

    topics_body.onclose = function() {

    }
})();