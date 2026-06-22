import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { getLatestFootballNews } from "../api/news.js";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Model fallback chain ─────────────────────────────────────────────────────
// If a model's free-tier quota is exhausted (429), we try the next one.
const MODEL_CHAIN = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash-8b",
    "gemini-1.0-pro",
    "gemini-3.5-lite",
    "gemini-3.5-flash"
];

/**
 * Generate content with automatic model fallback + per-model retry-with-backoff.
 * On 429 (quota exceeded), waits `retryDelay` seconds then tries once more.
 * If still failing, moves to the next model in the chain.
 */
async function generateWithFallback(prompt) {
    for (const modelName of MODEL_CHAIN) {
        const model = genAI.getGenerativeModel({ 
            model: modelName,
            systemInstruction: "You are a professional football sports journalist and social media manager. Your answers must ONLY be about football. Never output weird, nonsensical, or random chains of words. Keep the text extremely coherent, factual, and strictly related to the football context provided.",
            generationConfig: {
                temperature: 0.3,
            }
        });

        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const result = await model.generateContent(prompt);
                if (attempt > 1 || modelName !== MODEL_CHAIN[0]) {
                    console.log(`✅ Gemini responded using: ${modelName}`);
                }
                return result.response.text();
            } catch (e) {
                if (e.status === 429) {
                    // Parse the retryDelay from the error details if available
                    let waitSec = 35;
                    const retryInfo = e.errorDetails?.find(d =>
                        d["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
                    );
                    if (retryInfo?.retryDelay) {
                        waitSec = parseInt(retryInfo.retryDelay) + 2;
                    }

                    if (attempt === 1) {
                        console.warn(`⏳ [${modelName}] Quota hit — waiting ${waitSec}s before retry...`);
                        await new Promise(r => setTimeout(r, waitSec * 1000));
                    } else {
                        console.warn(`⚠️  [${modelName}] Quota still exhausted — trying next model...`);
                    }
                } else {
                    // Non-quota error — don't retry this model
                    console.error(`❌ [${modelName}] Gemini error (non-quota):`, e.message);
                    break;
                }
            }
        }
    }

    // All models failed
    throw new Error("All Gemini models exhausted or failed. Check your API key quota.");
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateCaption(match) {
    const isEnded = match.fixture.status.short === "FT"
        || match.fixture.status.short === "AET"
        || match.fixture.status.short === "PEN";

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

    return generateWithFallback(prompt);
}

export async function generateNewsCaption(newsItem) {
    const prompt = `
You are a football social media expert.
Write a very short, engaging Instagram caption for this breaking news.

Headline: ${newsItem.title}
Summary: ${newsItem.summary}

Rules:
- 1 or 2 lines maximum
- Ask a question to the followers to spark discussion
- Add emojis
- NO options or explanations
`;
    return generateWithFallback(prompt);
}

export async function generatePosterText(match) {
    const isEnded = match.fixture.status.short === "FT"
        || match.fixture.status.short === "AET"
        || match.fixture.status.short === "PEN";

    const prompt = isEnded ? `
You are a football expert. Write a very short match analysis (max 2 sentences) for the match between ${match.teams.home.name} and ${match.teams.away.name} which ended ${match.goals.home}-${match.goals.away}.
Focus on the performance, a key moment, or the outcome. Keep it engaging.
DO NOT include any hashtags.
` : `
You are a football expert. Suggest ONE key player to watch in the upcoming match between ${match.teams.home.name} and ${match.teams.away.name}.
Respond with ONLY the player's name and a tiny reason (max 1 sentence). Example: "Key Player: Bukayo Saka - His pace will be dangerous."
DO NOT include any hashtags.
`;

    try {
        return (await generateWithFallback(prompt)).trim();
    } catch (e) {
        console.error("Error generating poster text:", e.message);
        return "";
    }
}