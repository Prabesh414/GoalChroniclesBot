import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { getLatestFootballNews } from "../api/news.js";
dotenv.config();

const apiKeys = [process.env.GEMINI_API_KEY, process.env.GEMINI_BACKUP_API_KEY].filter(Boolean);

// ─── Model fallback chain ─────────────────────────────────────────────────────
// If a model's free-tier quota is exhausted (429), we try the next one.
const MODEL_CHAIN = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.1-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite"
];

/**
 * Generate content with automatic model fallback + per-model retry-with-backoff.
 * On 429 (quota exceeded), waits `retryDelay` seconds then tries once more.
 * If still failing, moves to the next model in the chain.
 * If all models fail on the first key, it falls back to the backup key.
 */
async function generateWithFallback(prompt) {
    // Shuffle the models to distribute load randomly across available models
    const shuffledModels = [...MODEL_CHAIN].sort(() => Math.random() - 0.5);

    for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
        const apiKey = apiKeys[keyIndex];
        const genAI = new GoogleGenerativeAI(apiKey);
        const keyName = keyIndex === 0 ? "Primary Key" : "Backup Key";

        for (const modelName of shuffledModels) {
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
                    console.log(`✅ Gemini responded using: ${modelName} (${keyName})`);
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
                            console.warn(`⏳ [${modelName}] (${keyName}) Quota hit — waiting ${waitSec}s before retry...`);
                            await new Promise(r => setTimeout(r, waitSec * 1000));
                        } else {
                            console.warn(`⚠️  [${modelName}] (${keyName}) Quota still exhausted — trying next model...`);
                        }
                    } else {
                        // Non-quota error — don't retry this model
                        console.error(`❌ [${modelName}] (${keyName}) Gemini error (non-quota):`, e.message);
                        break;
                    }
                }
            }
        }

        if (keyIndex < apiKeys.length - 1) {
            console.warn(`⚠️ All models exhausted on ${keyName}. Switching to next API key...`);
        }
    }

    // All models and keys failed
    throw new Error("All Gemini models and API keys exhausted or failed. Check your API key quotas.");
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateCaption(match) {
    const isEnded = match.fixture.status.short === "FT"
        || match.fixture.status.short === "AET"
        || match.fixture.status.short === "PEN";

    const news = await getLatestFootballNews(3);
    const newsText = news && news.length > 0
        ? `Recent Football News to consider incorporating if relevant:\n${news.map(n => `- ${n.title}`).join('\n')}`
        : "";
    let scoreText = "";
    if (isEnded) {
        const rawScore = match._raw?.score || {};
        if (match.fixture.status.short === "PEN" || rawScore.duration === "PENALTY_SHOOTOUT") {
            const rtHome = rawScore.regularTime?.home ?? 0;
            const etHome = rawScore.extraTime?.home ?? 0;
            const rtAway = rawScore.regularTime?.away ?? 0;
            const etAway = rawScore.extraTime?.away ?? 0;
            const ftHome = rtHome + etHome;
            const ftAway = rtAway + etAway;

            const scoreHome = match.goals.home ?? rawScore.fullTime?.home ?? ftHome;
            const scoreAway = match.goals.away ?? rawScore.fullTime?.away ?? ftAway;

            const penHome = scoreHome - ftHome;
            const penAway = scoreAway - ftAway;

            scoreText = `Final Score: ${match.teams.home.name} ${ftHome} - ${ftAway} ${match.teams.away.name} (Penalties: ${penHome}-${penAway})`;
        } else {
            scoreText = `Final Score: ${match.teams.home.name} ${match.goals.home} - ${match.goals.away} ${match.teams.away.name}`;
        }
    }

    const prompt = `
You are a football social media expert.

Create ONLY ONE viral Instagram caption for this match.

Match:
${match.teams.home.name} vs ${match.teams.away.name}
League: ${match.league.name}
Status: ${isEnded ? "Match Finished" : "Upcoming Match"}
${scoreText}
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
You are a football expert,a good one. Write a very short, general match analysis (max 2 sentences) based ONLY on the final score for the match between ${match.teams.home.name} and ${match.teams.away.name} which ended ${match.goals.home}-${match.goals.away}.
DO NOT mention any specific players, as you do not have the real match data for them.
DO NOT invent any statistics or events like hat-tricks or red cards.
Focus ONLY on a general statement about the outcome and the scoreline. Keep it engaging.
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