const bcrypt = require('bcryptjs');

const hash = '$2a$10$tR5JV3AVe8c52QEc7c0YBu1xujCfJLbtuz0VjxQed7ynUTYqgJeJS';
const password = 'admin123';

bcrypt.compare(password, hash).then(res => {
    console.log('Result:', res);
});
