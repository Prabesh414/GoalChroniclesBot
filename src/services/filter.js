const BIG_LEAGUES = [
    1,    // World Cup
    39,   // Premier League (England)
    140,  // La Liga
    135,  // Serie A
    78,   // Bundesliga
    61,   // Ligue 1
    2     // Champions League
];

export function filterMatches(matches) {
    return matches.filter(match => {
        const league = match.league.id;

        return BIG_LEAGUES.includes(league);
    });
}