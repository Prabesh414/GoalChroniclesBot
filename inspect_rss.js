import Parser from "rss-parser";
const parser = new Parser({ customFields: { item: ['media:content', 'enclosure'] }});

async function run() {
    const feed = await parser.parseURL("https://www.skysports.com/rss/11095");
    console.log(JSON.stringify(feed.items[0], null, 2));
}
run();
