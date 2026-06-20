import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const BASE_URL = process.env.BASE_URL || "https://v3.football.api-sports.io";
const HEADERS = { "x-apisports-key": process.env.FOOTBALL_API_KEY };

export async function getTodayFixtures() {
    // API-Sports uses UTC dates. Nepal (UTC+5:45) past midnight is still the same UTC day,
    // so we always query UTC. We also check yesterday UTC to catch late-finishing matches.
    const todayUTC = new Date().toISOString().split('T')[0];

    console.log(`📆 Querying fixtures for UTC date: ${todayUTC}`);
    const response = await axios.get(`${BASE_URL}/fixtures?date=${todayUTC}`, { headers: HEADERS });
    const fixtures = response.data.response || [];
    console.log(`   API returned ${fixtures.length} total fixtures`);

    // If we are in the early hours (UTC < 06:00), also pull yesterday's fixtures
    // so that matches that kicked off the previous UTC day but finished recently are included.
    const utcHour = new Date().getUTCHours();
    if (utcHour < 6) {
        const yd = new Date();
        yd.setUTCDate(yd.getUTCDate() - 1);
        const yesterdayUTC = yd.toISOString().split('T')[0];
        console.log(`🌙 Early UTC hours — also checking yesterday (${yesterdayUTC}) for late finishers...`);
        const ydRes = await axios.get(`${BASE_URL}/fixtures?date=${yesterdayUTC}`, { headers: HEADERS });
        const ydFixtures = ydRes.data.response || [];
        console.log(`   Yesterday returned ${ydFixtures.length} total fixtures`);
        // Only include yesterday's matches that are already finished (FT/AET/PEN)
        const finishedYesterday = ydFixtures.filter(m => ["FT","AET","PEN"].includes(m.fixture.status.short));
        fixtures.push(...finishedYesterday);
    }

    return fixtures;
}

export async function getYesterdayFixtures() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split('T')[0];
    const response = await axios.get(`${BASE_URL}/fixtures?date=${dateString}`, { headers: HEADERS });
    return response.data.response;
}

// Fetches full fixture details including EVENTS (goal scorers, cards, etc.)
// The basic /fixtures?date= endpoint does NOT include events — this one does.
export async function getFixtureDetails(fixtureId) {
    const response = await axios.get(`${BASE_URL}/fixtures?id=${fixtureId}`, { headers: HEADERS });
    const data = response.data.response;
    return data.length > 0 ? data[0] : null;
}