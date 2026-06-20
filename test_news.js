import { getLatestFootballNews } from "./src/api/news.js";
import { generateNewsPoster } from "./src/services/newsPoster.js";

async function testNews() {
    console.log("📰 Fetching latest news...");
    const news = await getLatestFootballNews(1);
    
    if (news.length === 0) {
        console.log("❌ No news found!");
        return;
    }

    console.log("Headline:", news[0].title);
    console.log("Generating dedicated news poster...");
    
    const posterPath = await generateNewsPoster(news[0]);
    console.log(`✅ SUCCESS! Check your 'output' folder for: ${posterPath}`);
}

testNews();
