// Importa os pacotes que instalamos
const express = require('express');
const path = require('path');
const { Pool } = require('pg'); // Driver do PostgreSQL
const bcrypt = require('bcryptjs'); // Para hashear senhas

// Cria o aplicativo Express
const app = express();
app.use(express.json()); // Permite que o servidor entenda JSON

// --- 1. Conexão com o Banco de Dados do Railway ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// --- 2. Servir os Arquivos do Front-end ---
app.use(express.static(path.join(__dirname, '/')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));

// --- 3. Helper: Pegar ID do usuário a partir do email ---
// O front-end vai enviar o email em um header 'X-User-Email'
// Esta não é uma prática segura para produção (use JWTs!), mas funciona para este projeto.
const getUserIdFromEmail = async (email) => {
    if (!email) return null;
    try {
        const res = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        return res.rows[0]?.id;
    } catch {
        return null;
    }
};

// --- 4. Rotas da API de Autenticação e Perfil ---

// API de Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    const user = result.rows[0];

    // Compara a senha enviada com o hash salvo no banco
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Senha incorreta' });
    }
    
    // Retorna o usuário (sem a senha)
    res.json({ 
        message: 'Login com sucesso', 
        user: { name: user.name, email: user.email } // O front-end já usa isso
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// API de Cadastro
app.post('/api/register', async (req, res) => {
    const { name, email, dob, password } = req.body;
    try {
        // Gera o "sal" e "hash" da senha
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);

        const newUser = await pool.query(
            'INSERT INTO users (name, email, dob, password) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
            [name, email, dob, hash] // Salva o HASH, não a senha
        );
        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Erro de violação de constraint (email duplicado)
            return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
        }
        res.status(500).json({ message: 'Erro ao cadastrar' });
    }
});

// API de Atualizar Perfil
app.put('/api/profile', async (req, res) => {
    const email = req.headers['x-user-email'];
    const { name, currentPass, newPass, confirmPass } = req.body;
    
    const userId = await getUserIdFromEmail(email);
    if (!userId) return res.status(401).json({ message: 'Usuário não autorizado' });

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];

        // Se o usuário quer mudar a senha
        if (currentPass || newPass || confirmPass) {
            if (!bcrypt.compareSync(currentPass, user.password)) {
                return res.status(401).json({ message: 'Senha atual incorreta.' });
            }
            if (newPass.length < 6) {
                return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres.' });
            }
            if (newPass !== confirmPass) {
                return res.status(400).json({ message: 'As novas senhas não coincidem.' });
            }
            
            // Hash da nova senha
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(newPass, salt);
            
            await pool.query('UPDATE users SET name = $1, password = $2 WHERE id = $3', [name, hash, userId]);
        } else {
            // Se quer mudar só o nome
            await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, userId]);
        }
        
        res.json({ message: 'Perfil atualizado com sucesso!', user: { name: name, email: email } });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao atualizar perfil' });
    }
});

// API de Excluir Conta
app.delete('/api/profile', async (req, res) => {
    const email = req.headers['x-user-email'];
    const userId = await getUserIdFromEmail(email);
    if (!userId) return res.status(401).json({ message: 'Usuário não autorizado' });
    
    try {
        // Graças ao "ON DELETE CASCADE" no SQL, excluir o usuário
        // irá excluir automaticamente todas as suas tarefas e categorias.
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        res.status(200).json({ message: 'Conta excluída com sucesso.' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao excluir conta' });
    }
});


// --- 5. Rotas da API de Tarefas (CRUD) ---

// GET (Pegar todas as tarefas do usuário)
app.get('/api/tasks', async (req, res) => {
    const email = req.headers['x-user-email'];
    const userId = await getUserIdFromEmail(email);
    if (!userId) return res.status(401).json({ message: 'Usuário não autorizado' });

    try {
        const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY due_date ASC', [userId]);
        // Separa as tarefas em 'todo' e 'completed' para o front-end
        const todo = result.rows.filter(t => !t.completed);
        const completed = result.rows.filter(t => t.completed);
        res.json({ todo, completed });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar tarefas' });
    }
});

// POST (Criar nova tarefa)
app.post('/api/tasks', async (req, res) => {
    const email = req.headers['x-user-email'];
    const userId = await getUserIdFromEmail(email);
    if (!userId) return res.status(401).json({ message: 'Usuário não autorizado' });
    
    const { name, desc, dueDate, priority, category, time } = req.body;
    
    try {
        const newTask = await pool.query(
            'INSERT INTO tasks (name, desc, due_date, priority, category, time, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, desc || null, dueDate || null, priority, category || null, time || null, userId]
        );
        res.status(201).json(newTask.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao criar tarefa' });
    }
});

// PUT (Atualizar tarefa - para Edição ou Marcar como Concluída/Desfeita)
app.put('/api/tasks/:id', async (req, res) => {
    const email = req.headers['x-user-email'];
    const userId = await getUserIdFromEmail(email);
    const { id } = req.params;
    
    // O body pode conter a tarefa inteira (edição) ou só { completed: true } (toggle)
    const { name, desc, dueDate, priority, category, time, completed } = req.body;

    try {
        // Pega a tarefa atual
        const currentTaskResult = await pool.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [id, userId]);
        if (currentTaskResult.rows.length === 0) {
            return res.status(404).json({ message: 'Tarefa não encontrada ou não pertence a você.' });
        }
        const currentTask = currentTaskResult.rows[0];

        // Atualiza os campos: usa o valor novo se existir, senão mantém o antigo
        const updatedTask = await pool.query(
            `UPDATE tasks SET 
                name = $1, desc = $2, due_date = $3, priority = $4, category = $5, time = $6, completed = $7 
            WHERE id = $8 AND user_id = $9 RETURNING *`,
            [
                name !== undefined ? name : currentTask.name,
                desc !== undefined ? desc : currentTask.desc,
                dueDate !== undefined ? dueDate : currentTask.due_date,
                priority !== undefined ? priority : currentTask.priority,
                category !== undefined ? category : currentTask.category,
                time !== undefined ? time : currentTask.time,
                completed !== undefined ? completed : currentTask.completed,
                id,
                userId
            ]
        );
        res.json(updatedTask.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao atualizar tarefa' });
    }
});

// DELETE (Excluir tarefa)
app.delete('/api/tasks/:id', async (req, res) => {
    const email = req.headers['x-user-email'];
    const userId = await getUserIdFromEmail(email);
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Tarefa não encontrada ou não pertence a você.' });
        }
        res.status(200).json({ message: 'Tarefa excluída' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao excluir tarefa' });
    }
});


// --- 6. Rotas da API de Categorias (CRUD) ---

// GET (Pegar categorias do usuário)
app.get('/api/categories', async (req, res) => {
    const email = req.headers['x-user-email'];
    const userId = await getUserIdFromEmail(email);
    if (!userId) return res.status(401).json({ message: 'Usuário não autorizado' });

    try {
        const result = await pool.query('SELECT * FROM categories WHERE user_id = $1 ORDER BY name ASC', [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar categorias' });
    }
});

// POST (Criar categoria)
app.post('/api/categories', async (req, res) => {
    const email = req.headers['x-user-email'];
    const userId = await getUserIdFromEmail(email);
    if (!userId) return res.status(401).json({ message: 'Usuário não autorizado' });
    
    const { name, color } = req.body;
    try {
        const newCategory = await pool.query(
            'INSERT INTO categories (name, color, user_id) VALUES ($1, $2, $3) RETURNING *',
            [name, color, userId]
        );
        res.status(201).json(newCategory.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao criar categoria' });
    }
});

// PUT (Atualizar categoria)
app.put('/api/categories/:id', async (req, res) => {
    const email = req.headers['x-user-email'];
    const userId = await getUserIdFromEmail(email);
    const { id } = req.params;
    const { name, color } = req.body;
    
    try {
        const updatedCategory = await pool.query(
            'UPDATE categories SET name = $1, color = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
            [name, color, id, userId]
        );
        if (updatedCategory.rowCount === 0) {
            return res.status(404).json({ message: 'Categoria não encontrada.' });
        }
        res.json(updatedCategory.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao atualizar categoria' });
    }
});

// DELETE (Excluir categoria)
app.delete('/api/categories/:id', async (req, res) => {
    const email = req.headers['x-user-email'];
    const userId = await getUserIdFromEmail(email);
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Categoria não encontrada.' });
        }
        res.status(200).json({ message: 'Categoria excluída' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao excluir categoria' });
    }
});


// --- 7. Iniciar o Servidor ---
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});