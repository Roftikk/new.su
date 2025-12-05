// Для GitHub Pages используем Firebase Realtime Database
// Замените конфиг на свой Firebase проект
const firebaseConfig = {
    apiKey: "AIzaSyC4C0pF8K6Y9L6q6p8f5q2L8K9J8L6QwE0",
    authDomain: "rustme-dodep.firebaseapp.com",
    databaseURL: "https://rustme-dodep-default-rtdb.firebaseio.com",
    projectId: "rustme-dodep",
    storageBucket: "rustme-dodep.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// Инициализация Firebase
let db;
let auth;

// Проверяем, доступен ли Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    auth = firebase.auth();
} else {
    console.error('Firebase не загружен!');
}

// Инициализация базы данных в localStorage как fallback
const DB_NAME = 'rustme_database';
const USERS_KEY = 'rustme_users';
const KEYS_KEY = 'rustme_keys';
const SUBSCRIPTIONS_KEY = 'rustme_subscriptions';

class Database {
    constructor() {
        this.initLocalDB();
        this.createDefaultAdmin();
    }

    initLocalDB() {
        if (!localStorage.getItem(DB_NAME)) {
            const initialDB = {
                version: '1.0',
                users: {},
                keys: {},
                subscriptions: {}
            };
            localStorage.setItem(DB_NAME, JSON.stringify(initialDB));
        }
    }

    getLocalDB() {
        return JSON.parse(localStorage.getItem(DB_NAME) || '{}');
    }

    updateLocalDB(data) {
        localStorage.setItem(DB_NAME, JSON.stringify(data));
    }

    // Создание дефолтного админа
    createDefaultAdmin() {
        const db = this.getLocalDB();
        if (!db.users?.roftekdev) {
            db.users = db.users || {};
            db.users.roftekdev = {
                username: 'RoftekDEV',
                password: 'dimok2016',
                role: 'Developer',
                email: 'admin@rustme.com',
                created: new Date().toISOString(),
                subscription: 'forever',
                lastLogin: new Date().toISOString(),
                crown: true
            };
            this.updateLocalDB(db);
        }
    }

    // Аутентификация
    async login(username, password) {
        const db = this.getLocalDB();
        const user = db.users?.[username.toLowerCase()];
        
        if (user && user.password === password) {
            // Обновляем последний логин
            user.lastLogin = new Date().toISOString();
            this.updateLocalDB(db);
            
            // Сохраняем в сессии
            sessionStorage.setItem('currentUser', JSON.stringify({
                username: user.username,
                role: user.role,
                crown: user.crown,
                subscription: user.subscription
            }));
            
            return {
                success: true,
                user: {
                    username: user.username,
                    role: user.role,
                    crown: user.crown,
                    subscription: user.subscription
                }
            };
        }
        
        return { success: false, error: 'Неверные учетные данные' };
    }

    // Регистрация
    async register(username, password, email) {
        const db = this.getLocalDB();
        
        if (db.users?.[username.toLowerCase()]) {
            return { success: false, error: 'Пользователь уже существует' };
        }
        
        db.users[username.toLowerCase()] = {
            username: username,
            password: password,
            email: email,
            role: 'Пользователь',
            created: new Date().toISOString(),
            subscription: 'none',
            lastLogin: new Date().toISOString(),
            crown: false
        };
        
        this.updateLocalDB(db);
        
        // Автоматический логин после регистрации
        return this.login(username, password);
    }

    // Получение пользователя
    getCurrentUser() {
        const userData = sessionStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    }

    // Выход
    logout() {
        sessionStorage.removeItem('currentUser');
    }

    // Генерация ключа
    generateKey(type, duration, generatedBy) {
        const db = this.getLocalDB();
        const key = 'RUSTME-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        db.keys = db.keys || {};
        db.keys[key] = {
            key: key,
            type: type,
            duration: duration,
            generatedBy: generatedBy,
            generatedAt: new Date().toISOString(),
            used: false,
            usedBy: null,
            usedAt: null
        };
        
        this.updateLocalDB(db);
        return key;
    }

    // Получение всех ключей
    getAllKeys() {
        const db = this.getLocalDB();
        return db.keys || {};
    }

    // Активация ключа
    activateKey(key, username) {
        const db = this.getLocalDB();
        
        if (!db.keys?.[key]) {
            return { success: false, error: 'Ключ не найден' };
        }
        
        if (db.keys[key].used) {
            return { success: false, error: 'Ключ уже использован' };
        }
        
        // Обновляем ключ
        db.keys[key].used = true;
        db.keys[key].usedBy = username;
        db.keys[key].usedAt = new Date().toISOString();
        
        // Обновляем подписку пользователя
        if (db.users?.[username.toLowerCase()]) {
            db.users[username.toLowerCase()].subscription = db.keys[key].type;
            db.users[username.toLowerCase()].role = db.keys[key].type;
        }
        
        this.updateLocalDB(db);
        return { success: true, subscription: db.keys[key].type };
    }

    // Получение всех пользователей
    getAllUsers() {
        const db = this.getLocalDB();
        return db.users || {};
    }

    // Обновление роли пользователя
    updateUserRole(username, newRole) {
        const db = this.getLocalDB();
        
        if (db.users?.[username.toLowerCase()]) {
            db.users[username.toLowerCase()].role = newRole;
            this.updateLocalDB(db);
            return { success: true };
        }
        
        return { success: false, error: 'Пользователь не найден' };
    }

    // Получение статистики
    getStats() {
        const db = this.getLocalDB();
        const users = Object.values(db.users || {});
        const keys = Object.values(db.keys || {});
        
        return {
            totalUsers: users.length,
            activeSubscriptions: users.filter(u => u.subscription !== 'none').length,
            totalKeys: keys.length,
            usedKeys: keys.filter(k => k.used).length,
            pendingKeys: keys.filter(k => !k.used).length
        };
    }

    // Отправка в Telegram (симуляция)
    async sendToTelegram(message) {
        console.log('Отправка в Telegram:', message);
        // В реальном приложении здесь был бы fetch запрос к Telegram API
        return { success: true };
    }
}

// Экспортируем экземпляр базы данных
const database = new Database();