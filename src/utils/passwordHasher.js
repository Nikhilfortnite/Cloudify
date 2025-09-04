const bcrypt = require('bcrypt');

async function passwordHasher(password) {
    try {
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);
        return hash;
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = passwordHasher;
