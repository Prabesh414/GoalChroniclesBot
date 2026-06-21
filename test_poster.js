import dotenv from "dotenv";
dotenv.config();

import { getTodayFixtures, getYesterdayFixtures, getFixtureDetails } from "./src/api/football.js";
import { filterMatches } from "./src/services/filter.js";
import { generateCaption, generatePosterText } from "./src/services/gemini.js";
import { generatePosterStyle } from "./src/services/posterAI.js";
import { generatePoster } from "./src/services/poster.js";
import fs from "fs";

async function testBot() {
    console.log("🧪 Running Test Mode...");

    console.log("📅 Fetching matches...");
    // Let's grab yesterday's fixtures just so we are guaranteed to have a FINISHED match
    // and today's fixtures to see UPCOMING matches.
    const yesterdayFixtures = await getYesterdayFixtures();
    const todayFixtures = await getTodayFixtures();

    const allFixtures = [...(yesterdayFixtures || []), ...(todayFixtures || [])];
    const filtered = filterMatches(allFixtures);

    if (filtered.length === 0) {
        console.log("❌ No relevant matches found to test with.");
        return;
    }

    // Grab 1 upcoming and 1 ended match for the test
    const upcoming = filtered.find(m => m.fixture.status.short === "NS" || m.fixture.status.short === "TBD");
    const ended = filtered.find(m => ["FT", "AET", "PEN"].includes(m.fixture.status.short));

    const matchesToTest = [];
    if (upcoming) matchesToTest.push({ type: "UPCOMING (Hype Poster)", match: upcoming });
    if (ended) matchesToTest.push({ type: "ENDED (Result Poster)", match: ended });

    if (matchesToTest.length === 0) {
        console.log("⚠️ Could not find a mix of ended and upcoming matches. Just picking the first one.");
        matchesToTest.push({ type: "TEST MATCH", match: filtered[0] });
    }

    for (const testCase of matchesToTest) {
        const { type, match: baseMatch } = testCase;
        console.log(`\n========================================`);
        console.log(`⚽ TESTING: ${type}`);
        console.log(`Match: ${baseMatch.teams.home.name} VS ${baseMatch.teams.away.name}`);
        console.log(`========================================`);

        try {
            let match = baseMatch;

            // For ended matches, fetch full details to get goal scorer events
            const isEnded = ["FT", "AET", "PEN"].includes(baseMatch.fixture.status.short);
            if (isEnded) {
                console.log("🔍 Fetching full match details (events/scorers)...");
                const full = await getFixtureDetails(baseMatch.fixture.id);
                if (full) {
                    match = full;
                    const goals = (match.events || []).filter(e => e.type === "Goal");
                    console.log(`  Found ${goals.length} goal event(s):`, goals.map(g => g.player?.name + " " + g.time?.elapsed + "'"));
                }
            }
            console.log("📝 Generating caption...");
            const caption = await generateCaption(match);
            console.log("Caption:\n", caption, "\n");

            console.log("🎨 Determining style...");
            const style = await generatePosterStyle(match, caption);

            console.log("🤖 Generating AI Analysis/Key Player...");
            const aiText = await generatePosterText(match);
            console.log("AI Text:\n", aiText, "\n");

            console.log("📸 Generating poster image...");
            const posterPath = await generatePoster(match, caption, style, aiText);

            console.log(`✅ SUCCESS! Check your 'output' folder for: ${posterPath}`);
        } catch (error) {
            console.error("❌ Error generating poster:", error);
        }
    }

    console.log("\n🛑 Test complete. NOTHING was posted to social media.");
}

testBot();
