import Parser from "rss-parser";

const parser = new Parser();

// BBC Sport Football RSS
const BBC_FOOTBALL_RSS = "http://newsrss.bbc.co.uk/rss/sportonline_uk_edition/football/rss.xml";

/**
 * Fetches the latest football news headlines using an RSS feed.
 * @param {number} limit - Number of headlines to return (default 5).
 * @returns {Promise<Array<{title: string, link: string, pubDate: string}>>}
 */
export async function getLatestFootballNews(limit = 5) {
    try {
        const feed = await parser.parseURL(BBC_FOOTBALL_RSS);
        
        // Return top 'limit' articles
        return feed.items.slice(0, limit).map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate
        }));
    } catch (error) {
        console.error("Error fetching football news:", error.message);
        return [];
    }
}
