//https://shahinghasemy.medium.com/fullstack-aes-gcm-encryption-decryption-in-node-js-and-client-side-839c4df9232a

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;



function encryptAES_GCM(message, key) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(message), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
        encrypted,
        iv,
        tag
    };
}
function decryptAES_GCM(encrypted, key, iv, tag) {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString();
}

exports.encryptAES_GCM = encryptAES_GCM;
exports.decryptAES_GCM = decryptAES_GCM;