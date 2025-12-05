class AuthManager {
    constructor() {
        this.database = database;
        this.init();
    }

    init() {
        this.updateUI();
        this.setupEventListeners();
    }

    updateUI() {
        const currentUser = this.database.getCurrentUser();
        const usernameEl = document.getElementById('username');
        const roleBadgeEl = document.getElementById('role-badge');
        const adminLink = document.getElementById('admin-link');

        if (currentUser) {
            // Обновляем отображение пользователя
            usernameEl.textContent = currentUser.username;
            
            // Обновляем бейдж роли с эмодзи
            const roleEmoji = this.getRoleEmoji(currentUser.role);
            roleBadgeEl.innerHTML = `${roleEmoji} ${currentUser.role}`;
            roleBadgeEl.style.background = this.getRoleColor(currentUser.role);
            
            // Показываем коронку если есть
            if (currentUser.crown) {
                usernameEl.innerHTML = `${currentUser.username} <i class="fas fa-crown" style="color: gold;"></i>`;
            }
            
            // Показываем админ-панель для Developer
            if (currentUser.role === 'Developer' && adminLink) {
                adminLink.style.display = 'inline-block';
            }
        } else {
            usernameEl.textContent = 'Гость';
            roleBadgeEl.innerHTML = '👤 Гость';
            roleBadgeEl.style.background = 'var(--gray)';
            
            if (adminLink) {
                adminLink.style.display = 'none';
            }
        }
    }

    getRoleEmoji(role) {
        const emojis = {
            'Developer': '👑',
            'Tester': '🧪',
            'Moder': '🛡️',
            'НадзирательЮТ': '👮',
            'user': '👤',
            'Alpha': 'α',
            'Пользователь': '👤',
            'Full': '⭐',
            'Legit': '🎯',
            'Basic': '🔰',
            'Lite': '⚡'
        };
        return emojis[role] || '👤';
    }

    getRoleColor(role) {
        const colors = {
            'Developer': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            'Tester': 'linear-gradient(135deg, #9C27B0 0%, #673AB7 100%)',
            'Moder': 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
            'НадзирательЮТ': 'linear-gradient(135deg, #F44336 0%, #E91E63 100%)',
            'user': 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
            'Alpha': 'linear-gradient(135deg, #FF5722 0%, #FF9800 100%)',
            'Пользователь': 'var(--gradient-blue)',
            'Full': 'linear-gradient(135deg, #FF4081 0%, #F50057 100%)',
            'Legit': 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
            'Basic': 'linear-gradient(135deg, #3F51B5 0%, #303F9F 100%)',
            'Lite': 'linear-gradient(135deg, #8BC34A 0%, #4CAF50 100%)'
        };
        return colors[role] || 'var(--gradient-blue)';
    }

    async login(username, password) {
        const result = await this.database.login(username, password);
        if (result.success) {
            this.updateUI();
            return result;
        }
        return result;
    }

    async register(username, password, email) {
        const result = await this.database.register(username, password, email);
        if (result.success) {
            this.updateUI();
        }
        return result;
    }

    logout() {
        this.database.logout();
        this.updateUI();
        window.location.href = 'index.html';
    }

    setupEventListeners() {
        // Обработка кнопок покупки
        document.querySelectorAll('.btn-buy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!btn.disabled) {
                    const mod = btn.dataset.mod;
                    const currentUser = this.database.getCurrentUser();
                    
                    if (!currentUser) {
                        window.location.href = 'login.html?redirect=purchase&mod=' + mod;
                    } else {
                        window.location.href = 'purchase.html?mod=' + mod;
                    }
                }
            });
        });
    }
}

const authManager = new AuthManager();