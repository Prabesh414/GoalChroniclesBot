import { getFixtureDetails } from "./src/api/football.js";
import { generatePoster } from "./src/services/poster.js";
import dotenv from "dotenv";
dotenv.config();

const fixtureId = 537418; // Known match ID for a penalty shootout

(async () => {
    try {
        console.log(`Fetching real data from football-data API for match ID: ${fixtureId}...`);
        const fullMatchDetails = await getFixtureDetails(fixtureId);
        
        if (!fullMatchDetails) {
            console.error("Match not found or API error.");
            return;
        }

        console.log("Status:", fullMatchDetails.fixture.status.short);
        console.log("Raw API Score Object:", JSON.stringify(fullMatchDetails._raw.score, null, 2));

        console.log("Generating poster with real API data...");
        const filePath = await generatePoster(fullMatchDetails, "Netherlands vs Morocco match finished in penalties! 🤯🇲🇦", "matchday");
        console.log("Poster generated at:", filePath);
    } catch (err) {
        console.error(err);
    }
})();
