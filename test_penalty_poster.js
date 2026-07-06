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
        
        // Inject a fake venue just so we can test the visual layout, 
        // since the API returned null for this specific match!
        if (!fullMatchDetails._raw.venue) {
            console.log("API returned null for venue. Injecting 'Wembley Stadium' for visual testing...");
            fullMatchDetails._raw.venue = "Wembley Stadium";
        }

        console.log("Generating poster with real API data (and test venue)...");
        const filePath = await generatePoster(fullMatchDetails, "Netherlands vs Morocco match finished in penalties! 🤯🇲🇦", "matchday");
        console.log("Poster generated at:", filePath);
    } catch (err) {
        console.error(err);
    }
})();
