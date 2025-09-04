const crypto = require('crypto');

function generateRandomSixDigitNumber() {
    return Math.floor(100000 + crypto.randomInt(0, 900000));
}

module.exports = generateRandomSixDigitNumber;