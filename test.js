function testHtmlToMarkdown() {
  // テストケース1: 基本的なHTMLタグの変換
  const test1 = {
    input: '<p>これは段落です</p><p>これは2つ目の段落です</p>',
    expected: 'これは段落です\n\nこれは2つ目の段落です'
  };
  
  // テストケース2: リンクの変換
  const test2 = {
    input: 'こちらは<a href="https://example.com">リンク</a>です',
    expected: 'こちらは<https://example.com|リンク>です'
  };
  
  // テストケース3: 複数のリンクと書式
  const test3 = {
    input: '<p><strong>太字</strong>と<em>斜体</em>と<a href="https://test1.com">リンク1</a>と<a href="https://test2.com">リンク2</a></p>',
    expected: '**太字**と*斜体*と<https://test1.com|リンク1>と<https://test2.com|リンク2>'
  };
  
  // テストケース4: 特殊文字の変換
  const test4 = {
    input: '&amp;と&lt;と&gt;と&quot;と&#39;',
    expected: '&と<と>と"と\''
  };
  
  // テストケース5: 改行タグの変換
  const test5 = {
    input: 'これは<br>改行<br/>です',
    expected: 'これは\n改行\nです'
  };
  
  // テストケース6: 空入力
  const test6 = {
    input: '',
    expected: ''
  };
  
  // テストケース7: 不正なHTML
  const test7 = {
    input: '<p>閉じタグがない<strong>太字<em>斜体</p>',
    expected: '閉じタグがない**太字**斜体'
  };

  const test8 = {
    input: '<p>\nCapture notes on every new Tab\n</p>\n<p>\n<a href="https://www.producthunt.com/posts/noteux-chrome-extension?utm_campaign=producthunt-atom-posts-feed&amp;utm_medium=rss-feed&amp;utm_source=producthunt-atom-posts-feed">Discussion</a>\n|\n<a href="https://www.producthunt.com/r/p/949372?app_id=339">Link</a>\n</p>',
    expected: ''
  }

  // テストの実行
  const testCases = [test1, test2, test3, test4, test5, test6, test7, test8];
  
  testCases.forEach((test, index) => {
    const result = htmlToMarkdown(test.input);
    const passed = result === test.expected;
    
    Logger.log(`テストケース ${index + 1}: ${passed ? '成功' : '失敗'}`);
    if (!passed) {
      Logger.log('期待値: ' + test.expected);
      Logger.log('実際の結果: ' + result);
    }
  });
}

// テスト実行用の関数
function runTests() {
  testHtmlToMarkdown();
}