const BIG_LEAGUES = new Set([
    // International tournaments
    1,    // World Cup
    2,    // Champions League
    3,    // Europa League
    4,    // UEFA Euro
    5,    // UEFA Nations League
    6,    // Confederations Cup
    7,    // AFC Asian Cup
    9,    // Copa América
    29,   // AFC Champions League
    848,  // UEFA Conference League

    // FIFA Club World Cup (2025 format)
    15,

    // Top domestic leagues
    39,   // Premier League (England)
    45,   // FA Cup
    48,   // EFL Cup (Carabao Cup)
    140,  // La Liga
    135,  // Serie A
    78,   // Bundesliga
    61,   // Ligue 1
    88,   // Eredivisie
    94,   // Primeira Liga (Portugal)
    203,  // Süper Lig (Turkey)

    // World Cup Qualifiers (by confederation)
    30,   // World Cup - Asia
    31,   // World Cup - Africa
    // World Cup Qualifiers (by confederation)
    30,   // World Cup - Asia
    31,   // World Cup - Africa
    32,   // World Cup - CONMEBOL
    33,   // World Cup - CONCACAF
    34,   // World Cup - Europe
    35,   // World Cup - Oceania
]);

export function filterMatches(matches) {
    const kept = [];
    const dropped = [];

    for (const match of matches) {
        const id = match.league.id;
        const name = match.league.name;
        if (BIG_LEAGUES.has(id)) {
            kept.push(match);
        } else {
            dropped.push(`${name} (ID: ${id})`);
        }
    }

    if (dropped.length > 0) {
        console.log(`   ⚙️  Filtered OUT ${dropped.length} fixture(s) from smaller leagues:`);
        // Show unique league names only
        const unique = [...new Set(dropped)];
        unique.slice(0, 10).forEach(l => console.log(`      - ${l}`));
        if (unique.length > 10) console.log(`      ...and ${unique.length - 10} more`);
    }
    console.log(`   ✅ ${kept.length} fixture(s) passed the filter.`);

    return kept;
}