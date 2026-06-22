import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const BASE_URL = "https://api.football-data.org/v4";
const HEADERS = { "X-Auth-Token": process.env.FOOTBALL_API_KEY };

const res = await axios.get(
    `${BASE_URL}/competitions/2000/matches?dateFrom=2026-06-21&dateTo=2026-06-21`,
    { headers: HEADERS }
);

console.log("Match IDs to mark as already published:");
(res.data.matches ?? []).forEach(m => {
    console.log(`  result_${m.id}  →  ${m.homeTeam.name} vs ${m.awayTeam.name} (${m.status})`);
});
