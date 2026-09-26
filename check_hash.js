const bcrypt = require('bcryptjs');
console.log(bcrypt.compareSync('supersecret123', '$2b$10$diuE17NyIQbi898jFPjhYuEetjHJWfb4eGF1BfSYEVb.rRRx3XwkW'));
