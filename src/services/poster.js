import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import path from "path";

export async function generatePoster(match, caption, style) {
    const width = 1080;
    const height = 1350; // 4:5 ratio for mobile/Instagram

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background Gradients
    const gradients = [
        ['#1e3c72', '#2a5298'],
        ['#ff416c', '#ff4b2b'],
        ['#8E2DE2', '#4A00E0'],
        ['#11998e', '#38ef7d'],
        ['#0f2027', '#203a43', '#2c5364'],
        ['#fc4a1a', '#f7b733'],
        ['#232526', '#414345'],
        ['#000428', '#004e92'],
    ];
    const paletteIndex = match.fixture.id % gradients.length;
    const palette = gradients[paletteIndex];

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    if (palette.length === 2) {
        gradient.addColorStop(0, palette[0]);
        gradient.addColorStop(1, palette[1]);
    } else {
        gradient.addColorStop(0, palette[0]);
        gradient.addColorStop(0.5, palette[1]);
        gradient.addColorStop(1, palette[2]);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Minimalist Border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 15;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // Page Logo (Round)
    try {
        const pageLogo = await loadImage("C:\\Users\\prabe\\Desktop\\Goalchronicles\\goal-chronicles\\src\\page-logo.png");
        const pLogoSize = 140;
        const logoX = width / 2;
        const logoY = 160;

        ctx.save();
        ctx.beginPath();
        ctx.arc(logoX, logoY, pLogoSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(pageLogo, logoX - pLogoSize / 2, logoY - pLogoSize / 2, pLogoSize, pLogoSize);
        ctx.restore();

        // Circular border for page logo
        ctx.beginPath();
        ctx.arc(logoX, logoY, pLogoSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.stroke();
    } catch (e) {
        console.error("Error loading page logo:", e);
    }

    // Match Date & Title
    const matchDate = new Date(match.fixture.date);
    const dateString = matchDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "bold 35px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`MATCH DAY`, width / 2, 310);

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "28px Arial";
    ctx.fillText(dateString.toUpperCase(), width / 2, 360);

    // Team Logos & Names
    try {
        const homeLogo = await loadImage(match.teams.home.logo);
        const awayLogo = await loadImage(match.teams.away.logo);
        const logoSize = 220;

        const homeX = width / 2 - 260;
        const awayX = width / 2 + 260;
        const logosY = 480;

        ctx.drawImage(homeLogo, homeX - logoSize / 2, logosY, logoSize, logoSize);
        ctx.drawImage(awayLogo, awayX - logoSize / 2, logosY, logoSize, logoSize);

        ctx.fillStyle = "#ffffff";
        ctx.font = "italic bold 60px Arial";
        ctx.fillText("VS", width / 2, logosY + 110);

        // Team Names Centered Under Logos
        ctx.font = "bold 35px Arial";
        wrapTextCenter(ctx, match.teams.home.name, homeX, logosY + 280, 400, 40);
        wrapTextCenter(ctx, match.teams.away.name, awayX, logosY + 280, 400, 40);

    } catch (e) {
        console.error("Error loading logos:", e);
    }

    // Match Time & League
    const nptTime = matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kathmandu' });
    const utcTime = matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

    ctx.fillStyle = "#fbbf24"; // Gold color
    ctx.font = "bold 55px Arial";
    ctx.fillText(`${nptTime} NPT`, width / 2, 920);

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "30px Arial";
    ctx.fillText(`(${utcTime} UTC)`, width / 2, 980);

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "bold 35px Arial";
    // Limit width of league name to prevent horizontal cut-offs
    ctx.fillText(match.league.name.toUpperCase(), width / 2, 1080, 850);

    // Shortened Caption
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "italic 28px Arial";

    // Clean up caption: strictly remove all emojis
    let shortCaption = caption.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
    // Limit to 80 chars to prevent vertical cut-off at the bottom
    if (shortCaption.length > 80) {
        shortCaption = shortCaption.substring(0, 77).trim() + "...";
    }
    wrapTextCenter(ctx, shortCaption, width / 2, 1180, 850, 40);

    // Save folder
    const outputDir = "output";
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const filePath = path.join(outputDir, `${match.fixture.id}.png`);
    fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

    return filePath;
}

// helper for centered wrapping text
function wrapTextCenter(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    let lines = [];

    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + " ";
        let metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + " ";
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i].trim(), x, y + (i * lineHeight));
    }
}