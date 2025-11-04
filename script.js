document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');

    // Alternar entre login e cadastro
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

    // --- UTILITÁRIOS ---
    function saveUserToLocal(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        sessionStorage.setItem('currentUser', JSON.stringify(user));
    }
    function findUserByEmail(email) {
        const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
        return users.find(u => u.email === email);
    }
    function saveNewUser(user) {
        const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
        users.push(user);
        localStorage.setItem('registeredUsers', JSON.stringify(users));
    }

    // --- LOGIN ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loginError.textContent = '';

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (!email || !password) {
            loginError.textContent = 'Por favor, preencha todos os campos.';
            return;
        }

        const existingUser = findUserByEmail(email);

        if (!existingUser) {
            loginError.textContent = 'Usuário não encontrado.';
            return;
        }

        if (existingUser.password !== password) {
            loginError.textContent = 'Senha incorreta.';
            return;
        }

        // Salva na sessão e redireciona
        saveUserToLocal(existingUser);
        console.log('Usuário logado:', existingUser.email);
        window.location.href = 'dashboard.html';
    });

    // --- CADASTRO ---
    registerForm.addEventListener('submit', (e) => {
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

        if (findUserByEmail(email)) {
            registerError.textContent = 'Este e-mail já está cadastrado.';
            return;
        }

        const newUser = { name, email, dob, password };
        saveNewUser(newUser);
        saveUserToLocal(newUser);

        alert('Cadastro realizado com sucesso! Faça seu login.');
        registerForm.reset();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });
});
