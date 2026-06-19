import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export async function getTodayFixtures() {
    const baseUrl = process.env.BASE_URL || "https://v3.football.api-sports.io";
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const url = `${baseUrl}/fixtures?date=${dateString}`;

    const response = await axios.get(url, {
        headers: {
            "x-apisports-key": process.env.FOOTBALL_API_KEY
        }
    });

    return response.data.response;
}

export async function getYesterdayFixtures() {
    const baseUrl = process.env.BASE_URL || "https://v3.football.api-sports.io";
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split('T')[0];
    const url = `${baseUrl}/fixtures?date=${dateString}`;

    const response = await axios.get(url, {
        headers: {
            "x-apisports-key": process.env.FOOTBALL_API_KEY
        }
    });

    return response.data.response;
}