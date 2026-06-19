import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import path from "path";

export async function generateSummaryPoster(leagueName, matches, dateString, round) {
    const width = 1080;
    const height = 1350;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background Gradient for summary
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0f2027');
    gradient.addColorStop(0.5, '#203a43');
    gradient.addColorStop(1, '#2c5364');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Minimalist Border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 15;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // Page Logo (Round)
    try {
        const pageLogo = await loadImage("C:\\Users\\prabe\\Desktop\\Goalchronicles\\goal-chronicles\\src\\page-logo.png");
        const pLogoSize = 120;
        const logoX = width / 2;
        const logoY = 140;

        ctx.save();
        ctx.beginPath();
        ctx.arc(logoX, logoY, pLogoSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(pageLogo, logoX - pLogoSize / 2, logoY - pLogoSize / 2, pLogoSize, pLogoSize);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(logoX, logoY, pLogoSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();
    } catch (e) {
        console.error("Error loading page logo:", e);
    }

    // Title & Date/Round
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "bold 45px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`MATCHDAY SUMMARY`, width / 2, 270);

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 35px Arial";
    ctx.fillText(leagueName.toUpperCase(), width / 2, 330);

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "28px Arial";

    let formattedRound = round || dateString;
    if (formattedRound && formattedRound.includes(" - ")) {
        formattedRound = formattedRound.split(" - ")[0].trim();
    }

    // Combine the Round and the Date (e.g., "GROUP STAGE  |  JUNE 15")
    const subtitle = `${formattedRound.toUpperCase()}  |  ${dateString.toUpperCase()}`;
    ctx.fillText(subtitle, width / 2, 380);

    // Draw matches
    // Calculate how much vertical space we have per match
    const startY = 460;
    const endY = height - 100;
    const availableSpace = endY - startY;

    // Show maximum 6 matches to avoid overcrowding
    const displayMatches = matches.slice(0, 6);
    const rowHeight = availableSpace / displayMatches.length;

    for (let i = 0; i < displayMatches.length; i++) {
        const match = displayMatches[i];
        const matchY = startY + (i * rowHeight);

        // Try to get scores, otherwise show VS
        let scoreText = "VS";
        if (match.goals.home !== null && match.goals.away !== null) {
            scoreText = `${match.goals.home} - ${match.goals.away}`;
        }

        try {
            const homeLogo = await loadImage(match.teams.home.logo);
            const awayLogo = await loadImage(match.teams.away.logo);
            const logoSize = Math.min(80, rowHeight * 0.6); // scale logo size based on available space

            const centerX = width / 2;
            const homeX = centerX - 250;
            const awayX = centerX + 250;

            // Draw Home Logo
            ctx.drawImage(homeLogo, homeX - (logoSize / 2), matchY, logoSize, logoSize);
            // Draw Home Name (below logo)
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 22px Arial";
            ctx.textAlign = "center";
            ctx.fillText(match.teams.home.name, homeX, matchY + logoSize + 25);

            // Draw Score or VS (Center)
            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold 40px Arial";
            ctx.textAlign = "center";
            ctx.fillText(scoreText, centerX, matchY + (logoSize / 2) + 12);

            // Draw Away Logo
            ctx.drawImage(awayLogo, awayX - (logoSize / 2), matchY, logoSize, logoSize);
            // Draw Away Name (below logo)
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 22px Arial";
            ctx.textAlign = "center";
            ctx.fillText(match.teams.away.name, awayX, matchY + logoSize + 25);

        } catch (e) {
            console.error("Error drawing match row", e);
        }
    }

    // If more than 6 matches
    if (matches.length > 6) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "italic 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`+ ${matches.length - 6} more matches`, width / 2, endY + 40);
    }

    // Save folder
    const outputDir = "output";
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    // Generate safe filename
    const safeLeagueName = leagueName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filePath = path.join(outputDir, `summary_${safeLeagueName}_${matches[0].fixture.id}.png`);
    fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

    return filePath;
}
