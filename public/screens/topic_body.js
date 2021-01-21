(() => {
    var topic_body = new Screen('topic_body');

	function updateLikes(id, likes) {
		let likes_html = '';
		
		if (likes <= -2 || likes >= 2) {
			likes_html =  '<font color="' + (likes < 2 ? '#CB546B' : '#2EBA7E') + '">' + (likes < 2 ? '' : '+') + likes + '</font>'
		}

		document.querySelector('#messages > div:nth-child('+(parseInt(id) + 1)+') > div > div.top_message > a.likes.no_text_pass').innerHTML = likes_html;
	}

	function quoteR(msg) {
		let m = msg.split(/&gt; (.+)/);
		
		if (m[1]) {
			return '<span class="quote">' + quoteR(m[1]).replace('&gt;', '') + '</span>'
		} else {
			return msg.replace('&gt;', '')
		}
	}

	function addMessage(message) {
		let messageDiv = document.createElement('div');
		messageDiv.className = 'message ' + (message.view ? 'message-view' : '');
		
		let avatar = document.createElement('img');
		avatar.src = message.avatar;
		avatar.className = "user_photo cant_copy";
		avatar.onclick = function(e) {
			showPlayerMenu(avatar, message.id, e);
		}

		let messageContent = document.createElement('div');
		messageContent.className = 'message_content';
		
		let topMessage = document.createElement('div');
		topMessage.className = 'top_message';

		let username = document.createElement('a');
		let message_username = message.username
		username.className = "message_username no_text_pass" + (message.privLevel > 1 ? ' staff' : '') + (message.privLevel === 2 ? ' staff-moderator' : '')+ (message.privLevel === 3 ? ' staff-administrator' : '')
		if (message.privLevel <= 1)
			username.style.color = message.colorName;

		username.innerHTML = message_username.filterHTML();
		
		
		let likes = document.createElement('a');
		likes.className = "likes no_text_pass cant_copy"
		
		let date = document.createElement('a');
		date.className = "message_date no_text_pass cant_copy";
		date.textContent  = message.date;
		
		topMessage.append(username, likes, date, document.createElement('br'));
		
		let messageText = document.createElement('div');
		messageText.className = 'message_text'
		
		let new_message = message.message.split('\n');

		for (let i in new_message) {
			let msg = new_message[i];
			if (msg.indexOf('&gt;') === 0) {
				new_message[i] = quoteR(msg)
			}
		}

		messageText.innerHTML = new_message.filter(n => {return n && n != ' ' && n != '<span class="quote"> </span>'}).join('<br>')

		messageContent.append(topMessage, messageText);
		messageDiv.append(avatar, messageContent);
		
		return messageDiv;
	}

    topic_body.onstart = function(data, view_count = 0) {
		selected_message = null;
		
		if (privLevel >= 2) {
			document.getElementById('remove').style.display = '';
			document.getElementById('removeAvatar').style.display = '';
		}
		
		window.onclick = function(event) {
			if (!event.target.matches('.user_photo')) {
				removePlayerMenu();
			}
		}
		
		document.getElementById('quote').onclick = function(e) {
			if (selected_message != null) {
				let message = messages[selected_message];
				let message_input = document.getElementById('message_input');
				let msg = message.message.filterXML().unfilterHTML();
				message_input.value = '> @' + message.username + '\n> ' + msg.replace(/\n/g, '\n> ').replace(/^(> )*$/gm, '').replace(/^\s*[\r\n]/gm, '') + '\n\n';
				auto_grow(message_input);
				message_input.focus();
				message_input.setSelectionRange(message_input.value.length, message_input.value.length);
			}
		}
		
		let id = data.id;
		
		document.getElementById('send_message').onclick = function(e) {
			let message = document.getElementById('message_input').value || '';
			if (message.indexOf('\n\n') == message.length - 2)
				message = message.slice(0, -2);
			
			socket.emit("comment", {topicId: parseInt(id), content: message})
		}
		
		document.getElementById('messages').innerHTML = '';
		let messages = [];
		
		document.getElementById('like').onclick = function(e) {
			if (selected_message != null) {
				let message = messages[selected_message];
				socket.emit("like", {topicId: id, id: message.id, liked: true});
			}
		}
		
		document.getElementById('remove').onclick = function(e) {
			if (selected_message != null) {
				let message = messages[selected_message];
				socket.emit("remove_message", {topicId: id, target: message.id});
			}
		}
		
		document.getElementById('removeAvatar').onclick = function(e) {
			if (selected_message != null) {
				let message = messages[selected_message];
				socket.emit("remove_avatar", {target: message.username});
			}
		}
		
		document.getElementById('dislike').onclick = function(e) {
			if (selected_message != null) {
				let message = messages[selected_message];
				socket.emit("like", {topicId: id, id: message.id, liked: false});
			}
		}

		socket.on("like", (data) => {
			updateLikes(data.id - 1, data.likes);
		});

		for (let i in data.messages) {
			let message = data.messages[i];

			let msg = messages.push({
				username: message.username,
				date: message.date,
				message: message.deleted ? '<font color="#e85881">Moderated message</font>' : message.content.filterHTML(),
				avatar: data.userInfo[message.username].avatar,
				colorName: data.userInfo[message.username].colorName,
				likes: message.likes || 10,
				id: message.id,
				privLevel: data.userInfo[message.username].privLevel,
				view: (data.messages.length - parseInt(i)) <= view_count
			});

			document.getElementById('messages').append(addMessage(messages[msg - 1]));
			updateLikes(parseInt(i), message.likes)
		}
		
		auto_grow(document.getElementById('messages'));
    }

    topic_body.onclose = function() {

    }
})();