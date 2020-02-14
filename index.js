screens_functions = null;

String.prototype.filterHTML = function() {
	return this.replace(/<[^>]*>?/gm, '');
}

function auto_grow(element) {
	element.style.height = "24px";
	element.style.height = (element.scrollHeight)+(element.scrollHeight == 22 ? 0 : 3)+"px";
	let e = document.getElementById('topic-body');
	e.scrollTop = e.scrollHeight;
}

function updateLikes(id, likes) {
	likes_html = '';
	
	if (likes <= -2 || likes >= 2) {
		likes_html =  '<font color="' + (likes < 2 ? '#CB546B' : '#2EBA7E') + '">' + (likes < 2 ? '' : '+') + likes + '</font>'
	}
	
	document.querySelector('#messages > div:nth-child('+(id + 1)+') > div > div.top-message > a.likes.no-text-pass').innerHTML = likes_html;
}

(() => {
	let messages = [];
	let selected_message = null;
	const username_input = document.getElementById('login-username');
	const password_input = document.getElementById('login-password');
	const login_button = document.getElementById('login-button');
	const menu = document.getElementById("player-menu");

	var username = '';

	password_input.addEventListener("keydown", function(event) {
		if (event.key === "Enter")
			login_button.click();
	});

	screens_functions = {
		'cafe': [function(msgs) {
			window.addEventListener("resize", removePlayerMenu);

			window.onclick = function(event) {
				if (!event.target.matches('.user-photo')) {
					removePlayerMenu();
				}
			}
			
			document.getElementById('like').onclick = function(e) {
				if (selected_message != null) {
					let likes = ++messages[selected_message].likes;
					updateLikes(selected_message, likes);
				}
			}
			
			document.getElementById('deslike').onclick = function(e) {
				if (selected_message != null) {
					let likes = --messages[selected_message].likes;
					updateLikes(selected_message, likes);
				}
			}
			
			document.getElementById('quote').onclick = function(e) {
				if (selected_message != null) {
					let message = messages[selected_message];
					let message_input = document.getElementById('message-input');
					message_input.value = '> @' + message.username.slice(0, message.username.indexOf('#')) + '\n> ' + message.message + '\n\n';
					auto_grow(message_input);
					message_input.focus();
					message_input.setSelectionRange(message_input.value.length, message_input.value.length);
				}
			}
			
			document.getElementById('send-message').onclick = function(e) {
				let message_input = document.getElementById('message-input');
				message_input.value = message_input.value.filterHTML();
				
				if (message_input.value != '') {
					let msg = messages.push({
						username: username,
						timestamp: Date.now(),
						message: message_input.value,
						userId: 0,
						id: 1,
						likes: 0
					});

					document.getElementById('messages').append(addMessage(messages[msg - 1]));	

					message_input.value = '';
					auto_grow(message_input);
				}
			}
			
			document.getElementById('create-new-topic').onclick = function() {
				screens['topic-body'].close();
				screens['default-topic-body'].close();
				screens['new-topic-body'].render();
			}
			
			screens['topics-body'].render();
			screens['default-topic-body'].render();
		}, function() {
			screens['topics-body'].close();
			screens['topic-body'].close();
		}],
		'login_screen': [function() {
			let self = this;
			
			login_button.onclick = function(e) {
				username = username_input.value + "#0000";

				self.close();

				screens.cafe.render();
			}
		}],
		'new-topic-body': [function() {
			let self = this;

			document.getElementById('create-topic').onclick = function(e) {
				let title_input = document.getElementById('title-input');
				let new_topic_message_input = document.getElementById('new-topic-message-input');

				if (new_topic_message_input.value != '' && title_input.value != '') {
					self.close();

					screens['topic-body'].render([{
						username: username,
						timestamp: Date.now(),
						message: new_topic_message_input.value,
						userId: 0,
						id: 1
					}]);
				}
			};
		}],
		'topic-body': [function(msgs) {
			loadMessages(msgs || []);
		}]
	};

	function showPlayerMenu(e, id, event) {
		e.parentNode.parentNode.parentNode.appendChild(menu);
		selected_message = [...e.parentNode.parentElement.childNodes].indexOf(e.parentNode);	

		var X = event.clientX - e.offsetLeft
		var Y = event.clientY - e.offsetTop;

		menu.style.top = Y.toString() + "px";
		menu.style.left = X.toString() + "px";
		menu.style.visibility = "visible";

		var lis = document.querySelectorAll("#player-menu > ul > li");
		for (var i = 0; i < lis.length; i++) {
			lis.item(i).addEventListener("click", function () {
				menu.style.visibility = "hidden";
			});
		}
	}

	function addMessage(message) {
		let messageDiv = document.createElement('div');
		messageDiv.className = 'message';
		
		let avatar = document.createElement('img');
		avatar.src = "http://avatars.atelier801.com/" + (message.userId % 10000) + "/" + message.userId + ".jpg";
		avatar.className = "user-photo cant-copy";
		avatar.onclick = function(e) {
			showPlayerMenu(avatar, message.id, e);
		}

		let messageContent = document.createElement('div');
		messageContent.className = 'message-content';
		
		let topMessage = document.createElement('div');
		topMessage.className = 'top-message';

		let username = document.createElement('a');
		let message_username = message.username;
		username.className = "message-username no-text-pass"
		if (message.username.indexOf('#') != -1)
			message_username = message.username.slice(0, message.username.indexOf('#')) + '<font color="#606090" size="0">' + message.username.slice(message.username.indexOf('#')) + '</font>';
		username.innerHTML = message_username;
		
		
		let likes = document.createElement('a');
		likes.className = "likes no-text-pass"
		
		let date = document.createElement('a');
		date.className = "message-date no-text-pass";
		date.textContent  = message.timestamp;
		
		topMessage.append(username, likes, date, document.createElement('br'));
		
		let messageText = document.createElement('div');
		messageText.className = 'message-text'
		
		let new_message = message.message.split('\n');
		for (let i in new_message) {
			let msg = new_message[i];

			if (msg.indexOf('>') === 0) {
				new_message[i] = '<span class="quote">' + msg.replace('>', '') + '</span>'
			}
		}
		
		messageText.innerHTML  = new_message.join('<br>')
		
		messageContent.append(topMessage, messageText);
		messageDiv.append(avatar, messageContent);
		
		return messageDiv;
	}

	function loadMessages(list) {
		document.getElementById('messages').innerHTML = '';

		for (let i in list) {
			let message = list[i];
			let msg = messages.push({
				username: message.username,
				timestamp: message.timestamp,
				message: message.message.filterHTML(),
				userId: message.userId,
				id: message.id,
				likes: 0
			});

			document.getElementById('messages').append(addMessage(messages[msg - 1]));	
		}
	}

	function removePlayerMenu() {
		menu.style.visibility = 'hidden';
		auto_grow(menu);
	}

	function handleTyping(e){
		setTimeout(function(){handleTypingDelayed(e)},500);
	}

	function handleTypingDelayed(e){

		var text = document.getElementById('hiddenfield').value;
		var stars = document.getElementById('hiddenfield').value.length;
		unicode = eval(unicode);
		var unicode=e.keyCode? e.keyCode : e.charCode;

		if ( (unicode >=65 && unicode <=90) 
				|| (unicode >=97 && unicode <=122) 
					|| (unicode >=48 && unicode <=57) ){
			text = text+String.fromCharCode(unicode);    
			stars += 1;
		}else{
			stars -= 1;
		}

		document.getElementById('hiddenfield').value = text;
		document.getElementById('field').value = generateStars(stars);
	}

	function generateStars(n){
		var stars = '';
		for (var i=0; i<n;i++){
			stars += '.';
		}
		return stars;
	}

	window.onload = function() {
		screens.login_screen.render();
	}
})();