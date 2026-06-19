import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateCaption(match) {
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    const prompt = `
You are a football social media expert.

Create ONLY ONE viral Instagram caption for this match.

Match:
${match.teams.home.name} vs ${match.teams.away.name}
League: ${match.league.name}

Rules:
- ONLY one caption
- maximum 2 lines
- add emojis
- hype tone
- NO options
- NO explanations
- NO numbering
- NO multiple versions
`;

    const result = await model.generateContent(prompt);
    return result.response.text();
}