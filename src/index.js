import dotenv from "dotenv";
dotenv.config();

import { getTodayFixtures, getYesterdayFixtures } from "./api/football.js";
import { filterMatches } from "./services/filter.js";
import { generateCaption } from "./services/gemini.js";
import { generatePosterStyle } from "./services/POSTERAI.js";
import { generatePoster } from "./services/poster.js";
import { generateSummaryPoster } from "./services/summaryPoster.js";
import { publishToSocialMedia } from "./services/publish.js";
import fs from "fs";

// Load tracking database
const DB_FILE = "published_matches.json";
let publishedIDs = [];
if (fs.existsSync(DB_FILE)) {
    try {
        const data = fs.readFileSync(DB_FILE, "utf-8");
        // Using regex or string slicing to parse JSON safely if it was written via echo
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

    console.log("\n📅 Fetching Yesterday's and Today's Matches...");
    const yesterdayFixtures = await getYesterdayFixtures();
    const todayFixtures = await getTodayFixtures();
    
    const allFixtures = [...(yesterdayFixtures || []), ...(todayFixtures || [])];
    const filtered = filterMatches(allFixtures);

    // Split into Ended (for summary) and Upcoming (for single posters)
    const endedMatches = [];
    const upcomingMatches = [];

    for (const match of filtered) {
        const status = match.fixture.status.short;
        if (status === "NS" || status === "TBD") {
            upcomingMatches.push(match);
        } else {
            endedMatches.push(match);
        }
    }

    // ==========================================
    // 1. Ended Matches Summary (Grouped by League & Round)
    // ==========================================
    if (endedMatches.length > 0) {
        console.log(`🔥 Ended Matches count: ${endedMatches.length}`);
        
        // Group by league and matchday (round)
        const summaryGroups = {};
        for (const match of endedMatches) {
            const groupKey = `${match.league.id}_${match.league.round}`;
            if (!summaryGroups[groupKey]) {
                summaryGroups[groupKey] = {
                    name: match.league.name,
                    round: match.league.round,
                    matches: [],
                    date: match.fixture.date // store to extract generic date
                };
            }
            summaryGroups[groupKey].matches.push(match);
        }

        for (const key in summaryGroups) {
            const group = summaryGroups[key];
            const summaryId = `summary_${key}`;

            if (publishedIDs.includes(summaryId)) {
                console.log(`⏩ Summary for ${group.name} - ${group.round} already published. Skipping.`);
                continue;
            }

            const matchDate = new Date(group.date);
            const dateString = matchDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

            console.log(`\n========================================`);
            console.log(`🏆 Generating Summary for ${group.name} - ${group.round} (${group.matches.length} matches)`);
            console.log(`========================================`);
            
            const summaryPath = await generateSummaryPoster(group.name, group.matches, dateString, group.round);
            console.log("📸 Summary Poster:", summaryPath);
            
            const summaryCaption = `Here is your Matchday Summary for ${group.name}! 🏆🔥\n\n#football #matchday #summary #GoalChronicles`;
            await publishToSocialMedia(summaryPath, summaryCaption);
            
            markAsPublished(summaryId);
        }
    }

    // ==========================================
    // 2. Today's Upcoming Matches (Single Posters)
    // ==========================================
    console.log(`\n📅 Today's Upcoming Matches count: ${upcomingMatches.length}`);

    if (upcomingMatches.length === 0) {
        console.log("❌ No upcoming matches found");
        return;
    }

    for (const match of upcomingMatches.slice(0, 3)) {
        const matchId = `upcoming_${match.fixture.id}`;
        
        if (publishedIDs.includes(matchId)) {
            console.log(`⏩ Match ${match.teams.home.name} VS ${match.teams.away.name} already published. Skipping.`);
            continue;
        }

        console.log(`\n========================================`);
        console.log(`⚽ ${match.teams.home.name} VS ${match.teams.away.name}`);
        console.log(`========================================`);

        const caption = await generateCaption(match);
        const style = await generatePosterStyle(match, caption);
        const posterPath = await generatePoster(match, caption, style);

        console.log("🎨 Style:", style);
        console.log("📸 Poster:", posterPath);

        await publishToSocialMedia(posterPath, caption);
        
        markAsPublished(matchId);

        // Sleep to avoid rate limits (5 RPM for Free tier)
        await new Promise(r => setTimeout(r, 15000));
    }
}

runBot();