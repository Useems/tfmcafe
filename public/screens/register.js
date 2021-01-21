(() => {
    var register_screen = new Screen('register_screen');

    register_screen.onstart = function() {
        document.getElementById("goto_login_screen").onclick = function(e) {
            register_screen.hide();
            Screen.get('login_screen').render();
        }
		
        document.getElementById("register_cafe").onclick = function(e) {
			let login = document.getElementById('register_username');
			let password = document.getElementById('register_password');
			let repeatPassword = document.getElementById('register_reapeat_password');
			let avatarUrl = document.getElementById('register_avatar');
			let captcha = document.getElementById('captcha');
			
			if (captcha.style.display == 'none') {
				grecaptcha.reset();
				captcha.style.display = '';
				return
			}
			
			if (password.value != repeatPassword.value) {
				return showError('register_error', 'Password doesn\'t match');
			}
			
			$.ajax({
				url: '/api/user/register',
				type: 'POST',
				contentType: 'application/json; charset=utf-8',
				data: JSON.stringify({ "username": login.value, "password": password.value, "avatar": avatarUrl.value, "captcha": document.querySelector('#g-recaptcha-response').value}),
				dataType: 'json',
				success: function(response) {   
					localStorage.setItem('userId', response.user);
					localStorage.setItem('token', response.token);
					tryToLogin();
				},
				error: function (errormessage) {
					showError('register_error', errormessage.responseText);
					if (document.querySelector('#g-recaptcha-response').value)
						grecaptcha.reset();
				}
			});
        }
    }

    register_screen.onclose = function(num) {
        console.log('Tela de registro fechada, num: ' + num);
    }
})();