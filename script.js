document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    loginForm.addEventListener('submit', async (e) => { 
        e.preventDefault();
        loginError.textContent = '';

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (!email || !password) {
            loginError.textContent = 'Por favor, preencha todos os campos.';
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json(); 

            if (!response.ok) {
                loginError.textContent = data.message || 'Erro desconhecido.';
                return;
            }


            sessionStorage.setItem('currentUser', JSON.stringify(data.user));
            
            console.log('Usuário logado:', data.user.email);
            window.location.href = 'dashboard.html'; 

        } catch (err) {
            console.error('Erro de fetch no login:', err);
            loginError.textContent = 'Não foi possível conectar ao servidor.';
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerError.textContent = '';

        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const dob = document.getElementById('reg-dob').value.trim();
        const password = document.getElementById('reg-password').value.trim();
        const confirmPassword = document.getElementById('reg-confirm-password').value.trim();

        if (!name || !email || !dob || !password || !confirmPassword) {
            registerError.textContent = 'Por favor, preencha todos os campos.';
            return;
        }

        if (password !== confirmPassword) {
            registerError.textContent = 'As senhas não coincidem.';
            return;
        }

        if (password.length < 6) {
            registerError.textContent = 'A senha deve ter pelo menos 6 caracteres.';
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, dob, password })
            });

            const data = await response.json();

            if (!response.ok) {
                registerError.textContent = data.message || 'Erro ao cadastrar.';
                return;
            }

            alert('Cadastro realizado com sucesso! Faça seu login.');
            registerForm.reset();
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');

        } catch (err) {

            console.error('Erro de fetch no cadastro:', err);
            registerError.textContent = 'Não foi possível conectar ao servidor.';
        }
    });
});