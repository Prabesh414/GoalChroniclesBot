import dotenv from "dotenv";
dotenv.config();

import { generateNewsPoster } from "./src/services/newsPoster.js";
import { generateNewsCaption } from "./src/services/gemini.js";
import { publishToSocialMedia } from "./src/services/publish.js";

// Sample Bukayo Saka news item
const sakaNews = {
    title: "Bukayo Saka Signs New Long-Term Arsenal Contract",
    summary: "Arsenal star Bukayo Saka has committed his future to the club by signing a bumper new long-term deal, ending speculation over his future at the Emirates.",
    pubDate: new Date().toUTCString(),
    link: "https://www.skysports.com/football/news/11095",
    imageUrl: null // Will fall back to stadium background
};

async function testSakaPost() {
    console.log("🧪 ─────────────────────────────────────");
    console.log("🧪  SAKA NEWS POST — TEST RUN");
    console.log("🧪 ─────────────────────────────────────\n");

    try {
        // 1. Generate caption via Gemini
        console.log("✍️  Generating caption...");
        const caption = await generateNewsCaption(sakaNews);
        console.log("📝 Caption:", caption, "\n");

        // 2. Generate the news poster image
        console.log("🎨 Generating news poster...");
        const posterPath = await generateNewsPoster(sakaNews);
        console.log("📸 Poster saved at:", posterPath, "\n");

        // 3. Publish to Facebook + Instagram
        console.log("🚀 Publishing to social media...");
        const success = await publishToSocialMedia(posterPath, caption);

        if (success) {
            console.log("\n🎉 ─────────────────────────────────────");
            console.log("🎉  SUCCESS! Post is live on Facebook feed & Instagram.");
            console.log("🎉 ─────────────────────────────────────");
        } else {
            console.log("\n❌ Publishing failed — check the error above.");
        }
    } catch (e) {
        console.error("❌ Unexpected error:", e);
    }
}

testSakaPost();
