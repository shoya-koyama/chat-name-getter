// Google Chat のメッセージから data-name 属性を抽出する

function getMessageNames() {
  const results = [];
  
  // span class="nzVtF" 内の span[data-name] を直接取得
  // data-name は span.nzVtF の直下の子要素に設定されている
  const spans = document.querySelectorAll('span.nzVtF span[data-name]');
  
  // 最後の10件に限定
  const recentSpans = Array.from(spans).slice(-10);
  
  recentSpans.forEach((span, index) => {
    const dataName = span.getAttribute('data-name');
    if (dataName && dataName.trim()) {
      results.push({
        index: recentSpans.length - index,
        dataName: dataName,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  });
  
  return results;
}

// 入力欄に含まれるメンション名を抽出
function getMentionsInEditor() {
  const mentions = [];
  
  // contenteditable の入力欄内のメンション要素を取得
  const mentionSpans = document.querySelectorAll('[contenteditable="true"] [data-user-mention-type]');
  
  mentionSpans.forEach(span => {
    const displayName = span.getAttribute('data-display-name');
    if (displayName) {
      // @ 記号を除いた名前を取得
      const name = displayName.replace(/^@/, '');
      mentions.push(name);
    }
  });
  
  return mentions;
}

// メンションが過去10件のメッセージに含まれているか確認
function checkMentionsAgainstHistory() {
  const mentionsInEditor = getMentionsInEditor();
  const messageNames = getMessageNames();
  
  // data-name の値を抽出
  const existingNames = messageNames.map(m => m.dataName);
  
  // メンションされたが過去10件にない名前を検出
  const notFoundMentions = mentionsInEditor.filter(
    mention => !existingNames.includes(mention)
  );
  
  return {
    mentionsInEditor: mentionsInEditor,
    existingNames: existingNames,
    notFoundMentions: notFoundMentions
  };
}

// 送信ボタン監視
function setupSendButtonMonitor() {
  // 送信ボタンをクリックしようとしたときに検証
  document.addEventListener('keydown', (e) => {
    // Ctrl+Enter または Cmd+Enter で送信
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const messageNames = getMessageNames();
      
      // メッセージが5件未満の場合はチェックしない
      if (messageNames.length < 5) {
        return;
      }
      
      const check = checkMentionsAgainstHistory();
      
      if (check.notFoundMentions.length > 0) {
        e.preventDefault();
        const message = `以下のメンションが過去10件のメッセージに見つかりません。本当に送信しますか？\n\n見つからない名前:\n${check.notFoundMentions.join('\n')}`;
        
        if (!confirm(message)) {
          return false;
        }
      }
    }
  }, true);
  
  // マウスクリックの送信ボタンも監視
  document.addEventListener('click', (e) => {
    const sendBtn = e.target.closest('[aria-label*="送信"]') || e.target.closest('button[aria-label*="Send"]');
    if (sendBtn) {
      const messageNames = getMessageNames();
      
      // メッセージが5件未満の場合はチェックしない
      if (messageNames.length < 5) {
        return;
      }
      
      const check = checkMentionsAgainstHistory();
      
      if (check.notFoundMentions.length > 0) {
        const message = `以下のメンションが過去10件のメッセージに見つかりません。本当に送信しますか？\n\n見つからない名前:\n${check.notFoundMentions.join('\n')}`;
        
        if (!confirm(message)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    }
  }, true);
}

// ページ読み込み完了後に監視を開始
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupSendButtonMonitor);
} else {
  setupSendButtonMonitor();
}

// ポップアップからのメッセージを受け取る
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getNames') {
    const names = getMessageNames();
    sendResponse({ names: names });
  }
});
