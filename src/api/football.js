import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const BASE_URL = process.env.BASE_URL || "https://v3.football.api-sports.io";
const HEADERS = { "x-apisports-key": process.env.FOOTBALL_API_KEY };

export async function getTodayFixtures() {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const response = await axios.get(`${BASE_URL}/fixtures?date=${dateString}`, { headers: HEADERS });
    return response.data.response;
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