let ws;
let isListening = false;

const apiKeyInput = document.getElementById('apiKey');
const saveKeyBtn = document.getElementById('saveKey');
const cancelKeyBtn = document.getElementById('cancelKey');
const settingsBtn = document.getElementById('settingsBtn');
const apiKeyModal = document.getElementById('apiKeyModal');
const startBtn = document.getElementById('startDesktop');
const stopBtn = document.getElementById('stop');
const statusEl = document.getElementById('status');
const translationsEl = document.getElementById('translations');
const manualTextInput = document.getElementById('manualText');
const translateBtn = document.getElementById('translateBtn');
const translateSection = document.getElementById('translateSection');

// Collapsible toggle
translateSection.querySelector('.collapsible-header').onclick = () => {
  translateSection.classList.toggle('open');
};

// Modal controls
settingsBtn.onclick = () => {
  apiKeyModal.classList.add('show');
  apiKeyInput.value = localStorage.getItem('geminiApiKey') || '';
  apiKeyInput.focus();
};

cancelKeyBtn.onclick = () => {
  apiKeyModal.classList.remove('show');
};

apiKeyModal.onclick = (e) => {
  if (e.target === apiKeyModal) apiKeyModal.classList.remove('show');
};

function connectWS() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${window.location.host}`);
  
  ws.onopen = () => {
    const savedKey = localStorage.getItem('geminiApiKey');
    if (savedKey) {
      statusEl.textContent = 'Connecting...';
      ws.send(JSON.stringify({ type: 'setApiKey', apiKey: savedKey }));
    } else {
      statusEl.textContent = 'Click ⚙️ API Key to configure';
    }
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'apiKeySet') {
      statusEl.textContent = '✅ Ready! Click Start Microphone.';
      statusEl.style.background = 'rgba(76,175,80,0.3)';
      startBtn.disabled = false;
      translateBtn.disabled = false;
      apiKeyModal.classList.remove('show');
    } else if (data.type === 'whisperStarted') {
      statusEl.textContent = '🎙️ Listening via whisper-stream...';
      statusEl.style.background = 'rgba(156,39,176,0.3)';
      isListening = true;
      startBtn.disabled = true;
      stopBtn.disabled = false;
      translateBtn.disabled = true;
    } else if (data.type === 'transcription') {
      statusEl.textContent = '🎙️ ' + data.text.substring(0, 60) + '...';
    } else if (data.type === 'translation') {
      addTranslation(data.original, data.translated, data.direction);
    } else if (data.type === 'whisperStopped') {
      statusEl.textContent = '⏹️ Stopped';
      statusEl.style.background = 'rgba(255,255,255,0.1)';
      isListening = false;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      translateBtn.disabled = false;
    } else if (data.type === 'error') {
      statusEl.textContent = '❌ ' + data.message;
      statusEl.style.background = 'rgba(244,67,54,0.3)';
    }
  };
  
  ws.onerror = (err) => console.error('WebSocket error:', err);
  ws.onclose = () => setTimeout(connectWS, 2000);
}
connectWS();

// Save API Key
saveKeyBtn.onclick = () => {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) return alert('Please enter an API key');
  localStorage.setItem('geminiApiKey', apiKey);
  if (ws.readyState === WebSocket.OPEN) {
    statusEl.textContent = 'Validating API key...';
    ws.send(JSON.stringify({ type: 'setApiKey', apiKey }));
  }
};

apiKeyInput.onkeypress = (e) => { if (e.key === 'Enter') saveKeyBtn.click(); };

// Manual text translation
translateBtn.onclick = () => {
  const text = manualTextInput.value.trim();
  if (!text) return;
  if (ws.readyState === WebSocket.OPEN) {
    statusEl.textContent = '📤 Translating...';
    ws.send(JSON.stringify({ type: 'translate', text }));
    manualTextInput.value = '';
  }
};
manualTextInput.onkeypress = (e) => { if (e.key === 'Enter') translateBtn.click(); };

// Start whisper-stream
startBtn.onclick = () => {
  if (ws.readyState === WebSocket.OPEN) {
    statusEl.textContent = '🎙️ Starting whisper-stream...';
    ws.send(JSON.stringify({ type: 'startWhisper' }));
  }
};

// Stop
stopBtn.onclick = () => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'stopWhisper' }));
  }
};

// Add translation to display
function addTranslation(original, translated, direction) {
  const isCantonese = direction === 'cantonese-to-english';
  
  const entryDiv = document.createElement('div');
  entryDiv.style.cssText = 'padding:12px;margin-bottom:12px;background:rgba(255,255,255,0.05);border-radius:8px;border-left:3px solid #4CAF50';
  
  if (isCantonese) {
    entryDiv.innerHTML = `
      <div style="margin-bottom:6px"><span style="color:#FFD700;font-weight:bold">粵-</span> ${original}</div>
      <div><span style="color:#4CAF50;font-weight:bold">EN-</span> ${translated}</div>
    `;
  } else {
    entryDiv.innerHTML = `
      <div style="margin-bottom:6px"><span style="color:#4CAF50;font-weight:bold">EN-</span> ${original}</div>
      <div><span style="color:#FFD700;font-weight:bold">粵-</span> ${translated}</div>
    `;
  }
  
  translationsEl.insertBefore(entryDiv, translationsEl.firstChild);
  
  while (translationsEl.children.length > 20) {
    translationsEl.removeChild(translationsEl.lastChild);
  }
}
