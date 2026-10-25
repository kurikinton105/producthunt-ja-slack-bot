from flask import Flask, Response
import feedparser
from googletrans import Translator
from xml.etree.ElementTree import Element, SubElement, tostring

app = Flask(__name__)

RSS_URL = 'https://www.producthunt.com/feed'
translator = Translator()

def translate_text(text, dest='ja'):
    try:
        return translator.translate(text, dest=dest).text
    except Exception:
        return text

@app.route('/rss-ja')
def rss_ja():
    feed = feedparser.parse(RSS_URL)
    rss = Element('rss', version='2.0')
    channel = SubElement(rss, 'channel')
    SubElement(channel, 'title').text = 'Product Hunt 日本語フィード'
    SubElement(channel, 'link').text = RSS_URL
    SubElement(channel, 'description').text = 'Product Huntの最新情報（日本語訳）'

    for entry in feed.entries[:10]:
        item = SubElement(channel, 'item')
        SubElement(item, 'title').text = translate_text(entry.title)
        SubElement(item, 'link').text = entry.link
        desc = entry.summary if hasattr(entry, 'summary') else ''
        SubElement(item, 'description').text = translate_text(desc)

    xml_str = tostring(rss, encoding='utf-8')
    return Response(xml_str, mimetype='application/rss+xml')

if __name__ == '__main__':
    app.run(debug=True)