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

// ポップアップからのメッセージを受け取る
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getNames') {
    const names = getMessageNames();
    sendResponse({ names: names });
  }
});
