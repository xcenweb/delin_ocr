// 数据库服务

import Database from '@tauri-apps/plugin-sql';

const db = Database.load('sqlite:cache.db');