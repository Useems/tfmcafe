(() => {
    var login_screen = new Screen('login_screen');

    login_screen.onstart = function() {
        document.getElementById("goto_register_screen").onclick = function(e) {
            login_screen.close();
            Screen.get('register_screen').render();
        }
		
        document.getElementById("join_cafe").onclick = function(e) {
			let username = document.getElementById('login_username');
			let password = document.getElementById('login_password');
			
			$.ajax({
				url: '/api/user/login',
				type: 'POST',
				contentType: 'application/json; charset=utf-8',
				data: JSON.stringify({"username": username.value, "password": password.value}),
				dataType: 'json',
				success: function(response) {   
					localStorage.setItem('userId', response.user);
					localStorage.setItem('token', response.token);
					tryToLogin();
				},
				error: function (errormessage) {
					showError('login_error', errormessage.responseText);
				}
			});	
        }
    }
    
    login_screen.onclose = function(num) {
        console.log('Tela de login fechada, num: ' + num);
    }
})();