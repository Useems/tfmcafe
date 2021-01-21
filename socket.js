const jwt = require('jsonwebtoken');
const User = require('./model/User');

const permissions = {
	0: 'Guest',
	1: 'Member',
	2: 'Moderator',
	3: 'Administrator'
}

const communities = ['en'];
const default_avatar = 'http://avatars.atelier801.com/0/0.jpg';
const routers = {'login': 'eventLogin', 'topics': 'eventGetTopics', 'create_topic': 'eventCreateTopic', 'comment': 'eventComment', 'topic': 'eventGetTopic', 'like': 'eventLike', 'remove_message': 'eventRemoveMessage', 'remove_avatar': 'eventRemoveAvatar', 'disconnect': 'disconnect'};

var clients = [];
var servers = [];
var users = {};
var lastTopicId = 0;

for (let i in communities) {
	servers[communities[i]] = {
		community: communities[i],
		topics: []
	}
}

class Client {
	constructor(socket, io) {
		this.socket = socket;
		this.io = io;
		this.server = false;
		this.logged = false;
		this.user = false;
		this.privLevel = 0;
		this.id = Math.random();
	}
	
	async eventLogin(data = {}) {
		try {
			if (!data.userId || !data.token)
				this.logged = false;
			else {
				this.user = await User.findOne({_id: data.userId});
				if (this.user)
					this.logged = jwt.verify(data.token, process.env.TOKEN_SECRET, function (err) { return err === null; });
				else
					throw false;
			}
		} catch (err) {
			this.logged = false
		}
		
		if (this.logged) {
			if (!users[this.user.username])
				users[this.user.username] = {
					lastTopic: new Date().getTime() - 1800000,
					lastComment: new Date().getTime() - 20000
				};
			
			let community = data.community ? servers[data.community] ? data.community : 'en' : 'en';

			this.server = servers[community];
			this.socket.join(this.server.community);
			this.privLevel = this.user.privLevel;
			clients.push(this);
		}
		
		this.socket.emit('login', this.logged ? {privLevel: this.privLevel, success: true} : {success: false})
	}
	
	eventGetTopics(data = {}) {
		if (!this.canAccess(0)) return;

		this.socket.emit('topics', this.getTopics());
	}
	
	eventGetTopic(topicId) {
		if (!this.canAccess(0)) return;

		if (topicId === undefined)
			return this.kick('Topic Id required');

		this.socket.emit('topic', this.getTopic(topicId));
	}
	
	eventCreateTopic(data = {}) {
		if (!this.canAccess(1)) return;
		
		let result = this.createTopic(data);
		if (result)
			this.alert(result);
	}
	
	eventComment(data = {}) {
		if (!this.canAccess(1)) return;

		data.content = (data.content ? data.content : '').replace(/ +(?= )/g,'');

		if (data.content.length > 500 || data.content == ' ')
			return this.alert('Wrong format');
		else if (data.content.length < 1)
			return this.alert('Short message!');
		else if(data.content.split(/\r\n|\r|\n/).length > 20)
			return this.alert('So much lines!');

		try {
			let countdown = (new Date().getTime() - users[this.user.username].lastComment) / 1000;

			if(countdown >= 10) {
				this.addComent(data.topicId, data.content);

				this.io.sockets.in(this.server.community).emit('topics', this.getTopics());
				this.socket.emit('topic', this.getTopic(data.topicId));
				users[this.user.username].lastComment = this.user.privLevel > 2 ? users[this.user.username].lastComment : new Date();
			} else {
				this.alert("You must wait 10 seconds before sending a new comment.");
			}	
		} catch (err) {
			this.kick('$fail_comment', err);
		}
	}
	
	async eventRemoveAvatar(data = {}) {
		if (!this.canAccess(2)) return this.kick('$no_permission');
		
		try {
			await User.updateOne({username: data.target}, {
				$set: { avatar: default_avatar, privLevel: 0 }
			});
			
			for (let i in this.server.topics) {
				let topic = this.server.topics[i];
				
				for (let user in topic.userInfo) {
					if (user == data.target) {
						topic.userInfo[user].avatar = default_avatar;
						for (let index in clients) {
							if (clients[index].user.username === data.target) {
								clients[index].user = await User.findOne({username: data.target});
								clients[index].kick("$banned")
							}
						}
					}
				}
			}
			
			this.io.sockets.in(this.server.community).emit('topics', this.getTopics());
		} catch (err) {
			this.kick('$fail_remove_avatar', err);
		}
	}
	
	eventRemoveMessage(data = {}) {
		if (!this.canAccess(2)) return this.kick('$no_permission');
		
		try {
			let topic = this.getTopic(data.topicId);
			let messageIndex = topic.messages.findIndex(e => e.id === data.target);

			if (messageIndex === 0) {
				this.removeTopic(data.topicId);
			}
			
			let message = topic.messages[messageIndex];
			
			message.content = '';
			message.deleted = true;
		} catch (err) {
			this.kick('$fail_remove_message', err);
		}
	}
	
	eventLike(data = {}) {
		if (!this.canAccess(1)) return;
		
		try {
			let topic = this.getTopic(data.topicId);
			let topicIndex = topic.messages.findIndex(e => e.id === data.id);
			let message = topic.messages[topicIndex];
			
			if (!message.likedUsers[this.user.username] && !message.deleted) {
				let sum = (data.liked ? 1 : -1);
				
				if (topicIndex === 0 && message.likes + sum <= -1000) {
					return this.removeTopic(data.topicId);
				}
				
				message.likes += sum;
				message.likedUsers[this.user.username] = this.user.privLevel > 2 ? false : true;
				this.socket.emit('like', {topicId: data.topicId, id: data.id === 0 ? 1 : (50 - (topic.len - (data.id + 1))), likes: message.likes});
			}
			
		} catch (err) {
			this.kick('$invalid_params', err);
		}
	}
	
	createTopic(data) {
		try {
			if (data.title.length === 0 || data.title.length > 50 || data.content.length === 0 || data.content.length > 2500)
				return 'Wrong format';
			
			let countdown = (new Date().getTime() - users[this.user.username].lastTopic) / 1000;
			lastTopicId++;
	
			if (countdown >= 1800) {
				let topicId = this.server.topics.push({
					id: lastTopicId,
					title: data.title,
					owner: this.user.username,
					userInfo: {[this.user.username]: {avatar: this.user.avatar, privLevel: this.user.privLevel, colorName: this.user.colorName}},
					messages: [],
					len: 0,
					date: this.getDate()
				});

				let id = this.server.topics[topicId - 1].id;
				this.addComent(id, data.content);
				this.io.sockets.in(this.server.community).emit('topics', this.getTopics());
				this.socket.emit('topic', this.getTopic(id));
				users[this.user.username].lastTopic = this.user.privLevel > 2 ? users[this.user.username].lastTopic : new Date();
			} else {
				return 'You must wait 30 minutes before creating a new topic.';
			}
		} catch(err) {
			this.kick('$fail_create_topic', err)
		}
	}
	
	getTopics() {
		try {
			let return_data = [];
			for (let i in this.server.topics) {
				let topic = this.server.topics[i];

				if (topic.len > 0)
					return_data.push({
						title: topic.title,
						id: topic.id,
						len: topic.len,
						avatar: topic.userInfo[topic.messages[0].username].avatar,
						lastUser: topic.messages[topic.messages.length - 1].username,
						lastUpdate: topic.messages[topic.messages.length - 1].timestamp
					});
			}
			
			return return_data;
		} catch (err) {
			this.kick('$fail_get_topics', err);
		}
	}
	
	getTopic(topicId) {
		try {
			let topicIndex = this.server.topics.findIndex(e => e.id === topicId);
			return topicIndex != -1 ? this.server.topics[topicIndex] : false;
		} catch (err) {
			this.kick('$fail_get_topic', err);
		}
	}
	
	removeTopic(topicId) {
		try {
			let topicIndex = this.server.topics.findIndex(e => e.id === topicId);
			this.server.topics.splice(topicIndex, 1);
			this.io.sockets.in(this.server.community).emit('topics', this.getTopics());
			this.io.sockets.in(this.server.community).emit('no_topic', topicId);
		} catch (err) {
			this.kick('$fail_remove_topic', err);
		}
	}
	
	addComent(topicId, message) {
		let topic = this.getTopic(topicId);
		topic.userInfo[this.user.username] = {avatar: this.user.avatar, privLevel: this.user.privLevel, colorName: this.user.colorName}
		
		topic.messages.push({
			id: topic.len,
			likes: 0,
			content: message,
			username: this.user.username,
			date: this.getDate(),
			timestamp: new Date().getTime(),
			likedUsers: [],
			deleted: false
		});
		
		topic.len++;

		if (topic.messages.length > 50) {
			topic.messages = [topic.messages[0], ...topic.messages.slice(-49)];
		}

	}
	
	alert(message = '') {
		this.socket.emit('alert', message);
	}
	
	getDate() {
		return new Date().toLocaleString('pt-BR', {timeZone: process.env.TIMEZONE})
	}
	
	canAccess(priv = 0, disconnectIfNot = false) {
		if (!this.logged)
			return this.kick('$no_login');

		if (this.privLevel >= priv) {
			return true;
		} else if (disconnectIfNot) {
			return this.kick('$no_permission');
		}
		
		return false;
	}
	
	kick(reason = '$no_reason', err = '') {
		if (err)
			console.log(err)

		this.socket.emit('kick', reason);
		this.socket.disconnect(0);
	}
	
	disconnect() {
		let user_index = clients.findIndex(e => e.id === this.id);
		
		if (clients[user_index])
			clients.splice(user_index, 1);
	}
}

module.exports = (io) => {
	let cafe_socket = io.of('/');
	
	cafe_socket.on('connection', function(socket) {
		let client = new Client(socket, io);
		
		for (let i in routers)
			socket.on(i, (data) => client[routers[i]](data));
	});
}