import Parser from "rss-parser";

const parser = new Parser();

// Sky Sports Football RSS (Better for breaking/hard news)
const FOOTBALL_RSS = "https://www.skysports.com/rss/11095";

/**
 * Fetches the latest football news headlines using an RSS feed.
 * @param {number} limit - Number of headlines to return (default 5).
 * @returns {Promise<Array<{title: string, link: string, pubDate: string}>>}
 */
export async function getLatestFootballNews(limit = 5) {
    try {
        const feed = await parser.parseURL(FOOTBALL_RSS);
        
        // Return top 'limit' articles
        return feed.items.slice(0, limit).map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            summary: item.contentSnippet || item.content || "",
            imageUrl: item.enclosure?.url || null
        }));
    } catch (error) {
        console.error("Error fetching football news:", error.message);
        return [];
    }
}
