import dotenv from "dotenv";
dotenv.config();

import { getLatestFootballNews } from "./src/api/news.js";
import { generateNewsPoster } from "./src/services/newsPoster.js";
import { generateNewsCaption } from "./src/services/gemini.js";
import { publishToSocialMedia } from "./src/services/publish.js";

async function testRealNewsPost() {
    console.log("📰 Fetching REAL latest football news from Sky Sports...");
    const newsList = await getLatestFootballNews(3);

    if (newsList.length === 0) {
        console.log("❌ No news found from RSS feed!");
        return;
    }

    // Show all headlines so the user can pick / confirm it's real
    console.log("\n🗞️  Top headlines right now:");
    newsList.forEach((n, i) => console.log(`  ${i + 1}. ${n.title}`));

    const topNews = newsList[0];
    console.log(`\n✅ Using: "${topNews.title}"\n`);

    try {
        console.log("✍️  Generating caption...");
        const caption = await generateNewsCaption(topNews);
        console.log("📝 Caption:", caption, "\n");

        console.log("🎨 Generating news poster...");
        const posterPath = await generateNewsPoster(topNews);
        console.log("📸 Poster saved at:", posterPath, "\n");

        console.log("🚀 Publishing to social media...");
        const success = await publishToSocialMedia(posterPath, caption);

        if (success) {
            console.log("\n🎉 ─────────────────────────────────────");
            console.log("🎉  SUCCESS! Check your Facebook PAGE TIMELINE (not Photos tab).");
            console.log("🎉 ─────────────────────────────────────");
        } else {
            console.log("\n❌ Publishing failed — check the error above.");
        }
    } catch (e) {
        console.error("❌ Unexpected error:", e.message);
    }
}

testRealNewsPost();
