var socket;
var privLevel = 0;
var sawTopics = {};
selected_message = null;

String.prototype.filterHTML = function() {
	return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

String.prototype.filterXML = function() {
	return this.replace(/<[^>]*>?/gm, '');
}

String.prototype.unfilterHTML = function() {
	return this.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}

function querystring(key) {
	var re=new RegExp('(?:\\?|&)'+key+'=(.*?)(?=&|$)','gi');
	var r=[], m;
	while ((m=re.exec(document.location.search)) != null) r[r.length]=m[1];
	return r;
}

function auto_grow(element) {
	element.style.height = "24px";
	element.style.height = (element.scrollHeight)+(element.scrollHeight == 22 ? 0 : -1)+"px";
	let e = document.getElementById('topic_body');
	e.scrollTop = e.scrollHeight;
}

function removePlayerMenu() {
	document.getElementById("player_menu").style.visibility = 'hidden';
}

function showPlayerMenu(e, id, event) {
	let menu = document.getElementById("player_menu");

	e.parentNode.parentNode.parentNode.appendChild(menu);
	selected_message = [...e.parentNode.parentElement.childNodes].indexOf(e.parentNode);	

	var X = event.clientX - e.offsetLeft
	var Y = event.clientY - e.offsetTop;

	menu.style.top = Y.toString() + "px";
	menu.style.left = X.toString() + "px";
	menu.style.visibility = "visible";

	var lis = document.querySelectorAll("#player_menu > ul > li");
	for (var i = 0; i < lis.length; i++) {
		lis.item(i).addEventListener("click", function () {
			menu.style.visibility = "hidden";
		});
	}
}

function tryToLogin() {
	socket.emit("login", {userId: localStorage.getItem("userId"), token: localStorage.getItem("token"), community: 'en'});
}

async function main() {
	setLanguage(querystring('lang') || localStorage.getItem("language") || 'pt');
	translateAllElements(self.document.children);
	Screen.updateDefault();
	
	Screen.get('connection_screen').render();
	
	socket = io("/"); // https://br-cafe.herokuapp.com
	socket.on('alert', (data) => {
		alert(data)
	})
	
	socket.on("kick", (reason = '') => {
		Screen.closeAll();
		Screen.get('disconnection_screen').render(reason);
	});
	
	socket.on("login", (data) => {
		Screen.closeAll();

		socket.on("disconnect", () => {
			if (!Screen.get('disconnection_screen')._isVisible) {
				Screen.closeAll();
				Screen.get('disconnection_screen').render();
			}
		});

		if (data.success) { // data.verify
			privLevel = data.privLevel
			
			socket.emit("topics");

			socket.on("topic", (data) => {				
				Screen.get('new_topic_body').close();
				Screen.get('default_topic_body').close();
				Screen.get('topic_body').close();
				Screen.get('topic_body').render(data, sawTopics[data.id] != undefined ? data.len - sawTopics[data.id] : 0);

				sawTopics[data.id] = data.len;
				let topic = document.getElementById('topic ' + data.id)
				topic.classList.add("message-saw")
				topic.querySelector('.topic_count').classList.add("topic_count-saw")

				socket.on("no_topic", (topic) => {
					if (topic === data.id) {
						Screen.get('topic_body').close();
						Screen.get('default_topic_body').render();
					}
				});
			});

			socket.on("topics", data => {
				let topics = document.getElementById('topics');
				topics.innerHTML = '';

				data.sort(function(a, b){
					return new Date(b.lastUpdate) - new Date(a.lastUpdate);
				});
				
				for (let i in data) {
					let topic = data[i];

					let messageBox = document.createElement('div');
					messageBox.className = 'message message_box ' + (sawTopics[topic.id] && (sawTopics[topic.id] == topic.len) ? 'message-saw' : '');
					messageBox.style.height = '48px'
					messageBox.id = 'topic ' + topic.id;
					
					messageBox.onclick = function(e) {
						socket.emit("topic", topic.id);
					}

					let avatar = document.createElement('img');
					avatar.src = topic.avatar;
					avatar.className = "topic_photo cant_copy";

					let titleDiv = document.createElement('div');
					titleDiv.className = "top_message message_text";
					titleDiv.textContent = topic.title

					let secondLine = document.createElement('div');

					let count = document.createElement('div');
					count.className = "topic_count cant_copy " + (sawTopics[topic.id] && (sawTopics[topic.id] == topic.len) ? 'topic_count-saw' : '');;
					count.textContent = topic.len;
					count.style.float = 'left';
					
					let lastComment = document.createElement('div');
					lastComment.className = "last_comment";
					lastComment.textContent = ', ' + topic.lastUser;

					let messageContent = document.createElement('div');
					messageContent.className = 'message_content cant_copy';

					secondLine.append(count, lastComment)
					messageContent.append(titleDiv, secondLine)
					messageBox.append(avatar, messageContent)
					topics.append(messageBox);
				}
				
				Screen.get('cafe_screen').render();
			});
		} else {
			Screen.get('login_screen').render();
		}
	});
	
	tryToLogin();
}

function showError(id, error) {
	let error_message = document.getElementById(id);

	error_message.textContent = getMessage(error);
	error_message.style.display = 'block';
}

// Load Languages

function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}

readTextFile("./lang.json", function(text){
	let messages = JSON.parse(text);
    setMessages(messages);

	main();
});