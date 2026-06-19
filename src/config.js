import dotenv from "dotenv";
dotenv.config();

console.log("API KEY:", process.env.FOOTBALL_API_KEY);

export const config = {
    FOOTBALL_API_KEY: process.env.FOOTBALL_API_KEY,
    BASE_URL: "https://v3.football.api-sports.io",
};