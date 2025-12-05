class GeneratorManager {
    constructor() {
        this.database = database;
        this.authManager = authManager;
        this.init();
    }

    init() {
        // Проверяем права доступа
        const currentUser = this.database.getCurrentUser();
        
        if (!currentUser || currentUser.role !== 'Developer') {
            window.location.href = 'index.html';
            return;
        }

        // Обновляем UI
        document.getElementById('gen-username').textContent = currentUser.username;
        const roleEmoji = this.authManager.getRoleEmoji(currentUser.role);
        const roleColor = this.authManager.getRoleColor(currentUser.role);
        const roleBadge = document.getElementById('gen-role-badge');
        roleBadge.innerHTML = `${roleEmoji} ${currentUser.role}`;
        roleBadge.style.background = roleColor;

        // Настраиваем кнопку генерации
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.generateKeys();
        });

        // Загружаем недавние ключи
        this.loadRecentKeys();
    }

    async generateKeys() {
        const type = document.getElementById('key-type').value;
        const duration = document.getElementById('key-duration').value;
        const amount = parseInt(document.getElementById('key-amount').value) || 1;
        const currentUser = this.database.getCurrentUser();

        if (!currentUser || currentUser.role !== 'Developer') {
            alert('Только Developer может генерировать ключи!');
            return;
        }

        const keys = [];
        const resultDiv = document.getElementById('generator-result');
        
        resultDiv.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Генерация ключей...</div>';

        for (let i = 0; i < amount; i++) {
            const key = this.database.generateKey(type, duration, currentUser.username);
            keys.push(key);
            
            // Отправляем в Telegram
            await this.database.sendToTelegram(
                `🎯 Сгенерирован новый ключ!\n\n` +
                `🔑 Ключ: ${key}\n` +
                `📦 Тип: ${type}\n` +
                `⏱️ Длительность: ${duration}\n` +
                `👤 Создатель: ${currentUser.username}\n` +
                `📅 Дата: ${new Date().toLocaleString('ru-RU')}`
            );
        }

        // Показываем результаты
        setTimeout(() => {
            resultDiv.innerHTML = `
                <div class="success-message">
                    <i class="fas fa-check-circle"></i>
                    <h3>Успешно сгенерировано ${amount} ключей</h3>
                    <div class="generated-keys">
                        ${keys.map(key => `
                            <div class="key-item">
                                <code>${key}</code>
                                <button class="btn-copy" data-key="${key}">
                                    <i class="far fa-copy"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <p>Ключи отправлены в Telegram @dadepbabki</p>
                </div>
            `;

            // Добавляем обработчики копирования
            document.querySelectorAll('.btn-copy').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const key = e.currentTarget.dataset.key;
                    navigator.clipboard.writeText(key).then(() => {
                        const originalIcon = e.currentTarget.innerHTML;
                        e.currentTarget.innerHTML = '<i class="fas fa-check"></i>';
                        setTimeout(() => {
                            e.currentTarget.innerHTML = originalIcon;
                        }, 2000);
                    });
                });
            });

            // Обновляем список недавних ключей
            this.loadRecentKeys();
        }, 1000);
    }

    async loadRecentKeys() {
        const keys = this.database.getAllKeys();
        const keysList = document.getElementById('recent-keys-list');
        
        if (!keysList) return;
        
        const recentKeys = Object.values(keys)
            .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
            .slice(0, 10);
        
        keysList.innerHTML = recentKeys.map(key => `
            <div class="key-card">
                <div class="key-header">
                    <code>${key.key}</code>
                    <span class="key-status ${key.used ? 'used' : 'active'}">
                        ${key.used ? 'Использован' : 'Активен'}
                    </span>
                </div>
                <div class="key-details">
                    <span><i class="fas fa-tag"></i> ${key.type}</span>
                    <span><i class="fas fa-clock"></i> ${key.duration}</span>
                    <span><i class="fas fa-user"></i> ${key.generatedBy}</span>
                </div>
                <div class="key-date">
                    ${new Date(key.generatedAt).toLocaleDateString('ru-RU')}
                </div>
            </div>
        `).join('');
    }
}

// Добавляем стили для генератора
const generatorStyle = document.createElement('style');
generatorStyle.textContent = `
    .generator-container {
        margin-top: 80px;
        padding: 2rem;
    }
    
    .generator-card {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        padding: 3rem;
        margin: 2rem 0;
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3rem;
    }
    
    @media (max-width: 992px) {
        .generator-card {
            grid-template-columns: 1fr;
        }
    }
    
    .form-group {
        margin-bottom: 1.5rem;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--light);
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .form-select,
    .form-input {
        width: 100%;
        padding: 0.75rem 1rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        color: var(--light);
        font-size: 1rem;
    }
    
    .form-select:focus,
    .form-input:focus {
        outline: none;
        border-color: var(--primary);
    }
    
    .btn-generate {
        width: 100%;
        padding: 1rem;
        font-size: 1.1rem;
        margin-top: 1rem;
    }
    
    .generator-result {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .loading {
        text-align: center;
        color: var(--gray);
    }
    
    .loading i {
        margin-right: 0.5rem;
    }
    
    .success-message {
        text-align: center;
        color: var(--light);
    }
    
    .success-message i {
        font-size: 4rem;
        color: var(--success);
        margin-bottom: 1rem;
    }
    
    .generated-keys {
        margin: 1.5rem 0;
    }
    
    .key-item {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 10px;
        padding: 1rem;
        margin-bottom: 0.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .key-item code {
        font-family: monospace;
        font-size: 1.1rem;
        color: var(--light);
    }
    
    .btn-copy {
        background: var(--primary);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.3s;
    }
    
    .btn-copy:hover {
        background: var(--secondary);
    }
    
    .recent-keys {
        margin-top: 3rem;
    }
    
    .keys-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }
    
    .key-card {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .key-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }
    
    .key-header code {
        font-family: monospace;
        color: var(--light);
        font-size: 0.9rem;
    }
    
    .key-status {
        padding: 0.25rem 0.5rem;
        border-radius: 5px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    
    .key-status.active {
        background: rgba(0, 200, 83, 0.2);
        color: #00c853;
    }
    
    .key-status.used {
        background: rgba(255, 82, 82, 0.2);
        color: #ff5252;
    }
    
    .key-details {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin: 0.5rem 0;
        font-size: 0.875rem;
        color: var(--gray);
    }
    
    .key-details span {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    
    .key-date {
        font-size: 0.75rem;
        color: var(--gray);
        text-align: right;
    }
`;
document.head.appendChild(generatorStyle);

const generatorManager = new GeneratorManager();