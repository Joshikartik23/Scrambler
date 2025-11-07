// Track selected file object
let selectedFile = null;

// Track processed data for download
let processedFileData = null;

// Handle file chooser change / drop
function handleFileSelectFromEvent(event) {
  const f = event.target?.files ? event.target.files[0] : (event.dataTransfer ? event.dataTransfer.files[0] : null);
  if (!f) return;
  if (f.size > MAX_FILE_SIZE_BYTES) {
    document.getElementById('file-output').textContent = `Error: File is too large (> ${MAX_FILE_SIZE_BYTES / (1024*1024)} MB)`;
    return;
  }
  selectedFile = f;
  document.getElementById('file-name').textContent = selectedFile.name;
  document.getElementById('file-output').textContent = `Selected: ${selectedFile.name} (${Math.round(selectedFile.size/1024)} KB)`;
}

// Encrypt selected file
async function encryptFile() {
  const out = document.getElementById('file-output');
  const btn = document.getElementById('btn-encrypt-file');
  if (!selectedFile) { out.textContent = 'Error: Please select a file'; return; }
  const pass = document.getElementById('file-key').value;
  if (!pass) { out.textContent = 'Error: Please enter an encryption key'; return; }

  btn.disabled = true; out.innerHTML = '<span class="spinner"></span>Encrypting...';

  try {
    const ab = await selectedFile.arrayBuffer();
    const algo = document.getElementById('file-algo').value;

    if (algo === 'AES') {
      const wordArr = arrayBufferToWordArray(ab);
      const base64Plain = CryptoJS.enc.Base64.stringify(wordArr);
      const encryptedB64 = encryptAES_PBKDF2(base64Plain, pass);
      processedFileData = {
        filename: selectedFile.name,
        mime: selectedFile.type || 'application/octet-stream',
        isEncrypted: true,
        algo: 'AES-PBKDF2',
        payload: encryptedB64
      };
    } else if (algo === 'DES') {
      const wordArr = arrayBufferToWordArray(ab);
      const base64Plain = CryptoJS.enc.Base64.stringify(wordArr);
      const encrypted = CryptoJS.DES.encrypt(base64Plain, pass).toString();
      processedFileData = {
        filename: selectedFile.name,
        mime: selectedFile.type || 'application/octet-stream',
        isEncrypted: true,
        algo: 'DES',
        payload: encrypted
      };
    } else if (algo === 'TripleDES') {
      const wordArr = arrayBufferToWordArray(ab);
      const base64Plain = CryptoJS.enc.Base64.stringify(wordArr);
      const encrypted = CryptoJS.TripleDES.encrypt(base64Plain, pass).toString();
      processedFileData = {
        filename: selectedFile.name,
        mime: selectedFile.type || 'application/octet-stream',
        isEncrypted: true,
        algo: 'TripleDES',
        payload: encrypted
      };
    } else {
      throw new Error('Unsupported algorithm');
    }

    out.textContent = 'File encrypted successfully! Click "Download Result" to save.';
    showToast('File encrypted');
  } catch (e) {
    out.textContent = 'Error: ' + e.message;
  } finally {
    btn.disabled = false;
  }
}

// Decrypt selected file
async function decryptFile() {
  const out = document.getElementById('file-output');
  const btn = document.getElementById('btn-decrypt-file');
  if (!selectedFile) { out.textContent = 'Error: Please select a file (the file should be the encrypted file to decrypt)'; return; }
  const pass = document.getElementById('file-key').value;
  if (!pass) { out.textContent = 'Error: Please enter a decryption key'; return; }

  btn.disabled = true; out.innerHTML = '<span class="spinner"></span>Decrypting...';

  try {
    const text = await selectedFile.text();
    let decryptedBase64, algoDetected = null;

    try {
      decryptedBase64 = decryptAES_PBKDF2(text, pass);
      algoDetected = 'AES-PBKDF2';
    } catch (e) {}

    if (!algoDetected) {
      try {
        const plainBase64 = CryptoJS.DES.decrypt(text, pass).toString(CryptoJS.enc.Utf8);
        if (plainBase64) { decryptedBase64 = plainBase64; algoDetected = 'DES'; }
      } catch (e) {}
    }

    if (!algoDetected) {
      try {
        const plainBase64 = CryptoJS.TripleDES.decrypt(text, pass).toString(CryptoJS.enc.Utf8);
        if (plainBase64) { decryptedBase64 = plainBase64; algoDetected = 'TripleDES'; }
      } catch (e) {}
    }

    if (!algoDetected || !decryptedBase64) {
      throw new Error('Decryption failed. Check key / file format.');
    }

    const wordArr = CryptoJS.enc.Base64.parse(decryptedBase64);
    const u8 = wordArrayToUint8Array(wordArr);
    processedFileData = {
      filename: selectedFile.name.replace(/\.enc$/i, '') || selectedFile.name,
      mime: 'application/octet-stream',
      isEncrypted: false,
      algo: algoDetected,
      payload: u8
    };

    out.textContent = 'File decrypted successfully! Click "Download Result" to save.';
    showToast('File decrypted');
  } catch (e) {
    out.textContent = 'Error: ' + e.message;
  } finally {
    btn.disabled = false;
  }
}

// Download processed file
function downloadFile() {
  const out = document.getElementById('file-output');
  if (!processedFileData) { out.textContent = 'Error: No processed file to download'; return; }

  if (processedFileData.isEncrypted) {
    const blob = new Blob([processedFileData.payload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const name = processedFileData.filename ? processedFileData.filename + '.enc' : 'scrambler_output.enc';
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    a.remove(); URL.revokeObjectURL(url);
    showToast('Downloaded encrypted file');
  } else {
    const u8 = processedFileData.payload;
    const blob = new Blob([u8], { type: processedFileData.mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const name = processedFileData.filename || 'output';
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    a.remove(); URL.revokeObjectURL(url);
    showToast('Downloaded file');
  }
}

// Initialize drag/drop listeners
function initFileDnD() {
  const input = document.getElementById('file-input');
  const dropzone = document.getElementById('dropzone');
  if (!input || !dropzone) return;

  input.addEventListener('change', handleFileSelectFromEvent);
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--accent)'; });
  dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = ''; });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault(); dropzone.style.borderColor = '';
    handleFileSelectFromEvent({ dataTransfer: e.dataTransfer });
  });
}

// Max file size (bytes)
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
