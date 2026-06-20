import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generatePosterStyle(match, caption) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });

    const prompt = `
You are a sports poster designer.

Generate a UNIQUE poster style for this football match:

Match: ${match.teams.home.name} vs ${match.teams.away.name}
League: ${match.league.name}
Caption: ${caption}

Return ONLY JSON:

{
  "background": "dark blue / red / neon / gradient etc",
  "titleColor": "white / yellow / neon green etc",
  "accent": "fire / lightning / glow / shadow etc",
  "style": "modern / aggressive / minimal / hype"
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return JSON.parse(text);
}