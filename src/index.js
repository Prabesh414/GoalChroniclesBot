import dotenv from "dotenv";
dotenv.config();

import { getTodayFixtures, getFixtureDetails } from "./api/football.js";
import { filterMatches } from "./services/filter.js";
import { generateCaption } from "./services/gemini.js";
import { generatePosterStyle } from "./services/posterAI.js";
import { generatePoster } from "./services/poster.js";
import { publishToSocialMedia } from "./services/publish.js";
import { getLatestFootballNews } from "./api/news.js";
import { generateNewsPoster } from "./services/newsPoster.js";
import { generateNewsCaption } from "./services/gemini.js";
import fs from "fs";

// Load tracking database
const DB_FILE = "published_matches.json";
let publishedIDs = [];
if (fs.existsSync(DB_FILE)) {
    try {
        const data = fs.readFileSync(DB_FILE, "utf-8");
        publishedIDs = JSON.parse(data.trim() || "[]");
    } catch (e) {
        console.error("Error reading database, starting fresh.", e);
    }
}

function markAsPublished(id) {
    if (!publishedIDs.includes(id)) {
        publishedIDs.push(id);
        fs.writeFileSync(DB_FILE, JSON.stringify(publishedIDs, null, 2));
    }
}

async function runBot() {
    console.log("🔑 API KEY LOADED:", process.env.FOOTBALL_API_KEY ? "YES" : "NO");

    console.log("\n📅 Fetching Today's Matches...");
    const todayFixtures = await getTodayFixtures();
    const filtered = filterMatches(todayFixtures || []);

    if (filtered.length === 0) {
        console.log("❌ No relevant matches found today.");
        return;
    }

    const now = Date.now();
    // We consider "upcoming soon" if the match starts in less than 40 mins
    const HYPE_THRESHOLD_MS = 40 * 60 * 1000;

    for (const match of filtered) {
        const status = match.fixture.status.short;
        const matchTime = new Date(match.fixture.date).getTime();

        console.log(`\n========================================`);
        console.log(`⚽ ${match.teams.home.name} VS ${match.teams.away.name} (${status})`);

        // 1. Hype Poster Logic (Upcoming)
        if (status === "NS" || status === "TBD") {
            const timeUntilMatch = matchTime - now;

            // If match is starting within 40 minutes and is in the future
            if (timeUntilMatch > 0 && timeUntilMatch <= HYPE_THRESHOLD_MS) {
                const matchId = `hype_${match.fixture.id}`;
                if (!publishedIDs.includes(matchId)) {
                    console.log(`🔥 Match starts soon! Generating Hype Poster...`);
                    await generateAndPublish(match, matchId);
                } else {
                    console.log(`⏩ Hype poster already published.`);
                }
            } else {
                console.log(`⏳ Match is too far in the future or already started. (Time diff: Math.round(timeUntilMatch / 60000) mins)`);
            }
        }

        // 2. Result Poster Logic (Ended)
        else if (status === "FT" || status === "AET" || status === "PEN") {
            const matchId = `result_${match.fixture.id}`;
            if (!publishedIDs.includes(matchId)) {
                console.log(`🏆 Match Finished! Fetching full details for goal scorers...`);
                // Fetch the detailed fixture so we get the events (goal scorers)
                const fullMatch = await getFixtureDetails(match.fixture.id);
                const matchWithDetails = fullMatch || match; // fallback to basic data if call fails
                console.log(`  Found ${(matchWithDetails.events || []).filter(e => e.type === "Goal").length} goal event(s)`);
                await generateAndPublish(matchWithDetails, matchId);
            } else {
                console.log(`⏩ Result poster already published.`);
            }
        }

        else {
            console.log(`🏃 Match is currently live or in an unhandled state. Skipping.`);
        }
    }

    // 3. News Poster Logic (Post 1 latest news per day/run if new)
    console.log("\n📰 Checking for latest Football News...");
    const latestNewsList = await getLatestFootballNews(1);
    if (latestNewsList.length > 0) {
        const topNews = latestNewsList[0];
        // Create a unique ID for the news using a hash of the title or simply the title
        const newsId = `news_${Buffer.from(topNews.title).toString('base64').substring(0, 15)}`;
        
        if (!publishedIDs.includes(newsId)) {
            console.log(`🔥 New breaking news found! Generating News Poster...`);
            try {
                const caption = await generateNewsCaption(topNews);
                const posterPath = await generateNewsPoster(topNews);
                
                console.log("📝 News Caption:", caption);
                console.log("📸 News Poster:", posterPath);
                
                const success = await publishToSocialMedia(posterPath, caption);
                if (success) {
                    markAsPublished(newsId);
                }
            } catch (e) {
                console.error("❌ Error generating/publishing news:", e);
            }
        } else {
            console.log(`⏩ Top news already published today.`);
        }
    }
}

async function generateAndPublish(match, matchId) {
    try {
        const caption = await generateCaption(match);
        const style = await generatePosterStyle(match, caption);
        const posterPath = await generatePoster(match, caption, style);

        console.log("🎨 Style:", style);
        console.log("📸 Poster:", posterPath);

        const success = await publishToSocialMedia(posterPath, caption);
        if (success) {
            markAsPublished(matchId);
        } else {
            console.log("⚠️ Publishing failed or skipped. Match will be retried next run.");
        }

        // Sleep to avoid rate limits (5 RPM for Free tier)
        await new Promise(r => setTimeout(r, 15000));
    } catch (e) {
        console.error("❌ Error generating or publishing for match:", matchId, e);
    }
}

runBot();