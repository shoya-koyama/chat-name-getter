// ポップアップのメイン処理

function displayResults(names) {
  const resultsDiv = document.getElementById('results');
  const statusDiv = document.getElementById('status');
  
  if (names.length === 0) {
    resultsDiv.innerHTML = '<div class="empty">span class="nzVtF" の data-name が見つかりませんでした</div>';
    statusDiv.textContent = '';
    return;
  }
  
  const uniqueNames = [...new Set(names.map(n => n.dataName))];
  
  let html = '';
  uniqueNames.forEach((name, index) => {
    html += `
      <div class="item">
        <div class="item-label">データ ${index + 1}</div>
        <div class="item-value">${escapeHtml(name)}</div>
      </div>
    `;
  });
  
  resultsDiv.innerHTML = html;
  statusDiv.textContent = `抽出されたデータ: ${uniqueNames.length} 件`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function fetchNames() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      document.getElementById('results').innerHTML = '<div class="empty">タブ情報を取得できません</div>';
      return;
    }
    
    // タイムアウト付きでメッセージ送信
    const timeoutId = setTimeout(() => {
      document.getElementById('results').innerHTML = '<div class="empty">Google Chat ページが応答しません。ページをリロードしてください</div>';
    }, 5000);
    
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getNames' }, (response) => {
      clearTimeout(timeoutId);
      
      if (chrome.runtime.lastError) {
        let errorMsg = 'Google Chat ページを開いてください';
        
        // エラーの詳細に応じてメッセージを切り替え
        if (chrome.runtime.lastError.message.includes('Could not establish connection')) {
          errorMsg = 'コンテンツスクリプトがロードされていません。ページをリロードしてください';
        }
        
        document.getElementById('results').innerHTML = `<div class="empty">${escapeHtml(errorMsg)}</div>`;
        return;
      }
      
      if (response && response.names) {
        displayResults(response.names);
      } else if (response && response.error) {
        document.getElementById('results').innerHTML = `<div class="empty">エラー: ${escapeHtml(response.error)}</div>`;
      } else {
        document.getElementById('results').innerHTML = '<div class="empty">予期しないエラーが発生しました</div>';
      }
    });
  });
}

function copyToClipboard() {
  const resultsDiv = document.getElementById('results');
  const items = resultsDiv.querySelectorAll('.item-value');
  
  if (items.length === 0) {
    alert('コピーするデータがありません');
    return;
  }
  
  const text = Array.from(items)
    .map(item => item.textContent)
    .join('\n');
  
  navigator.clipboard.writeText(text)
    .then(() => {
      alert('クリップボードにコピーしました！');
    })
    .catch(err => {
      console.error('コピーに失敗しました:', err);
      alert('クリップボードへのコピーに失敗しました');
    });
}

// イベントリスナーを設定
function setupEventListeners() {
  const refreshBtn = document.getElementById('refreshBtn');
  const copyBtn = document.getElementById('copyBtn');
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', fetchNames);
  }
  if (copyBtn) {
    copyBtn.addEventListener('click', copyToClipboard);
  }
}

// ポップアップを開いたときに自動取得
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchNames();
  });
} else {
  setupEventListeners();
  fetchNames();
}
