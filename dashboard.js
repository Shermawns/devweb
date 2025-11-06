document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Seleção dos Elementos  ---
  const todoList = document.getElementById('todo-list');
  const completedList = document.getElementById('completed-list');
  const openModalBtn = document.getElementById('open-add-modal-btn');

  // Modal de TAREFAS
  const taskModal = document.getElementById('task-modal');
  const taskModalTitle = document.getElementById('modal-title');
  const closeTaskModalBtn = document.getElementById('close-modal-btn');
  const cancelTaskModalBtn = document.getElementById('cancel-modal-btn');
  const taskForm = document.getElementById('task-detail-form');

  // Campos do Modal de TAREFAS
  const taskIdInput = document.getElementById('task-id-input');
  const taskNameInput = document.getElementById('task-name');
  const taskDescInput = document.getElementById('task-desc');
  const taskDueDateInput = document.getElementById('task-due-date');
  const taskPriorityInput = document.getElementById('task-priority');
  const taskCategorySelect = document.getElementById('task-category');
  const taskTimeInput = document.getElementById('task-time');
  const taskFormFields = [
    taskNameInput, taskDescInput, taskDueDateInput, taskPriorityInput, taskCategorySelect, taskTimeInput
  ];

  // Modal de CATEGORIAS
  const categoryModal = document.getElementById('category-modal');
  const openCategoryModalBtn = document.getElementById('open-category-modal-btn');
  const closeCategoryModalBtn = document.getElementById('close-category-modal-btn');
  const categoryForm = document.getElementById('category-form');
  const categoryIdInput = document.getElementById('category-id-input');
  const categoryNameInput = document.getElementById('category-name-input');
  const categoryColorInput = document.getElementById('category-color-input');
  const categoryList = document.getElementById('category-list');
  const cancelCategoryEditBtn = document.getElementById('cancel-category-edit-btn');

  // Modal de PERFIL
  const profileModal = document.getElementById('profile-modal');
  const openProfileModalBtn = document.getElementById('open-profile-modal-btn');
  const closeProfileModalBtn = document.getElementById('close-profile-modal-btn');
  const profileForm = document.getElementById('profile-form');
  const profileNameInput = document.getElementById('profile-name');
  const profileEmailInput = document.getElementById('profile-email');
  const profilePassCurrent = document.getElementById('profile-pass-current');
  const profilePassNew = document.getElementById('profile-pass-new');
  const profilePassConfirm = document.getElementById('profile-pass-confirm');
  const profileMessage = document.getElementById('profile-message');
  const deleteAccountBtn = document.getElementById('delete-account-btn');

  // --- 2. Funções do Modal de TAREFAS (Não muda) ---
  function openTaskModal() { taskModal.classList.remove('hidden'); }
  function closeTaskModal() {
    taskModal.classList.add('hidden');
    taskForm.reset();
    taskIdInput.value = '';
    taskForm.classList.remove('is-view-only');
    taskFormFields.forEach(field => field.disabled = false);
  }
  openModalBtn.addEventListener('click', () => {
    taskModalTitle.textContent = 'Nova Tarefa';
    taskForm.reset();
    taskIdInput.value = '';
    taskForm.classList.remove('is-view-only');
    taskFormFields.forEach(field => field.disabled = false);
    populateCategorySelect(); // Agora é async, mas ok
    openTaskModal();
  });
  closeTaskModalBtn.addEventListener('click', closeTaskModal);
  cancelTaskModalBtn.addEventListener('click', closeTaskModal);
  taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) closeTaskModal();
  });

  // --- 3. Funções do Modal de CATEGORIAS (Não muda) ---
  function openCategoryModal() { categoryModal.classList.remove('hidden'); }
  function closeCategoryModal() {
    categoryModal.classList.add('hidden');
    categoryForm.reset();
    categoryIdInput.value = '';
    populateCategorySelect(); // Atualiza o <select> no modal de tarefas
  }
  openCategoryModalBtn.addEventListener('click', (e) => {
    e.preventDefault();
    renderCategories();
    openCategoryModal();
  });
  closeCategoryModalBtn.addEventListener('click', closeCategoryModal);
  cancelCategoryEditBtn.addEventListener('click', (e) => {
    e.preventDefault();
    categoryForm.reset();
    categoryIdInput.value = '';
  });
  categoryModal.addEventListener('click', (e) => {
    if (e.target === categoryModal) closeCategoryModal();
  });

  // --- 4. Funções do Modal de PERFIL (Não muda) ---
  function openProfileModal() { profileModal.classList.remove('hidden'); }
  function closeProfileModal() {
    profileModal.classList.add('hidden');
    profileForm.reset();
    profileMessage.textContent = '';
    profileMessage.className = 'profile-message';
  }
  openProfileModalBtn.addEventListener('click', () => {
    loadProfileData();
    openProfileModal();
  });
  closeProfileModalBtn.addEventListener('click', closeProfileModal);
  profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) closeProfileModal();
  });

  // --- 5. Funções de Usuário e API ---
  
  // Pega o usuário do sessionStorage (salvo no login)
  function getCurrentUser() {
    try {
      const user = JSON.parse(sessionStorage.getItem('currentUser'));
      if (user && user.email) {
          return user;
      }
    } catch (e) { /* ignora */ }
    
    // Se não achar, desloga
    alert('Sessão inválida. Por favor, faça login novamente.');
    window.location.href = 'index.html';
    return null;
  }

  // Cria os headers de autenticação para todas as chamadas de API
  function getAuthHeaders() {
      const user = getCurrentUser();
      if (!user) return null;
      return {
          'Content-Type': 'application/json',
          'X-User-Email': user.email // Header customizado para identificar o usuário
      };
  }

  // --- 6. Lógica CRUD de PERFIL (REFEITA COM API) ---
  function loadProfileData() {
    const user = getCurrentUser();
    if (!user) return;
    
    profileNameInput.value = user.name;
    profileEmailInput.value = user.email;
    profilePassCurrent.value = '';
    profilePassNew.value = '';
    profilePassConfirm.value = '';
    profileMessage.textContent = '';
    profileMessage.className = 'profile-message';
  }

  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user) return;

    const body = {
      name: profileNameInput.value.trim() || user.name,
      currentPass: profilePassCurrent.value,
      newPass: profilePassNew.value,
      confirmPass: profilePassConfirm.value
    };
    
    profileMessage.textContent = '';
    profileMessage.className = 'profile-message';

    try {
      const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(body)
      });
      
      const data = await response.json();

      if (!response.ok) {
          profileMessage.textContent = data.message;
          profileMessage.classList.add('error');
          return;
      }

      // Atualiza o usuário salvo na sessionStorage
      sessionStorage.setItem('currentUser', JSON.stringify(data.user));

      profileMessage.textContent = 'Perfil atualizado com sucesso!';
      profileMessage.classList.add('success');
      setTimeout(closeProfileModal, 1500);

    } catch (err) {
      profileMessage.textContent = 'Erro de conexão ao atualizar perfil.';
      profileMessage.classList.add('error');
    }
  });

  deleteAccountBtn.addEventListener('click', async () => {
    const confirmText = prompt('Esta ação é irreversível e apagará TODA sua conta, tarefas e categorias do servidor.\n\nPara confirmar, digite "EXCLUIR" em maiúsculas.');
    if (confirmText !== 'EXCLUIR') {
      alert('Ação cancelada.');
      return;
    }

    try {
      const response = await fetch('/api/profile', {
          method: 'DELETE',
          headers: getAuthHeaders()
      });

      if (!response.ok) {
          const data = await response.json();
          alert(`Erro ao excluir conta: ${data.message}`);
          return;
      }
      
      sessionStorage.clear();
      localStorage.clear(); // Limpa tudo
      alert('Conta excluída com sucesso.');
      window.location.href = 'index.html';

    } catch (err) {
      alert('Erro de conexão ao excluir conta.');
    }
  });

  // --- 7. Lógica CRUD de CATEGORIAS (REFEITA COM API) ---
  async function renderCategories() {
    try {
      const response = await fetch('/api/categories', { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Falha ao buscar categorias');
      
      const categories = await response.json();
      
      categoryList.innerHTML = '';
      if (categories.length === 0) {
        categoryList.innerHTML = '<li class="empty-list">Nenhuma categoria salva.</li>';
        return;
      }
      categories.forEach(cat => {
        const li = document.createElement('li');
        li.dataset.id = cat.id; // Agora usa o ID do banco
        li.innerHTML = `
          <span class="category-color-preview" style="background-color: ${cat.color};"></span>
          <span class="category-name">${cat.name}</span>
          <div class="task-actions">
            <button class="action-btn edit-btn" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="action-btn delete-btn" title="Excluir"><i class="fas fa-trash"></i></button>
          </div>
        `;
        categoryList.appendChild(li);
      });
    } catch (err) {
      categoryList.innerHTML = '<li class="empty-list">Erro ao carregar categorias.</li>';
    }
  }

  categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const catData = {
      name: categoryNameInput.value.trim(),
      color: categoryColorInput.value
    };
    if (catData.name === '') return;
    
    const catId = categoryIdInput.value;
    const method = catId ? 'PUT' : 'POST';
    const url = catId ? `/api/categories/${catId}` : '/api/categories';

    try {
      const response = await fetch(url, {
          method: method,
          headers: getAuthHeaders(),
          body: JSON.stringify(catData)
      });
      if (!response.ok) throw new Error('Falha ao salvar categoria');
      
      renderCategories(); // Recarrega a lista
      categoryForm.reset();
      categoryIdInput.value = '';

    } catch (err) {
      alert('Erro ao salvar categoria.');
    }
  });

  categoryList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.action-btn');
    if (!btn) return;
    const li = btn.closest('li');
    const catId = li.dataset.id;
    
    if (btn.classList.contains('delete-btn')) {
      if (confirm('Tem certeza que deseja excluir esta categoria?')) {
        try {
          await fetch(`/api/categories/${catId}`, { method: 'DELETE', headers: getAuthHeaders() });
          renderCategories(); // Recarrega a lista
        } catch (err) {
          alert('Erro ao excluir categoria.');
        }
      }
    }
    
    if (btn.classList.contains('edit-btn')) {
      // Pega os dados direto do DOM para evitar outra chamada de API
      const name = li.querySelector('.category-name').textContent;
      const color = li.querySelector('.category-color-preview').style.backgroundColor;
      
      categoryIdInput.value = catId;
      categoryNameInput.value = name;
      categoryColorInput.value = rgbToHex(color); // Converte 'rgb(r, g, b)' para '#hex'
    }
  });

  async function populateCategorySelect() {
    try {
      const response = await fetch('/api/categories', { headers: getAuthHeaders() });
      const categories = await response.json();
      
      const currentVal = taskCategorySelect.value;
      taskCategorySelect.innerHTML = '<option value="">Nenhuma</option>';
      categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name; // Salva o NOME (ou ID, se preferir)
        option.textContent = cat.name;
        taskCategorySelect.appendChild(option);
      });
      taskCategorySelect.value = currentVal;
    } catch (err) {
      // falha silenciosa
    }
  }

  // --- 8. Lógica CRUD de TAREFAS (REFEITA COM API) ---
  async function renderTasks() {
    try {
      const response = await fetch('/api/tasks', { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Falha ao buscar tarefas');
      
      const { todo, completed } = await response.json();
      
      todoList.innerHTML = '';
      completedList.innerHTML = '';
      
      todo.forEach(task => {
        const taskEl = createTaskElement(task, false);
        todoList.appendChild(taskEl);
      });
      completed.forEach(task => {
        const taskEl = createTaskElement(task, true);
        completedList.appendChild(taskEl);
      });
    } catch (err) {
      todoList.innerHTML = '<li class="empty-list">Erro ao carregar tarefas.</li>';
    }
  }

  function createTaskElement(taskObject, isCompleted) {
    const taskItem = document.createElement('li');
    taskItem.dataset.id = taskObject.id; // ID do banco
    if (isCompleted) taskItem.classList.add('completed');

    // Data (formata a data vinda do SQL)
    let dueDateHtml = '';
    if (taskObject.due_date) {
      try {
        const date = new Date(taskObject.due_date);
        const formattedDate = date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        dueDateHtml = `<span><i class="fas fa-calendar-alt"></i> Até ${formattedDate}</span>`;
      } catch (e) { /* ignora */ }
    }

    // Prioridade
    let priorityHtml = '';
    if (taskObject.priority) {
      const p = taskObject.priority;
      priorityHtml = `<span>
        <i class="fas fa-flag"></i>
        <span class="priority-badge priority-${p}"></span>
        ${p.charAt(0).toUpperCase() + p.slice(1)}
      </span>`;
    }

    // Categoria (agora só usa o nome, sem buscar a cor)
    let categoryHtml = '';
    if (taskObject.category) {
      categoryHtml = `<span>
        <i class="fas fa-folder"></i>
        ${taskObject.category}
      </span>`;
    }

    // Ações
    let actionButtons = '';
    if (isCompleted) {
      actionButtons = `<button class="action-btn undo-btn" title="Desfazer"><i class="fas fa-undo"></i></button>`;
    } else {
      actionButtons = `<button class="action-btn complete-btn" title="Concluir"><i class="fas fa-check"></i></button>
      <button class="action-btn edit-btn" title="Editar"><i class="fas fa-edit"></i></button>`;
    }

    taskItem.innerHTML = `
      <div class="task-details">
        <span class="task-name">${taskObject.name}</span>
        <div class="task-meta">
          ${priorityHtml}
          ${categoryHtml}
          ${dueDateHtml}
        </div>
      </div>
      <div class="task-actions">
        <button class="action-btn view-btn" title="Visualizar"><i class="fas fa-eye"></i></button>
        ${actionButtons}
        <button class="action-btn delete-btn" title="Excluir"><i class="fas fa-trash"></i></button>
      </div>
    `;
    return taskItem;
  }

  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (taskForm.classList.contains('is-view-only')) return;

    const taskData = {
      // id não é enviado no body, é pego do taskIdInput
      name: taskNameInput.value.trim(),
      desc: taskDescInput.value.trim() || null,
      dueDate: taskDueDateInput.value || null,
      priority: taskPriorityInput.value,
      category: taskCategorySelect.value || null,
      time: taskTimeInput.value || null,
      completed: false // Novas tarefas ou edições são 'a fazer'
    };

    if (taskData.name === '') {
      alert('O nome da tarefa é obrigatório.');
      return;
    }
    
    const taskId = taskIdInput.value;
    const method = taskId ? 'PUT' : 'POST';
    const url = taskId ? `/api/tasks/${taskId}` : '/api/tasks';

    try {
      const response = await fetch(url, {
          method: method,
          headers: getAuthHeaders(),
          body: JSON.stringify(taskData)
      });
      if (!response.ok) throw new Error('Falha ao salvar tarefa');
      
      renderTasks(); // Recarrega tudo
      closeTaskModal();

    } catch(err) {
      alert('Erro ao salvar tarefa.');
    }
  });

  async function showTaskDetails(taskId, isViewOnly) {
      // Pega os dados da tarefa da API para garantir que estão atualizados
      // (Isso é mais lento que antes, mas mais correto)
      try {
          const response = await fetch('/api/tasks', { headers: getAuthHeaders() });
          const { todo, completed } = await response.json();
          const taskObject = [...todo, ...completed].find(t => t.id == taskId);
          
          if (!taskObject) {
              alert('Não foi possível encontrar a tarefa.');
              return;
          }
          
          if (isViewOnly) {
              taskModalTitle.textContent = 'Detalhes da Tarefa';
              taskForm.classList.add('is-view-only');
              taskFormFields.forEach(field => field.disabled = true);
          } else {
              taskModalTitle.textContent = 'Editar Tarefa';
              taskForm.classList.remove('is-view-only');
              taskFormFields.forEach(field => field.disabled = false);
          }
      
          await populateCategorySelect(); // Garante que as categorias estão carregadas
      
          taskIdInput.value = taskObject.id;
          taskNameInput.value = taskObject.name;
          taskDescInput.value = taskObject.desc || '';
          taskDueDateInput.value = taskObject.due_date || '';
          taskPriorityInput.value = taskObject.priority || 'media';
          taskCategorySelect.value = taskObject.category || '';
          taskTimeInput.value = taskObject.time || '';
          openTaskModal();

      } catch (err) {
          alert('Erro ao carregar detalhes da tarefa.');
      }
  }

  async function handleListClick(e) {
    const actionBtn = e.target.closest('.action-btn');
    if (!actionBtn) return;
    
    const taskItem = actionBtn.closest('li');
    const taskId = taskItem.dataset.id;
    let taskChanged = false;

    try {
      if (actionBtn.classList.contains('view-btn')) {
          showTaskDetails(taskId, true);
      } else if (actionBtn.classList.contains('edit-btn')) {
          showTaskDetails(taskId, false);
      } else if (actionBtn.classList.contains('delete-btn')) {
          if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
              await fetch(`/api/tasks/${taskId}`, { method: 'DELETE', headers: getAuthHeaders() });
              taskChanged = true;
          }
      } else if (actionBtn.classList.contains('complete-btn')) {
          // Envia um PUT apenas com a propriedade 'completed'
          await fetch(`/api/tasks/${taskId}`, {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: JSON.stringify({ completed: true })
          });
          taskChanged = true;
      } else if (actionBtn.classList.contains('undo-btn')) {
          await fetch(`/api/tasks/${taskId}`, {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: JSON.stringify({ completed: false })
          });
          taskChanged = true;
      }
  
      if (taskChanged) renderTasks(); // Recarrega a lista se algo mudou

    } catch (err) {
      alert('Ocorreu um erro ao processar a ação.');
    }
  }

  todoList.addEventListener('click', handleListClick);
  completedList.addEventListener('click', handleListClick);

  // --- 9. Carregamento Inicial ---
  async function initializeDashboard() {
    // Garante que o usuário existe antes de tentar carregar dados
    const user = getCurrentUser();
    if (!user) return; 

    await renderTasks();
    await populateCategorySelect();
  }

  initializeDashboard();

  // --- 10. Funções Utilitárias ---
  function rgbToHex(rgb) {
      if (!rgb || rgb.startsWith('#')) return rgb;
      let [r, g, b] = rgb.match(/\d+/g).map(Number);
      return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }
});