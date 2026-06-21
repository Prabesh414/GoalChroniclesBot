import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// ─── football-data.org v4 ────────────────────────────────────────────────────
const BASE_URL = "https://api.football-data.org/v4";
const HEADERS  = { "X-Auth-Token": process.env.FOOTBALL_API_KEY };

// ─── Status mapping: v4 long string  →  API-Sports short code ────────────────
// All downstream code checks match.fixture.status.short against these values:
// "NS", "TBD", "FT", "AET", "PEN", "LIVE", "HT", "ET", "P", "BT",
// "SUSP", "INT", "PST", "CANC", "ABD", "AWD", "WO"
const STATUS_MAP = {
    SCHEDULED:  "NS",
    TIMED:      "NS",
    IN_PLAY:    "1H",
    PAUSED:     "HT",
    EXTRA_TIME: "ET",
    PENALTY:    "P",
    FINISHED:   "FT",
    SUSPENDED:  "SUSP",
    POSTPONED:  "PST",
    CANCELLED:  "CANC",
};

/**
 * Normalise a single football-data.org v4 match object into the internal shape
 * that gemini.js, poster.js, filter.js and index.js all expect.
 *
 * Internal shape (mirrors API-Sports response):
 * {
 *   fixture : { id, date, status: { short } }
 *   league  : { id, name, logo }
 *   teams   : { home: { id, name, logo }, away: { id, name, logo } }
 *   goals   : { home, away }
 *   events  : []   ← populated separately for finished matches
 * }
 */
function normalise(m) {
    const statusShort = STATUS_MAP[m.status] ?? m.status;

    // score object differs by stage
    const ft   = m.score?.fullTime  ?? {};
    const ht   = m.score?.halfTime  ?? {};
    const et   = m.score?.extraTime ?? {};
    const pen  = m.score?.penalties ?? {};

    // For finished matches use the most specific score available
    const goalsHome = m.score?.winner !== undefined
        ? (ft.home ?? null)
        : null;
    const goalsAway = m.score?.winner !== undefined
        ? (ft.away ?? null)
        : null;

    return {
        fixture: {
            id:     m.id,
            date:   m.utcDate,
            status: { short: statusShort },
        },
        league: {
            id:   m.competition?.id   ?? 0,
            name: m.competition?.name ?? "Unknown League",
            logo: m.competition?.emblem ?? "",
        },
        teams: {
            home: {
                id:   m.homeTeam?.id   ?? 0,
                name: m.homeTeam?.name ?? "Home",
                logo: m.homeTeam?.crest ?? "",
            },
            away: {
                id:   m.awayTeam?.id   ?? 0,
                name: m.awayTeam?.name ?? "Away",
                logo: m.awayTeam?.crest ?? "",
            },
        },
        goals: {
            home: goalsHome,
            away: goalsAway,
        },
        // events are fetched separately (see getFixtureDetails)
        events: m.events ?? [],
        // keep raw v4 data accessible if needed
        _raw: m,
    };
}

// ─── Fetch today's (and optionally yesterday's) matches ─────────────────────
export async function getTodayFixtures() {
    const todayUTC = new Date().toISOString().split("T")[0];
    console.log(`📆 Querying fixtures for UTC date: ${todayUTC}`);

    // football-data.org /v4/matches returns only your subscribed competitions
    const response = await axios.get(
        `${BASE_URL}/matches?dateFrom=${todayUTC}&dateTo=${todayUTC}`,
        { headers: HEADERS }
    );

    const matches = (response.data.matches ?? []).map(normalise);
    console.log(`   API returned ${matches.length} total fixtures`);

    // In early UTC hours also pull yesterday's finished matches
    const utcHour = new Date().getUTCHours();
    if (utcHour < 6) {
        const yd = new Date();
        yd.setUTCDate(yd.getUTCDate() - 1);
        const yesterdayUTC = yd.toISOString().split("T")[0];
        console.log(`🌙 Early UTC hours — also checking yesterday (${yesterdayUTC}) for late finishers...`);

        const ydRes = await axios.get(
            `${BASE_URL}/matches?dateFrom=${yesterdayUTC}&dateTo=${yesterdayUTC}`,
            { headers: HEADERS }
        );
        const ydMatches = (ydRes.data.matches ?? []).map(normalise);
        console.log(`   Yesterday returned ${ydMatches.length} total fixtures`);

        const finishedYesterday = ydMatches.filter(m =>
            ["FT", "AET", "PEN"].includes(m.fixture.status.short)
        );
        matches.push(...finishedYesterday);
    }

    return matches;
}

// ─── Fetch yesterday's matches (used by summaryPoster, etc.) ─────────────────
export async function getYesterdayFixtures() {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const dateString = yesterday.toISOString().split("T")[0];

    const response = await axios.get(
        `${BASE_URL}/matches?dateFrom=${dateString}&dateTo=${dateString}`,
        { headers: HEADERS }
    );
    return (response.data.matches ?? []).map(normalise);
}

// ─── Fetch full details for a single match (includes scorers via head2head) ──
// football-data.org v4 does NOT include goal events in the basic match endpoint.
// We call /v4/matches/{id} which returns scorer data inside score.scorers (not
// always present) and we can also call /v4/matches/{id}/head2head.
// To get goal events we fetch the single match endpoint and reconstruct events.
export async function getFixtureDetails(fixtureId) {
    try {
        const response = await axios.get(
            `${BASE_URL}/matches/${fixtureId}`,
            { headers: HEADERS }
        );
        const m = response.data;
        if (!m || !m.id) return null;

        const normalised = normalise(m);

        // Build synthetic events from the goals array if available
        // v4 provides: m.goals = [{ minute, team, scorer, assist, type }]
        if (Array.isArray(m.goals)) {
            normalised.events = m.goals.map(g => ({
                type:   "Goal",
                detail: g.type === "OWN_GOAL" ? "Own Goal" : "Normal Goal",
                time:   { elapsed: g.minute },
                team:   { id: g.team?.id },
                player: { name: g.scorer?.name ?? "Unknown" },
            }));
        }

        return normalised;
    } catch (e) {
        console.error(`❌ getFixtureDetails(${fixtureId}) failed:`, e.message);
        return null;
    }
}