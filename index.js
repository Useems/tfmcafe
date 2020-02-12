const messages = document.getElementById('messages');

function showPlayerMenu(e, id, event) {
	var menu = document.getElementById("player-menu");
	e.parentNode.parentNode.parentNode.appendChild(menu);

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
	username.className = "message-username no-text-pass"
	if (message.username.indexOf('#') != -1)
		message.username = message.username.slice(0, message.username.indexOf('#')) + '<font color="#606090" size="0">' + message.username.slice(message.username.indexOf('#')) + '</font>';
	username.innerHTML  = message.username;
	
	let date = document.createElement('a');
	date.className = "message-date no-text-pass";
	date.textContent  = message.timestamp;
	
	topMessage.append(username, date, document.createElement('br'));
	
	let messageText = document.createElement('div');
	messageText.className = 'message-text'
	messageText.textContent  = message.message
	
	messageContent.append(topMessage, messageText);
	messageDiv.append(avatar, messageContent);
	messages.append(messageDiv);
}

function loadMessages(list) {
	messages.innerHTML = '';

	for (let i in list) {
		let message = list[i];
		addMessage({
			username: message.username,
			timestamp: message.timestamp,
			message: message.message,
			userId: message.userId,
			id: message.id
		});	
	}
}

function removePlayerMenu() {
	document.getElementById("player-menu").style.visibility = 'hidden';
}

function auto_grow(element) {
    element.style.height = "24px";
    element.style.height = (element.scrollHeight)+"px";
	let e = document.getElementById('topic-body');
	e.scrollTop = e.scrollHeight;
}

window.addEventListener("resize", removePlayerMenu);

window.onclick = function(event) {
	if (!event.target.matches('.user-photo')) {
		removePlayerMenu();
	}
}

document.getElementById('send-message').onclick = function(e) {
	let message = document.getElementById('message-input');

	if (message.value != '') {
		addMessage({
			username: "Guest#0000",
			timestamp: '10:00',
			message: message.value,
			userId: 47995355,
			id: 1
		});
		
		message.value = '';
		auto_grow(message);
	}
}

loadMessages([{
	username: "Café staff",
	timestamp: '00:00',
	message: 'Bem-vindo(a) ao café! Essa é uma versão de testes.',
	userId: 47995355,
	id: 1
}]);