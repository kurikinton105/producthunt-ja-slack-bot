// 定数定義
const PRODUCT_HUNT_RSS_URL = 'https://www.producthunt.com/feed';
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

    // 最新の投稿を取得
    const latestPost = parseRSSFeed(feed);
    if (!latestPost) {
      Logger.log('RSSフィードの解析に失敗しました');
      return;
    }

    // 翻訳
    const translatedPost = translatePost(latestPost);
    if (!translatedPost) {
      Logger.log('翻訳に失敗しました');
      return;
    }

    // Slackに投稿
    postToSlack(translatedPost);
    
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
    const document = XmlService.parse(feed);
    const root = document.getRootElement();
    const channel = root.getChild('channel');
    const item = channel.getChildren('item')[0]; // 最新の投稿を取得

    return {
      title: item.getChild('title').getText(),
      description: item.getChild('description').getText(),
      link: item.getChild('link').getText(),
      pubDate: item.getChild('pubDate').getText(),
      categories: item.getChildren('category').map(cat => cat.getText())
    };
  } catch (error) {
    Logger.log('RSSフィードの解析に失敗: ' + error.toString());
    return null;
  }
}

// 投稿の翻訳
function translatePost(post) {
  try {
    const title = translateText(post.title);
    const description = translateText(post.description);

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
function postToSlack(post) {
  const message = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚀 新着プロダクト: ' + post.translatedTitle
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: post.translatedDescription
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `🔗 <${post.link}|ProductHuntで見る>`
          },
          {
            type: 'mrkdwn',
            text: `📅 ${post.pubDate}`
          },
          {
            type: 'mrkdwn',
            text: `🏷️ ${post.categories.join(', ')}`
          }
        ]
      }
    ]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(message)
  };

  UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options);
}

// トリガーの設定
function setTrigger() {
  // 既存のトリガーを削除
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  // 新しいトリガーを設定（毎日午前9時に実行）
  ScriptApp.newTrigger('main')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .create();
}
