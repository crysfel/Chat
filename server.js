/**
 *	@author Crysfel Villa
 *	@date	Jan 6, 2011
 *
 **/

var http = require('http'),
	sys  = require('sys'),
	fs   = require('fs'),
	io   = require('socket.io'),
	Connect = require('connect');

var Server = {
	
	init	: function(){
		var me = this;
		
		this.server = Connect.createServer(
			//Connect.logger(), // Log responses to the terminal using Common Log Format.
			//Connect.conditionalGet(), // Add HTTP 304 responses to save even more bandwidth.
			//Connect.cache(), // Add a short-term ram-cache to improve performance.
			//Connect.gzip(), // Gzip the output stream when the browser wants it.
			Connect.static(__dirname + "webapp") // Serve all static files in the current dir.
		);
		
		this.socket = io.listen(this.server);
		this.socket.addListener("connection", function(client){
			me.onConnection(client);
		});
	},
	
	start	: function(port){
		this.server.listen(port);
		console.log("Server started at 8080");
	},
	
	onConnection	: function(client) {
		var user,
			me = this;
		client.addListener("message", function(message) {
			if (!user) {
				user = message;
				Chat.userMap[user.username] = {username:user.username,email:user.email};
				client.send({ message: 'Server: Welcome, ' + user.username + '! please be nice with other people.', username: 'Server', email: '' });
				me.socket.broadcast({
					users		: Chat.getUsers(),
					updateList	: true
				});
				return;
			}
			var response = {
				"username"	: user.username,
				"email"		: user.email,
				"message"	: message.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
			};
			me.socket.broadcast(response);
		});

		client.addListener("disconnect",function(){
			if(user && user.username){
				delete Chat.userMap[user.username];
				me.socket.broadcast({
					users		: Chat.getUsers(),
					updateList	: true
				});
			}
		});
	}
}

var Chat = {
	userMap: {},
	
	getUsers	: function(){
		var list = [];
		for(var key in this.userMap){
			list.push(this.userMap[key]);
		}
		return list;
	}
}

Server.init();
Server.start(process.env.PORT || 8001);