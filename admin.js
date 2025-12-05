class AdminManager {
    constructor() {
        this.database = database;
        this.authManager = authManager;
        this.init();
    }

    async init() {
        // Проверяем права доступа
        const currentUser = this.database.getCurrentUser();
        
        if (!currentUser || currentUser.role !== 'Developer') {
            window.location.href = 'index.html';
            return;
        }

        // Обновляем UI
        document.getElementById('admin-username').textContent = currentUser.username;
        
        // Загружаем данные
        await this.loadDashboardStats();
        await this.loadUsersTable();
        await this.loadKeysTable();
        
        // Настройка интервала обновления
        setInterval(() => this.loadDashboardStats(), 30000);
    }

    async loadDashboardStats() {
        const stats = this.database.getStats();
        
        document.getElementById('total-users').textContent = stats.totalUsers;
        document.getElementById('total-keys').textContent = stats.totalKeys;
        document.getElementById('active-subs').textContent = stats.activeSubscriptions;
        document.getElementById('pending-keys').textContent = stats.pendingKeys;
    }

    async loadUsersTable() {
        const users = this.database.getAllUsers();
        const tbody = document.getElementById('users-table');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        Object.values(users).forEach(user => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>
                    ${user.username}
                    ${user.crown ? ' <i class="fas fa-crown" style="color: gold;"></i>' : ''}
                </td>
                <td>
                    <select class="role-select" data-username="${user.username}" onchange="adminManager.updateUserRole('${user.username}', this.value)">
                        ${this.getRoleOptions(user.role)}
                    </select>
                </td>
                <td>
                    <span class="status-badge ${user.subscription !== 'none' ? 'status-active' : 'status-pending'}">
                        ${user.subscription !== 'none' ? user.subscription : 'Нет подписки'}
                    </span>
                </td>
                <td>${new Date(user.created).toLocaleDateString('ru-RU')}</td>
                <td class="action-buttons">
                    <button class="btn-action btn-edit" onclick="adminManager.editUser('${user.username}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${user.username !== 'RoftekDEV' ? 
                        `<button class="btn-action btn-delete" onclick="adminManager.deleteUser('${user.username}')">
                            <i class="fas fa-trash"></i>
                        </button>` : ''
                    }
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    async loadKeysTable() {
        const keys = this.database.getAllKeys();
        const tbody = document.getElementById('keys-table');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        Object.values(keys).forEach(key => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td><code class="key-value">${key.key}</code></td>
                <td>${key.type}</td>
                <td>${key.duration}</td>
                <td>${key.generatedBy}</td>
                <td>
                    <span class="status-badge ${key.used ? 'status-used' : 'status-active'}">
                        ${key.used ? 'Использован' : 'Активен'}
                    </span>
                </td>
                <td>${key.usedBy || 'Не использован'}</td>
                <td>${new Date(key.generatedAt).toLocaleDateString('ru-RU')}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    getRoleOptions(currentRole) {
        const roles = [
            'Developer',
            'Tester',
            'Moder',
            'НадзирательЮТ',
            'user',
            'Alpha',
            'Пользователь',
            'Full',
            'Legit',
            'Basic',
            'Lite'
        ];
        
        return roles.map(role => 
            `<option value="${role}" ${role === currentRole ? 'selected' : ''}>
                ${role}
            </option>`
        ).join('');
    }

    async updateUserRole(username, newRole) {
        const result = this.database.updateUserRole(username, newRole);
        
        if (result.success) {
            this.showNotification(`Роль пользователя ${username} изменена на ${newRole}`, 'success');
            await this.loadUsersTable();
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    async editUser(username) {
        const users = this.database.getAllUsers();
        const user = users[username.toLowerCase()];
        
        if (user) {
            const newPassword = prompt('Введите новый пароль (оставьте пустым чтобы не менять):');
            
            if (newPassword !== null) {
                if (newPassword && newPassword.length >= 6) {
                    user.password = newPassword;
                    this.showNotification(`Пароль для ${username} обновлен`, 'success');
                }
            }
        }
    }

    async deleteUser(username) {
        if (confirm(`Вы уверены, что хотите удалить пользователя ${username}?`)) {
            const db = this.database.getLocalDB();
            delete db.users[username.toLowerCase()];
            this.database.updateLocalDB(db);
            
            this.showNotification(`Пользователь ${username} удален`, 'success');
            await this.loadUsersTable();
            await this.loadDashboardStats();
        }
    }

    showNotification(message, type = 'info') {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        
        // Стили для уведомления
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#00c853' : '#ff5252'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Добавляем стили для анимаций уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

const adminManager = new AdminManager();