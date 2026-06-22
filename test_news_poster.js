import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

const res = await axios.get(
    "https://api.football-data.org/v4/matches/537360",
    { headers: { "X-Auth-Token": process.env.FOOTBALL_API_KEY } }
);

const m = res.data;
console.log("Score:", m.score?.fullTime);
console.log("Goals array:", JSON.stringify(m.goals, null, 2));
console.log("Score object:", JSON.stringify(m.score, null, 2));
