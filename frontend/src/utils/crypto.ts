// Promisified helper to initialize and get IndexedDB instance
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LinkeDocCryptoDB', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('keypair')) {
        db.createObjectStore('keypair');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Retrieve local ECDH keypair from IndexedDB
export async function getStoredKeyPair(): Promise<CryptoKeyPair | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('keypair', 'readonly');
    const store = tx.objectStore('keypair');
    const req = store.get('ecdh');
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

// Save local ECDH keypair to IndexedDB
export async function storeKeyPair(keyPair: CryptoKeyPair): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('keypair', 'readwrite');
    const store = tx.objectStore('keypair');
    const req = store.put(keyPair, 'ecdh');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Export a CryptoKey object to Base64 SPKI format
export async function exportPublicKeyToBase64(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('spki', key);
  const arr = new Uint8Array(exported);
  let binary = '';
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return window.btoa(binary);
}

// Import a public key from Base64 SPKI format
export async function importPublicKeyFromBase64(base64: string): Promise<CryptoKey> {
  const binaryStr = window.atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return window.crypto.subtle.importKey(
    'spki',
    bytes.buffer,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );
}

/**
 * Generates an ECDH P-256 key pair if not already stored, saves it in IndexedDB,
 * and returns the base64-encoded public key.
 */
export async function generateAndStoreKeys(): Promise<string> {
  const existing = await getStoredKeyPair();
  if (existing) {
    return exportPublicKeyToBase64(existing.publicKey);
  }

  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  );

  await storeKeyPair(keyPair);
  return exportPublicKeyToBase64(keyPair.publicKey);
}

/**
 * Derives a shared symmetric AES-GCM 256-bit key from the local private key
 * and a peer's public key.
 */
export async function deriveSharedKey(peerPublicKeyBase64: string): Promise<CryptoKey> {
  const keyPair = await getStoredKeyPair();
  if (!keyPair) {
    throw new Error('Local E2EE key pair not generated');
  }

  const peerPublicKey = await importPublicKeyFromBase64(peerPublicKeyBase64);

  return window.crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: peerPublicKey,
    },
    keyPair.privateKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // The derived key does not need to be exported
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using an AES-GCM shared key.
 * Prepends the random 12-byte IV to the ciphertext and returns as a single base64 string.
 */
export async function encryptMessage(text: string, aesKey: CryptoKey): Promise<string> {
  const enc = new TextEncoder();
  const encodedText = enc.encode(text);

  // Generate 12-byte random initialization vector
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    aesKey,
    encodedText
  );

  // Concatenate IV and ciphertext into a single buffer
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  let binary = '';
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return window.btoa(binary);
}

/**
 * Decrypts a base64-encoded payload (containing a 12-byte IV prepended to the ciphertext)
 * using the AES-GCM shared key.
 */
export async function decryptMessage(ciphertextBase64: string, aesKey: CryptoKey): Promise<string> {
  const binaryStr = window.atob(ciphertextBase64);
  const combined = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    combined[i] = binaryStr.charCodeAt(i);
  }

  if (combined.length < 12) {
    throw new Error('Invalid E2EE message format');
  }

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    aesKey,
    ciphertext.buffer
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
}
