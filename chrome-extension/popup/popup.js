/**
 * ImmoAssist Extension - Popup logic
 * Communicates with content script for page data, stores API key, calls import API.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'immoassist_api_key';
  const API_BASE = 'https://immoassist26b-f-production.up.railway.app/api/v1';

  const els = {
    authSection: document.getElementById('auth-section'),
    apiKeyInput: document.getElementById('api-key'),
    saveKeyBtn: document.getElementById('save-key'),
    authStatus: document.getElementById('auth-status'),
    dataSection: document.getElementById('data-section'),
    dataPreview: document.getElementById('data-preview'),
    transactionId: document.getElementById('transaction-id'),
    importBtn: document.getElementById('import-btn'),
    messageSection: document.getElementById('message-section'),
    messageText: document.getElementById('message-text'),
    messageLink: document.getElementById('message-link'),
    errorSection: document.getElementById('error-section'),
    errorText: document.getElementById('error-text'),
    noDataSection: document.getElementById('no-data-section'),
  };

  function showSection(section) {
    [els.authSection, els.dataSection, els.messageSection, els.errorSection, els.noDataSection].forEach(
      (s) => s && s.classList.add('hidden')
    );
    if (section) section.classList.remove('hidden');
  }

  function setMessage(text, linkUrl) {
    els.messageText.textContent = text;
    if (linkUrl) {
      els.messageLink.href = linkUrl;
      els.messageLink.classList.remove('hidden');
    } else {
      els.messageLink.classList.add('hidden');
    }
  }

  function setError(text) {
    els.errorText.textContent = text;
  }

  function getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => resolve(result[STORAGE_KEY] || ''));
    });
  }

  function saveApiKey(key) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: key || '' }, resolve);
    });
  }

  async function loadStoredKey() {
    const key = await getApiKey();
    if (key) {
      els.apiKeyInput.value = key;
      els.authStatus.textContent = 'Clé enregistrée.';
    }
  }

  async function requestPageData() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return null;
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { action: 'GET_PAGE_DATA' }, (response) => {
        if (chrome.runtime.lastError) resolve(null);
        else resolve(response);
      });
    });
  }

  async function doImport(apiKey, payload) {
    const url = `${API_BASE}/property-listings/import`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch (_) {
      body = { detail: text };
    }
    if (!res.ok) {
      const msg = body.detail || (typeof body.detail === 'string' ? body.detail : res.statusText);
      throw new Error(Array.isArray(msg) ? msg[0]?.msg || msg[0] : msg);
    }
    return body;
  }

  // Save API key
  els.saveKeyBtn.addEventListener('click', async () => {
    const key = (els.apiKeyInput.value || '').trim();
    if (!key) {
      els.authStatus.textContent = 'Entrez une clé API.';
      return;
    }
    await saveApiKey(key);
    els.authStatus.textContent = 'Clé enregistrée.';
  });

  // Import button
  els.importBtn.addEventListener('click', async () => {
    const apiKey = await getApiKey();
    if (!apiKey) {
      showSection(els.authSection);
      els.authStatus.textContent = 'Enregistrez d\'abord votre clé API.';
      return;
    }

    const txId = (els.transactionId.value || '').trim();
    const transactionId = txId ? parseInt(txId, 10) : null;
    if (txId && (isNaN(transactionId) || transactionId < 1)) {
      setError('ID de transaction invalide.');
      showSection(els.errorSection);
      return;
    }

    const response = await requestPageData();
    if (!response || !response.success || !response.data) {
      setError(response && response.error ? response.error : 'Aucune donnée extraite. Ouvrez une fiche Centris.');
      showSection(els.errorSection);
      return;
    }

    const data = response.data;
    els.importBtn.disabled = true;
    showSection(els.errorSection);
    setError('');

    try {
      const payload = {
        source_url: data.source_url || window.location.href,
        source_name: data.source_name || 'Centris',
        data: {
          title: data.title,
          address: data.address,
          city: data.city,
          price: data.price,
          description: data.description,
          details: data.details,
          raw: data.raw,
        },
        transaction_id: transactionId || undefined,
      };

      const result = await doImport(apiKey, payload);
      const baseUrl = 'https://immoassist26b-f-production.up.railway.app';
      setMessage(
        'Propriété importée avec succès.',
        result.id ? `${baseUrl}/fr/dashboard/transactions` : null
      );
      showSection(els.messageSection);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'import.');
      showSection(els.errorSection);
    } finally {
      els.importBtn.disabled = false;
    }
  });

  // On load: show auth or fetch page data
  (async function init() {
    await loadStoredKey();
    const response = await requestPageData();
    if (response && response.success && response.data) {
      const d = response.data;
      const lines = [];
      if (d.title) lines.push('Titre: ' + d.title);
      if (d.address) lines.push('Adresse: ' + d.address);
      if (d.price) lines.push('Prix: ' + d.price);
      if (d.description) lines.push('Description: ' + (d.description || '').slice(0, 200) + (d.description && d.description.length > 200 ? '…' : ''));
      els.dataPreview.textContent = lines.length ? lines.join('\n') : JSON.stringify(d, null, 2).slice(0, 500);
      showSection(els.dataSection);
    } else {
      showSection(els.noDataSection);
    }
  })();
})();
