// Toggle theme (light/dark)
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

// Initialize saved theme
(function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
})();

// Switch pages and set active nav link
function showPage(pageId, evt) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const target = document.getElementById(pageId);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
  if (evt && evt.currentTarget) {
    evt.currentTarget.classList.add('active');
  } else {
    document.querySelectorAll('nav a').forEach(a => {
      if (a.getAttribute('onclick')?.includes(`'${pageId}'`)) a.classList.add('active');
    });
  }
}

// Show small toast message
function showToast(message, duration = 1800) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// Generate random hex key
function generateKey(inputId) {
  try {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    const hex = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    document.getElementById(inputId).value = hex;
  } catch (e) {
    document.getElementById(inputId).value = CryptoJS.lib.WordArray.random(16).toString();
  }
  showToast('Random key generated');
}

// Encrypt text from UI
function encryptText() {
  const algo = document.getElementById('encrypt-algo').value;
  const text = document.getElementById('encrypt-input').value;
  const key = document.getElementById('encrypt-key').value;
  const output = document.getElementById('encrypt-output');
  const btn = document.getElementById('btn-encrypt-text');

  if (!text) { output.textContent = 'Error: Please enter text to encrypt'; return; }
  btn.disabled = true; output.textContent = 'Processing...';

  setTimeout(() => {
    try {
      let encrypted;
      if (algo === 'Base64') {
        encrypted = safeBtoa(text);
      } else if (algo === 'AES') {
        if (!key) { output.textContent = 'Error: Please enter an encryption key'; btn.disabled = false; return; }
        encrypted = encryptAES_PBKDF2(text, key);
      } else if (algo === 'DES') {
        if (!key) { output.textContent = 'Error: Please enter an encryption key'; btn.disabled = false; return; }
        encrypted = CryptoJS.DES.encrypt(text, key).toString();
      } else if (algo === 'TripleDES') {
        if (!key) { output.textContent = 'Error: Please enter an encryption key'; btn.disabled = false; return; }
        encrypted = CryptoJS.TripleDES.encrypt(text, key).toString();
      }
      output.textContent = encrypted;
      showToast('Text encrypted');
    } catch (err) {
      output.textContent = 'Error: ' + err.message;
    } finally {
      btn.disabled = false;
    }
  }, 50);
}

// Decrypt text from UI
function decryptText() {
  const algo = document.getElementById('decrypt-algo').value;
  const text = document.getElementById('decrypt-input').value;
  const key = document.getElementById('decrypt-key').value;
  const output = document.getElementById('decrypt-output');
  const btn = document.getElementById('btn-decrypt-text');

  if (!text) { output.textContent = 'Error: Please enter text to decrypt'; return; }
  btn.disabled = true; output.textContent = 'Processing...';

  setTimeout(() => {
    try {
      let decrypted;
      if (algo === 'Base64') {
        decrypted = safeAtob(text);
      } else if (algo === 'AES') {
        if (!key) { output.textContent = 'Error: Please enter a decryption key'; btn.disabled = false; return; }
        decrypted = decryptAES_PBKDF2(text, key);
      } else if (algo === 'DES') {
        if (!key) { output.textContent = 'Error: Please enter a decryption key'; btn.disabled = false; return; }
        decrypted = CryptoJS.DES.decrypt(text, key).toString(CryptoJS.enc.Utf8);
      } else if (algo === 'TripleDES') {
        if (!key) { output.textContent = 'Error: Please enter a decryption key'; btn.disabled = false; return; }
        decrypted = CryptoJS.TripleDES.decrypt(text, key).toString(CryptoJS.enc.Utf8);
      }
      output.textContent = decrypted || 'Error: Decryption failed. Check your key or input.';
      if (decrypted) showToast('Text decrypted');
    } catch (err) {
      output.textContent = 'Error: ' + err.message;
    } finally {
      btn.disabled = false;
    }
  }, 50);
}

// Generate hash from UI
function generateHash() {
  const algo = document.getElementById('hash-algo').value;
  const text = document.getElementById('hash-input').value;
  const output = document.getElementById('hash-output');

  if (!text) { output.textContent = 'Error: Please enter text to hash'; return; }

  let hash;
  if (algo === 'SHA256') hash = CryptoJS.SHA256(text).toString();
  else if (algo === 'SHA512') hash = CryptoJS.SHA512(text).toString();
  else if (algo === 'SHA1') hash = CryptoJS.SHA1(text).toString();
  else if (algo === 'MD5') hash = CryptoJS.MD5(text).toString();

  output.textContent = hash;
  showToast('Hash generated');
}

// Copy output text by id
function copyOutput(outputId) {
  const output = document.getElementById(outputId);
  const text = output.textContent;
  if (!text || text.startsWith('Error') || text.includes('will appear here')) { showToast('Nothing to copy'); return; }
  navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard')).catch(() => showToast('Copy failed'));
}
