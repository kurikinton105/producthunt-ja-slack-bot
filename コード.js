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
    
    // 最新のエントリーを取得
    const latestEntry = recentEntries[0];
    
    // 必要な要素の取得
    const title = latestEntry.getChild('title', namespace);
    const content = latestEntry.getChild('content', namespace);
    const link = latestEntry.getChild('link', namespace);
    const published = latestEntry.getChild('published', namespace);
    const author = latestEntry.getChild('author', namespace);
    
    if (!title || !content || !link || !published || !author) {
      Logger.log('必要な要素が見つかりません');
      return null;
    }
    
    // HTMLコンテンツから説明文を抽出
    const contentText = content.getText();
    const descriptionMatch = contentText.match(/<p>(.*?)<\/p>/);
    if (!descriptionMatch) {
      Logger.log('説明文の抽出に失敗しました');
      return null;
    }
    
    const description = descriptionMatch[1].trim();
    
    return {
      title: title.getText(),
      description: description,
      link: link.getAttribute('href').getValue(),
      pubDate: published.getText(),
      author: author.getChild('name', namespace).getText()
    };
  } catch (error) {
    Logger.log('RSSフィードの解析に失敗: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
    return null;
  }
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
            text: `👤 ${post.author}`
          },
          {
            type: 'mrkdwn',
            text: `🔗 <${post.link}|ProductHuntで見る>`
          },
          {
            type: 'mrkdwn',
            text: `📅 ${post.pubDate}`
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