// Encode text to base64 (Unicode-safe)
function safeBtoa(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

// Decode base64 to text (Unicode-safe)
function safeAtob(b64) {
  return decodeURIComponent(escape(atob(b64)));
}

// Convert ArrayBuffer to CryptoJS WordArray
function arrayBufferToWordArray(ab) {
  const u8 = new Uint8Array(ab);
  const words = [];
  for (let i = 0; i < u8.length; i += 4) {
    words.push((u8[i] << 24) | (u8[i + 1] << 16) | ((u8[i + 2] || 0) << 8) | (u8[i + 3] || 0));
  }
  return CryptoJS.lib.WordArray.create(words, u8.length);
}

// Convert CryptoJS WordArray to Uint8Array
function wordArrayToUint8Array(wordArray) {
  const len = wordArray.sigBytes;
  const words = wordArray.words;
  const u8 = new Uint8Array(len);
  let idx = 0;
  for (let i = 0; i < words.length; i++) {
    let w = words[i];
    u8[idx++] = (w >> 24) & 0xff;
    if (idx >= len) break;
    u8[idx++] = (w >> 16) & 0xff;
    if (idx >= len) break;
    u8[idx++] = (w >> 8) & 0xff;
    if (idx >= len) break;
    u8[idx++] = w & 0xff;
    if (idx >= len) break;
  }
  return u8;
}
