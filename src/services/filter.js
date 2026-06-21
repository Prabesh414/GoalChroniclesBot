// ─── football-data.org v4 Competition IDs ────────────────────────────────────
// Reference: https://api.football-data.org/v4/competitions/
// These IDs are used after the normalise() adapter maps competition.id → league.id
const BIG_LEAGUES = new Set([
    // ── International / UEFA ─────────────────────────────────
    2000, // FIFA World Cup
    2001, // UEFA Champions League
    2018, // UEFA European Championship (EURO)
    2021, // Premier League (England)
    2002, // Bundesliga (Germany)
    2003, // Eredivisie (Netherlands)
    2004, // Primeira Liga (Portugal) — also known as Liga Portugal
    2014, // La Liga (Spain)
    2015, // Ligue 1 (France)
    2017, // Primeira Liga (Portugal) — alias used in some seasons
    2019, // Serie A (Italy)
    2114, // Copa América
    2152, // Copa Libertadores
    2168, // AFC Champions League
    2016, // Championship (England)
    2013, // Campeonato Brasileiro Série A
    // ── Cups ─────────────────────────────────────────────────
    2080, // DFB Pokal
    2081, // Copa del Rey
]);

export function filterMatches(matches) {
    const kept    = [];
    const dropped = [];

    for (const match of matches) {
        const id   = match.league.id;   // normalised from match.competition.id
        const name = match.league.name; // normalised from match.competition.name
        if (BIG_LEAGUES.has(id)) {
            kept.push(match);
        } else {
            dropped.push(`${name} (ID: ${id})`);
        }
    }

    if (dropped.length > 0) {
        console.log(`   ⚙️  Filtered OUT ${dropped.length} fixture(s) from smaller leagues:`);
        const unique = [...new Set(dropped)];
        unique.slice(0, 10).forEach(l => console.log(`      - ${l}`));
        if (unique.length > 10) console.log(`      ...and ${unique.length - 10} more`);
    }
    console.log(`   ✅ ${kept.length} fixture(s) passed the filter.`);

    return kept;
}