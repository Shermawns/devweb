/* dashboard.js (VERSÃO AJUSTADA PARA USAR sessionStorage NO PERFIL) */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Seleção dos Elementos ---
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
  
    // Modal de PERFIL (NOVO)
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
  
    // --- 2. Funções do Modal de TAREFAS ---
    function openTaskModal() {
      taskModal.classList.remove('hidden');
    }
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
      populateCategorySelect();
      openTaskModal();
    });
  
    closeTaskModalBtn.addEventListener('click', closeTaskModal);
    cancelTaskModalBtn.addEventListener('click', closeTaskModal);
    taskModal.addEventListener('click', (e) => {
      if (e.target === taskModal) closeTaskModal();
    });
  
    // --- 3. Funções do Modal de CATEGORIAS ---
    function openCategoryModal() { categoryModal.classList.remove('hidden'); }
    function closeCategoryModal() {
      categoryModal.classList.add('hidden');
      categoryForm.reset();
      categoryIdInput.value = '';
      populateCategorySelect();
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
  
    // --- 4. Funções do Modal de PERFIL (NOVO) ---
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
  
    // --- 5. LocalStorage (Tarefas, Categorias) ---
    function getTasks() {
      const todo = JSON.parse(localStorage.getItem('todoTasks')) || [];
      const completed = JSON.parse(localStorage.getItem('completedTasks')) || [];
      return { todo, completed };
    }
    function saveTasks(todo, completed) {
      localStorage.setItem('todoTasks', JSON.stringify(todo));
      localStorage.setItem('completedTasks', JSON.stringify(completed));
    }
  
    // Categorias
    function getCategories() {
      return JSON.parse(localStorage.getItem('taskCategories')) || [
        { id: 'cat-1', name: 'Trabalho', color: '#3498db' },
        { id: 'cat-2', name: 'Pessoal', color: '#2ecc71' },
      ];
    }
    function saveCategories(categories) {
      localStorage.setItem('taskCategories', JSON.stringify(categories));
    }
  
    // --- 5B. Usuario: agora usando SESSION storage como principal ---
    function getCurrentUser() {
      // 1) tenta sessionStorage (valor atual da sessão)
      const sessionValue = sessionStorage.getItem('currentUser');
      if (sessionValue) {
        try { return JSON.parse(sessionValue); } catch { /* segue */ }
      }
  
      // 2) se não existir em sessionStorage, tenta localStorage (dados antigos/persistentes)
      const localValue = localStorage.getItem('currentUser');
      if (localValue) {
        try {
          // copia para sessionStorage para este fluxo de sessão
          sessionStorage.setItem('currentUser', localValue);
          return JSON.parse(localValue);
        } catch { /* segue */ }
      }
  
      // 3) padrão (convidado) — sempre salva em sessionStorage
      const defaultUser = {
        name: 'Utilizador Convidado',
        email: 'convidado@devweb.com',
        password: '123' // atenção: simulação — NUNCA faça isso em produção
      };
      sessionStorage.setItem('currentUser', JSON.stringify(defaultUser));
      return defaultUser;
    }
  
    // Salva o usuário NA sessionStorage (comportamento solicitado).
    // Se quiser persistência "lembrar-me", poderia também gravar em localStorage — aqui deixei como session-only.
    function saveCurrentUser(user) {
      sessionStorage.setItem('currentUser', JSON.stringify(user));
    }
  
    // --- 6. Lógica CRUD de PERFIL (NOVO) ---
    function loadProfileData() {
      const user = getCurrentUser();
      profileNameInput.value = user.name;
      profileEmailInput.value = user.email;
      profilePassCurrent.value = '';
      profilePassNew.value = '';
      profilePassConfirm.value = '';
      profileMessage.textContent = '';
      profileMessage.className = 'profile-message';
    }
  
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = getCurrentUser();
  
      const currentPass = profilePassCurrent.value;
      const newPass = profilePassNew.value;
      const confirmPass = profilePassConfirm.value;
  
      profileMessage.textContent = '';
      profileMessage.className = 'profile-message';
  
      // 1. Validação de senha (simulada)
      if (newPass || confirmPass || currentPass) {
        // Se preencheu a senha atual, validamos; se deixou em branco (só mudar nome) permitimos
        if (currentPass !== user.password && currentPass !== "") {
          profileMessage.textContent = 'Senha atual incorreta.';
          profileMessage.classList.add('error');
          return;
        }
  
        if (newPass || confirmPass) {
          if (newPass.length < 6) {
            profileMessage.textContent = 'A nova senha deve ter pelo menos 6 caracteres.';
            profileMessage.classList.add('error');
            return;
          }
          if (newPass !== confirmPass) {
            profileMessage.textContent = 'As novas senhas não coincidem.';
            profileMessage.classList.add('error');
            return;
          }
          // Atualiza senha no objeto user (simulação)
          user.password = newPass;
        }
      }
  
      // 2. Atualiza nome
      user.name = profileNameInput.value.trim() || user.name;
  
      // 3. Salva no sessionStorage (conserto solicitado)
      saveCurrentUser(user);
  
      profileMessage.textContent = 'Perfil atualizado com sucesso!';
      profileMessage.classList.add('success');
  
      // Fecha o modal depois de 1.5s (menos tempo que antes)
      setTimeout(closeProfileModal, 1500);
    });
  
    // Excluir conta: limpar também sessionStorage além do localStorage
    deleteAccountBtn.addEventListener('click', () => {
      const confirmText = prompt('Esta ação é irreversível e apagará todas as suas tarefas e categorias.\n\nPara confirmar, digite "EXCLUIR" em maiúsculas.');
      if (confirmText === 'EXCLUIR') {
        // Limpa dados de tarefas/categorias em localStorage (persistentes)
        localStorage.removeItem('todoTasks');
        localStorage.removeItem('completedTasks');
        localStorage.removeItem('taskCategories');
        localStorage.removeItem('currentUser');
  
        // Limpa sessionStorage (sessão atual)
        sessionStorage.clear();
  
        alert('Conta excluída com sucesso.');
        window.location.href = 'index.html';
      } else {
        alert('Ação cancelada.');
      }
    });
  
    // --- 7. Lógica CRUD de CATEGORIAS ---
    function renderCategories() {
      const categories = getCategories();
      categoryList.innerHTML = '';
      if (categories.length === 0) {
        categoryList.innerHTML = '<li class="empty-list">Nenhuma categoria salva.</li>';
        return;
      }
      categories.forEach(cat => {
        const li = document.createElement('li');
        li.dataset.id = cat.id;
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
    }
  
    categoryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const categories = getCategories();
      const catData = {
        id: categoryIdInput.value || Date.now().toString(),
        name: categoryNameInput.value.trim(),
        color: categoryColorInput.value
      };
      if (catData.name === '') return;
      if (categoryIdInput.value) {
        const index = categories.findIndex(c => c.id === catData.id);
        if (index > -1) categories[index] = catData;
      } else {
        categories.push(catData);
      }
      saveCategories(categories);
      renderCategories();
      categoryForm.reset();
      categoryIdInput.value = '';
    });
  
    categoryList.addEventListener('click', (e) => {
      const categories = getCategories();
      const btn = e.target.closest('.action-btn');
      if (!btn) return;
      const li = btn.closest('li');
      const catId = li.dataset.id;
      if (btn.classList.contains('delete-btn')) {
        if (confirm('Tem certeza que deseja excluir esta categoria?')) {
          const newCategories = categories.filter(c => c.id !== catId);
          saveCategories(newCategories);
          renderCategories();
        }
      }
      if (btn.classList.contains('edit-btn')) {
        const category = categories.find(c => c.id === catId);
        if (category) {
          categoryIdInput.value = category.id;
          categoryNameInput.value = category.name;
          categoryColorInput.value = category.color;
        }
      }
    });
  
    function populateCategorySelect() {
      const categories = getCategories();
      const currentVal = taskCategorySelect.value;
      taskCategorySelect.innerHTML = '<option value="">Nenhuma</option>';
      categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = cat.name;
        taskCategorySelect.appendChild(option);
      });
      taskCategorySelect.value = currentVal;
    }
  
    // --- 8. Lógica CRUD de TAREFAS ---
    function renderTasks() {
      const { todo, completed } = getTasks();
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
    }
  
    function createTaskElement(taskObject, isCompleted) {
      const taskItem = document.createElement('li');
      taskItem.dataset.id = taskObject.id;
      if (isCompleted) taskItem.classList.add('completed');
  
      // Data
      let dueDateHtml = '';
      if (taskObject.dueDate) {
        try {
          const date = new Date(taskObject.dueDate + 'T00:00:00-03:00');
          const formattedDate = date.toLocaleDateString('pt-BR');
          dueDateHtml = `<span><i class="fas fa-calendar-alt"></i> Até ${formattedDate}</span>`;
        } catch (e) { /* ignora */ }
      }
  
      // Prioridade
      let priorityHtml = '';
      if (taskObject.priority) {
        priorityHtml = `<span>
          <i class="fas fa-flag"></i>
          <span class="priority-badge priority-${taskObject.priority}"></span>
          ${taskObject.priority.charAt(0).toUpperCase() + taskObject.priority.slice(1)}
        </span>`;
      }
  
      // Categoria
      let categoryHtml = '';
      if (taskObject.category) {
        const categories = getCategories();
        const category = categories.find(c => c.name === taskObject.category);
        const color = category ? category.color : '#888';
        categoryHtml = `<span>
          <i class="fas fa-folder" style="color: ${color}"></i>
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
  
    taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (taskForm.classList.contains('is-view-only')) return;
  
      const taskData = {
        id: taskIdInput.value || Date.now().toString(),
        name: taskNameInput.value.trim(),
        desc: taskDescInput.value.trim() || '',
        dueDate: taskDueDateInput.value || null,
        priority: taskPriorityInput.value,
        category: taskCategorySelect.value || null,
        time: taskTimeInput.value || null
      };
  
      if (taskData.name === '') {
        alert('O nome da tarefa é obrigatório.');
        return;
      }
  
      const { todo, completed } = getTasks();
      if (taskIdInput.value) {
        let foundIndex = todo.findIndex(t => t.id === taskData.id);
        if (foundIndex > -1) todo[foundIndex] = taskData;
        else {
          foundIndex = completed.findIndex(t => t.id === taskData.id);
          if (foundIndex > -1) completed[foundIndex] = taskData;
        }
      } else {
        todo.push(taskData);
      }
  
      saveTasks(todo, completed);
      renderTasks();
      closeTaskModal();
    });
  
    function showTaskDetails(taskObject, isViewOnly) {
      if (isViewOnly) {
        taskModalTitle.textContent = 'Detalhes da Tarefa';
        taskForm.classList.add('is-view-only');
        taskFormFields.forEach(field => field.disabled = true);
      } else {
        taskModalTitle.textContent = 'Editar Tarefa';
        taskForm.classList.remove('is-view-only');
        taskFormFields.forEach(field => field.disabled = false);
      }
  
      populateCategorySelect();
  
      taskIdInput.value = taskObject.id;
      taskNameInput.value = taskObject.name;
      taskDescInput.value = taskObject.desc || '';
      taskDueDateInput.value = taskObject.dueDate || '';
      taskPriorityInput.value = taskObject.priority || 'media';
      taskCategorySelect.value = taskObject.category || '';
      taskTimeInput.value = taskObject.time || '';
      openTaskModal();
    }
  
    function handleListClick(e) {
      const actionBtn = e.target.closest('.action-btn');
      if (!actionBtn) return;
      const taskItem = actionBtn.closest('li');
      const taskId = taskItem.dataset.id;
      const { todo, completed } = getTasks();
      let taskChanged = false;
      const taskObject = todo.find(t => t.id === taskId) || completed.find(t => t.id === taskId);
      if (!taskObject) return;
  
      if (actionBtn.classList.contains('view-btn')) {
        showTaskDetails(taskObject, true);
      } else if (actionBtn.classList.contains('edit-btn')) {
        showTaskDetails(taskObject, false);
      } else if (actionBtn.classList.contains('delete-btn')) {
        const newTodo = todo.filter(t => t.id !== taskId);
        const newCompleted = completed.filter(t => t.id !== taskId);
        saveTasks(newTodo, newCompleted);
        taskChanged = true;
      } else if (actionBtn.classList.contains('complete-btn')) {
        const newTodo = todo.filter(t => t.id !== taskId);
        completed.push(taskObject);
        saveTasks(newTodo, completed);
        taskChanged = true;
      } else if (actionBtn.classList.contains('undo-btn')) {
        const newCompleted = completed.filter(t => t.id !== taskId);
        todo.push(taskObject);
        saveTasks(todo, newCompleted);
        taskChanged = true;
      }
  
      if (taskChanged) renderTasks();
    }
  
    todoList.addEventListener('click', handleListClick);
    completedList.addEventListener('click', handleListClick);
  
    // --- 9. Carregamento Inicial ---
    function initializeDashboard() {
      renderTasks();
      populateCategorySelect();
  
      // Garantir que exista um usuário na sessionStorage (gera o default se necessário)
      getCurrentUser();
    }
  
    initializeDashboard();
  });
  