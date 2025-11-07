// Encrypt text with AES (PBKDF2 + random salt + iv)
function encryptAES_PBKDF2(plainText, passphrase) {
  const salt = CryptoJS.lib.WordArray.random(16);
  const iv = CryptoJS.lib.WordArray.random(16);
  const key = CryptoJS.PBKDF2(passphrase, salt, { keySize: 256 / 32, iterations: 1000 });
  const encrypted = CryptoJS.AES.encrypt(plainText, key, { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
  const payload = {
    alg: 'AES-PBKDF2',
    salt: salt.toString(CryptoJS.enc.Hex),
    iv: iv.toString(CryptoJS.enc.Hex),
    ct: encrypted.toString()
  };
  return safeBtoa(JSON.stringify(payload));
}

// Decrypt text with AES (PBKDF2 format)
function decryptAES_PBKDF2(payloadB64, passphrase) {
  const json = safeAtob(payloadB64);
  const obj = JSON.parse(json);
  const salt = CryptoJS.enc.Hex.parse(obj.salt);
  const iv = CryptoJS.enc.Hex.parse(obj.iv);
  const key = CryptoJS.PBKDF2(passphrase, salt, { keySize: 256 / 32, iterations: 1000 });
  const decrypted = CryptoJS.AES.decrypt(obj.ct, key, { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
  return decrypted.toString(CryptoJS.enc.Utf8);
}
