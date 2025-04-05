// 定数定義
const PRODUCT_HUNT_RSS_URL = 'https://www.producthunt.com/feed?category=undefined';
const SLACK_WEBHOOK_URL = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
const OPENAI_API_KEY = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');

// メイン処理
function main() {
  try {
    // RSSフィードの取得
    const feed = fetchRSSFeed();
    if (!feed) {
      Logger.log('RSSフィードの取得に失敗しました');
      return;
    }
    
    Logger.log("RSSフィードの取得が完了")
    // 最新の投稿を取得
    const posts = parseRSSFeed(feed);
    if (!posts || posts.length === 0) {
      Logger.log('RSSフィードの解析に失敗しました');
      return;
    }
    Logger.log("RSSフィードの解析が完了")

    // 翻訳
    const translatedPosts = posts.map(post => translatePost(post));
    if (!translatedPosts || translatedPosts.length === 0) {
      Logger.log('翻訳に失敗しました');
      return;
    }
    Logger.log("翻訳が完了", translatedPosts)

    // Slackに投稿
    postToSlack(translatedPosts);
    
    Logger.log('処理が正常に完了しました');
  } catch (error) {
    Logger.log('エラーが発生しました: ' + error.toString());
  }
}

// RSSフィードの取得
function fetchRSSFeed() {
  try {
    const response = UrlFetchApp.fetch(PRODUCT_HUNT_RSS_URL);
    return response.getContentText();
  } catch (error) {
    Logger.log('RSSフィードの取得に失敗: ' + error.toString());
    return null;
  }
}

// RSSフィードの解析
function parseRSSFeed(feed) {
  try {
    Logger.log('フィードの解析を開始');
    const document = XmlService.parse(feed);
    const root = document.getRootElement();
    Logger.log('ルート要素: ' + root.getName());
    
    const namespace = XmlService.getNamespace('http://www.w3.org/2005/Atom');
    Logger.log('名前空間: ' + namespace.getURI());
    
    const entries = root.getChildren('entry', namespace);
    Logger.log('エントリー数: ' + entries.length);
    
    if (!entries || entries.length === 0) {
      Logger.log('エントリーが見つかりませんでした');
      return null;
    }
    
    // 過去1日のエントリーを取得
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const recentEntries = entries.filter(entry => {
      const published = entry.getChild('published', namespace);
      if (!published) {
        Logger.log('published要素が見つかりません');
        return false;
      }
      
      const publishedDate = new Date(published.getText());
      return publishedDate > oneDayAgo;
    });
    
    if (recentEntries.length === 0) {
      Logger.log('過去1日のエントリーが見つかりませんでした');
      return null;
    }
    
    Logger.log('過去1日のエントリー数: ' + recentEntries.length);
    
    // 各エントリーの情報を取得
    return recentEntries.map(entry => {
      const title = entry.getChild('title', namespace);
      const content = entry.getChild('content', namespace);
      const link = entry.getChild('link', namespace);
      const published = entry.getChild('published', namespace);
      const author = entry.getChild('author', namespace);
      
      if (!title || !content || !link || !published || !author) {
        Logger.log('必要な要素が見つかりません');
        return null;
      }
      
      return {
        title: title.getText(),
        description: htmlToMarkdown(content.getText()),
        link: link.getAttribute('href').getValue(),
        pubDate: published.getText(),
        author: author.getChild('name', namespace).getText()
      };
    }).filter(entry => entry !== null);
  } catch (error) {
    Logger.log('RSSフィードの解析に失敗: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
    return null;
  }
}

// 投稿の翻訳
function translatePost(post) {
  try {
    const title = post.title;
    const description = translateText(post.description);
    Logger.log(title),
    Logger.log(description)
    Logger.log({
      ...post,
      translatedTitle: title,
      translatedDescription: description
    })
    return {
      ...post,
      translatedTitle: title,
      translatedDescription: description
    };
  } catch (error) {
    Logger.log('翻訳に失敗: ' + error.toString());
    return null;
  }
}

// OpenAI APIを使用した翻訳
function translateText(text) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + OPENAI_API_KEY,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'あなたは優秀な翻訳者です。英語を自然な日本語に翻訳してください。'
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3
    })
  };

  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());
  return json.choices[0].message.content;
}

// Slackへの投稿
function postToSlack(posts) {
  const message = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🚀 昨日の新着プロダクト (${posts.length}件)`
        }
      },
      ...posts.map(post => ({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${post.title}*\n${post.translatedDescription}\n🔗 <${post.link}|ProductHuntで見る>\n📅 ${post.pubDate}`
        }
      }))
    ]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(message)
  };

  UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options);
}

function htmlToMarkdown(html) {
  try {
    if (!html) return '';
    
    // 基本的なHTMLタグをMarkdownに変換
    let markdown = html
      // Slackリンク形式に変換（一時的なマーカーを使用）
      .replace(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g, '§§LINK§§$1|$2§§ENDLINK§§')
      // 他のタグの処理
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<br\s*\/?>/g, '\n')
      // その他のHTMLタグを削除
      .replace(/<[^>]+>/g, '')
      // 特殊文字の変換
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // 一時的なマーカーを実際のSlackリンク形式に戻す
      .replace(/§§LINK§§(.*?)\|(.*?)§§ENDLINK§§/g, '<$1|$2>')
      // Slackリンク間の区切り文字の周りの空白を整理
      .replace(/\s*\|\s*/g, ' | ')
      .trim();
    
    return markdown;
  } catch (error) {
    Logger.log('HTMLのMarkdown変換に失敗: ' + error.toString());
    return html;
  }
}