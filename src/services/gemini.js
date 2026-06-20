import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { getLatestFootballNews } from "../api/news.js";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateCaption(match) {
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" }); 

    const isEnded = match.fixture.status.short === "FT" || match.fixture.status.short === "AET" || match.fixture.status.short === "PEN";
    const score = isEnded ? `${match.goals.home} - ${match.goals.away}` : "Upcoming";

    const news = await getLatestFootballNews(3);
    const newsText = news.length > 0 
        ? `\nLatest Football News Context (mention casually if relevant to the teams):\n${news.map(n => `- ${n.title}`).join('\n')}` 
        : "";

    const prompt = `
You are a football social media expert.

Create ONLY ONE viral Instagram caption for this match.

Match:
${match.teams.home.name} vs ${match.teams.away.name}
League: ${match.league.name}
Status: ${isEnded ? "Match Finished" : "Upcoming Match"}
${isEnded ? `Final Score: ${match.teams.home.name} ${match.goals.home} - ${match.goals.away} ${match.teams.away.name}` : ""}
${newsText}

Rules:
- ONLY one caption
- maximum 2 lines
- add emojis
- ${isEnded ? "react to the final score, highlight the winner or if it was a draw" : "hype tone for the upcoming match"}
- NO options
- NO explanations
- NO numbering
- NO multiple versions
`;

    const result = await model.generateContent(prompt);
    return result.response.text();
}