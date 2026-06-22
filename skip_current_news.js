import { getLatestFootballNews } from "./src/api/news.js";
import fs from "fs";

async function run() {
    const latestNewsList = await getLatestFootballNews(1);
    if (latestNewsList.length > 0) {
        const topNews = latestNewsList[0];
        const newsId = `news_${Buffer.from(topNews.link).toString('base64').substring(0, 15)}`;
        console.log("Current news URL:", topNews.link);
        console.log("New ID:", newsId);
        
        const DB_FILE = "published_matches.json";
        let publishedIDs = [];
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, "utf-8");
            publishedIDs = JSON.parse(data.trim() || "[]");
        }
        
        if (!publishedIDs.includes(newsId)) {
            publishedIDs.push(newsId);
            fs.writeFileSync(DB_FILE, JSON.stringify(publishedIDs, null, 2));
            console.log("✅ Added to published_matches.json");
        } else {
            console.log("Already in DB.");
        }
    }
}
run();
