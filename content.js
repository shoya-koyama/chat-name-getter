// Google Chat のメッセージから data-name 属性を抽出する
// キャッシュとパフォーマンス最適化用
// 前回取得したメッセージ名のキャッシュ
let cachedMessageNames = [];
// キャッシュが作成された時刻
let lastCacheTime = 0;
// キャッシュの有効期限（ミリ秒）
const CACHE_DURATION = 1000; // 1秒
// イベントリスナーが初期化済みかどうかのフラグ
let isListenerInitialized = false;

// 過去10件のメッセージから data-name 属性を取得する関数
function getMessageNames() {
  // 現在の時刻を取得
  const now = Date.now();
  
  // キャッシュが有効な場合はそれを使用
  // キャッシュの有効期限内で、かつキャッシュが空でない場合
  if (now - lastCacheTime < CACHE_DURATION && cachedMessageNames.length > 0) {
    // キャッシュされたメッセージ名を返す
    return cachedMessageNames;
  }
  
  // 新しい結果配列を作成
  const results = [];
  
  // エラーハンドリング用の try-catch ブロック
  try {
    // span class="nzVtF" 内の span[data-name] 要素をすべて取得
    const spans = document.querySelectorAll('span.nzVtF span[data-name]');
    // 最後の10個の要素のみを取得
    const recentSpans = Array.from(spans).slice(-10);
    
    // 各要素に対してループ処理
    recentSpans.forEach((span, index) => {
      // 要素から data-name 属性の値を取得
      const dataName = span.getAttribute('data-name');
      // 名前が存在し、空白以外の文字を含む場合
      if (dataName && dataName.trim()) {
        // 結果オブジェクトを配列に追加
        results.push({
          // インデックス（逆順: 新しい順）
          index: recentSpans.length - index,
          // 抽出した名前
          dataName: dataName,
          // タイムスタンプ
          timestamp: new Date().toLocaleTimeString()
        });
      }
    });
    
    // 取得した結果をキャッシュに保存
    cachedMessageNames = results;
    // キャッシュ作成時刻を更新
    lastCacheTime = now;
  } catch (err) {
    // エラーをコンソールに出力
    console.error('Error fetching message names:', err);
  }
  
  // 結果配列を返す
  return results;
}

// 入力欄に含まれるメンション名を抽出する関数
function getMentionsInEditor() {
  // メンション名を格納する配列
  const mentions = [];
  
  // エラーハンドリング用の try-catch ブロック
  try {
    // contenteditable="true" 内の data-user-mention-type を持つ要素を取得
    const mentionSpans = document.querySelectorAll('[contenteditable="true"] [data-user-mention-type]');
    
    // 各メンション要素に対してループ処理
    mentionSpans.forEach(span => {
      // 要素から data-display-name 属性の値を取得
      const displayName = span.getAttribute('data-display-name');
      // 表示名が存在する場合
      if (displayName) {
        // "@" 記号を削除して名前を抽出
        const name = displayName.replace(/^@/, '');
        // 名前を配列に追加
        mentions.push(name);
      }
    });
  } catch (err) {
    // エラーをコンソールに出力
    console.error('Error fetching mentions:', err);
  }
  
  // メンション名の配列を返す
  return mentions;
}

// メンションが過去10件のメッセージに含まれているか確認する関数
function checkMentionsAgainstHistory() {
  // 入力欄内のメンション名を取得
  const mentionsInEditor = getMentionsInEditor();
  // 過去のメッセージ名を取得
  const messageNames = getMessageNames();
  
  // メッセージの data-name 値のみを抽出
  const existingNames = messageNames.map(m => m.dataName);
  
  // メンションされたが過去10件に見つからない名前をフィルタ
  const notFoundMentions = mentionsInEditor.filter(
    // 既存の名前に含まれていない場合のみ抽出
    mention => !existingNames.includes(mention)
  );
  
  // 検証結果をオブジェクトで返す
  return {
    // 入力欄内のメンション名
    mentionsInEditor: mentionsInEditor,
    // 過去10件に存在する名前
    existingNames: existingNames,
    // 見つからないメンション名
    notFoundMentions: notFoundMentions
  };
}

// キャッシュを無効化する関数（新しいメッセージが追加された時に呼ばれる）
function invalidateCache() {
  // キャッシュの時刻をリセット（次回に新しいデータを取得させる）
  lastCacheTime = 0;
}

// MutationObserver でメッセージ変更を監視する関数
function setupMutationObserver() {
  // エラーハンドリング用の try-catch ブロック
  try {
    // DOM変更を監視するオブザーバーを作成
    const observer = new MutationObserver(() => {
      // DOM変更時にキャッシュを無効化
      invalidateCache();
    });
    
    // オブザーバーの設定
    // subtree: true → 子孫ノードの変更も監視
    // childList: true → 子ノード追加削除を監視
    // attributes: false → 属性変更は監視しない
    const config = { subtree: true, childList: true, attributes: false };
    // document.body が存在する場合、監視を開始
    document.body && observer.observe(document.body, config);
  } catch (err) {
    // エラーをコンソールに出力
    console.error('Error setting up mutation observer:', err);
  }
}

// 送信前に検証する共通ロジック関数
function validateBeforeSend() {
  // 過去のメッセージ名を取得
  const messageNames = getMessageNames();
  // デバッグ: メッセージ件数をログ出力
  // console.log('[validateBeforeSend] Message count:', messageNames.length);
  
  // メッセージが5件未満の場合はチェックしない
  // 5件未満であれば検証をスキップして true を返す
  if (messageNames.length < 5) {
    // console.log('[validateBeforeSend] Message count < 5, skipping validation');
    return true;
  }
  
  // メンション検証を実行
  const check = checkMentionsAgainstHistory();
  // デバッグ: メンション検証結果をログ出力
  // console.log('[validateBeforeSend] Mentions in editor:', check.mentionsInEditor);
  // console.log('[validateBeforeSend] Not found mentions:', check.notFoundMentions);
  
  // 見つからないメンションが存在する場合
  if (check.notFoundMentions.length > 0) {
    // 確認ダイアログ用のメッセージを作成
    const message = `以下のメンションが過去10件のメッセージに見つかりません。本当に送信しますか？\n\n見つからない名前:\n${check.notFoundMentions.join('\n')}`;
    // デバッグ: ダイアログを表示することをログ出力
    // console.log('[validateBeforeSend] Showing confirm dialog');
    // ユーザーに確認を取り、結果を返す
    return confirm(message);
  }
  
  // 見つからないメンションがない場合は true を返す
  // console.log('[validateBeforeSend] No unfound mentions, allowing send');
  return true;
}

// 入力欄の内容をクリアする関数
function clearEditorContent() {
  // エラーハンドリング用の try-catch ブロック
  try {
    // contenteditable="true" かつ class="hj99tb" の要素を取得
    const editor = document.querySelector('[contenteditable="true"].hj99tb');
    // エディタが存在する場合
    if (editor) {
      // テキスト内容をクリア
      editor.textContent = '';
      // input イベントをトリガー（Google Chat の状態を同期）
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    }
  } catch (err) {
    // エラーをコンソールに出力
    console.error('Error clearing editor:', err);
  }
}

// Keydown イベント監視関数（Enter キー送信用）
function setupKeydownListener() {
  // keydown イベントリスナーを追加
  document.addEventListener('keydown', (e) => {
    // contenteditable の入力欄が対象かを確認
    const editor = document.querySelector('[contenteditable="true"].hj99tb');
    // イベント発火元が入力欄またはその子要素か確認
    const isInEditor = editor && (e.target === editor || editor.contains(e.target));
    
    // Enter キーが押され、かつ入力欄内か確認
    if (e.key === 'Enter' && isInEditor && !e.shiftKey) {
      // デバッグ: Enter キーが検出されたことをログ出力
      // console.log('[keydown] Enter detected in editor, running validation');
      // 送信前検証を実行
      if (!validateBeforeSend()) {
        // 検証に失敗した場合、イベントをキャンセル
        // ブラウザのデフォルト動作を抑止
        e.preventDefault();
        // イベントの伝播を停止
        e.stopPropagation();
      }
    }
  }, true);
}

// 送信ボタン監視関数（より信頼性の高い方法）
function setupClickListener() {
  // click イベントリスナーを追加
  document.addEventListener('click', (e) => {
    // 複数のセレクタで送信ボタンを検出（堅牢性向上）
    // いずれかのセレクタにマッチした場合は送信ボタンとみなす
    const isSendBtn = 
      // 英語の "Send" ラベルを持つボタン
      e.target.closest('button[aria-label*="Send"]') ||
      // 日本語の "送信" ラベルを持つボタン
      e.target.closest('button[aria-label*="送信"]') ||
      // Google Chat 固有の要素セレクタ（jsname="oU6v8b"）内のボタン
      e.target.closest('[jsname="oU6v8b"] button') ||
      // role="button" かつ "send" を含む aria-label
      e.target.closest('[role="button"][aria-label*="send"]');
    
    // デバッグ: クリック対象をログ出力
    // console.log('[click] Clicked element:', e.target.tagName, e.target.className);
    
    // 送信ボタンがクリックされた場合
    if (isSendBtn) {
      // デバッグ: 送信ボタンが検出されたことをログ出力
      // console.log('[click] Send button detected, running validation');
      // 送信前検証を実行
      if (!validateBeforeSend()) {
        // 検証に失敗した場合、イベントをキャンセル
        // ブラウザのデフォルト動作を抑止
        e.preventDefault();
        // イベントの伝播を停止
        e.stopPropagation();
      }
    }
  }, true);
}

// 送信ボタン監視を初期化する関数（一度だけ実行）
function setupSendButtonMonitor() {
  // デバッグ: 初期化の開始をログ出力
  // console.log('[setupSendButtonMonitor] Starting initialization');
  
  // リスナーが既に初期化されている場合
  if (isListenerInitialized) {
    // デバッグ: 既に初期化されていることをログ出力
    // console.log('[setupSendButtonMonitor] Already initialized, skipping');
    // 二重登録を防ぐため関数を終了
    return;
  }
  
  // エラーハンドリング用の try-catch ブロック
  try {
    // Keydown イベントリスナーを設定
    // console.log('[setupSendButtonMonitor] Setting up keydown listener');
    setupKeydownListener();
    
    // Click イベントリスナーを設定
    // console.log('[setupSendButtonMonitor] Setting up click listener');
    setupClickListener();
    
    // MutationObserver を設定
    // console.log('[setupSendButtonMonitor] Setting up mutation observer');
    setupMutationObserver();
    
    // 初期化済みフラグを true に設定
    isListenerInitialized = true;
    // デバッグ: 初期化完了をログ出力
    // console.log('[setupSendButtonMonitor] Initialization completed successfully');
  } catch (err) {
    // エラーをコンソールに出力
    console.error('Error setting up send button monitor:', err);
  }
}

// ページ読み込み完了後に監視を開始
// デバッグ: document.readyState をログ出力
// console.log('[content.js] document.readyState:', document.readyState);

// ページ読み込みがまだ進行中の場合
if (document.readyState === 'loading') {
  // デバッグ: DOMContentLoaded イベントを待つことをログ出力
  // console.log('[content.js] Document is loading, waiting for DOMContentLoaded');
  // DOM構築完了時に監視を開始
  document.addEventListener('DOMContentLoaded', setupSendButtonMonitor);
} else {
  // デバッグ: 直ちに初期化することをログ出力
  // console.log('[content.js] Document ready, initializing immediately');
  // すでにDOM構築が完了している場合、直ちに監視を開始
  setupSendButtonMonitor();
}

// ポップアップからのメッセージを受け取るリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // エラーハンドリング用の try-catch ブロック
  try {
    // リクエストアクションが "getNames" の場合
    if (request.action === 'getNames') {
      // メッセージ名を取得
      const names = getMessageNames();
      // レスポンスを返す
      sendResponse({ names: names });
    }
  } catch (err) {
    // エラーをコンソールに出力
    console.error('Error in message listener:', err);
    // エラー情報をレスポンスで返す
    sendResponse({ names: [], error: err.message });
  }
});
