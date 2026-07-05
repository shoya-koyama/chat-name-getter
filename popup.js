// ポップアップのメイン処理

function displayResults(names) {
  const resultsDiv = document.getElementById('results');
  const statusDiv = document.getElementById('status');
  
  if (names.length === 0) {
    resultsDiv.innerHTML = '<div class="empty">span class="nzVtF" の data-name が見つかりませんでした</div>';
    statusDiv.textContent = '';
    return;
  }
  
  // 重複を排除
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
    
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getNames' }, (response) => {
      if (chrome.runtime.lastError) {
        document.getElementById('results').innerHTML = '<div class="empty">Google Chat ページを開いてください</div>';
        return;
      }
      
      if (response && response.names) {
        displayResults(response.names);
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
  
  navigator.clipboard.writeText(text).then(() => {
    alert('クリップボードにコピーしました！');
  }).catch(err => {
    console.error('コピーに失敗しました:', err);
  });
}

// イベントリスナー
document.getElementById('refreshBtn').addEventListener('click', fetchNames);
document.getElementById('copyBtn').addEventListener('click', copyToClipboard);

// ポップアップを開いたときに自動取得
fetchNames();
