import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import path from "path";

export async function generatePoster(match, caption, style) {
    const width = 1080;
    const height = 1350; // 4:5 ratio for mobile/Instagram

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 1. Premium Stadium Background
    try {
        // High quality stadium texture from Unsplash (updated working link)
        const bgUrl = "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=1080&h=1350&auto=format&fit=crop";
        const background = await loadImage(bgUrl);
        ctx.drawImage(background, 0, 0, width, height);

        // 2. Dark Overlay for Contrast (Vignette + Base Tint)
        // Adds a deep gradient so the bright text and logos pop perfectly
        const overlay = ctx.createLinearGradient(0, 0, 0, height);
        overlay.addColorStop(0, "rgba(0, 0, 0, 0.6)");
        overlay.addColorStop(0.5, "rgba(0, 0, 0, 0.4)");
        overlay.addColorStop(1, "rgba(0, 0, 0, 0.85)");
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, width, height);
    } catch (e) {
        console.log("Background load failed, using fallback gradient", e);
        // Fallback Dark Gradient
        const fallback = ctx.createLinearGradient(0, 0, 0, height);
        fallback.addColorStop(0, "#0f2027");
        fallback.addColorStop(0.5, "#203a43");
        fallback.addColorStop(1, "#2c5364");
        ctx.fillStyle = fallback;
        ctx.fillRect(0, 0, width, height);
    }

    // 3. Premium Border (Thin, sharp lines look more magazine-like)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, width - 60, height - 60);
    ctx.strokeRect(38, 38, width - 76, height - 76); // Double border effect

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
    const isEnded = match.fixture.status.short === "FT" || match.fixture.status.short === "AET" || match.fixture.status.short === "PEN";
    const matchDate = new Date(match.fixture.date);
    const dateString = matchDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    // Premium Text Shadow config
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 45px 'Arial Black', Impact, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(isEnded ? `FULL TIME` : `MATCH DAY`, width / 2, 310);

    ctx.fillStyle = "#fbbf24"; // Gold
    ctx.font = "bold 28px Arial, sans-serif";
    ctx.letterSpacing = "2px"; // Only works in some canvas versions, safe to leave
    ctx.fillText(dateString.toUpperCase(), width / 2, 360);

    // Team Logos & Names
    try {
        const homeLogo = await loadImage(match.teams.home.logo);
        const awayLogo = await loadImage(match.teams.away.logo);
        const logoSize = 250; // slightly larger logos

        const homeX = width / 2 - 280;
        const awayX = width / 2 + 280;
        const logosY = 460;

        // Draw logos with glow/shadow
        ctx.shadowColor = "rgba(255, 255, 255, 0.2)";
        ctx.shadowBlur = 30;
        ctx.drawImage(homeLogo, homeX - logoSize / 2, logosY, logoSize, logoSize);
        ctx.drawImage(awayLogo, awayX - logoSize / 2, logosY, logoSize, logoSize);

        // Reset shadow for text
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 20;

        ctx.fillStyle = "#ffffff";
        ctx.font = "italic bold 80px 'Arial Black', Impact, sans-serif";
        
        if (isEnded) {
            ctx.fillStyle = "#fbbf24";
            ctx.fillText(`${match.goals.home} - ${match.goals.away}`, width / 2, logosY + 130);
        } else {
            ctx.fillText("VS", width / 2, logosY + 130);
        }

        // Team Names Centered Under Logos
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 35px 'Arial Black', Impact, sans-serif";
        wrapTextCenter(ctx, match.teams.home.name.toUpperCase(), homeX, logosY + 310, 400, 45);
        wrapTextCenter(ctx, match.teams.away.name.toUpperCase(), awayX, logosY + 310, 400, 45);

    } catch (e) {
        console.error("Error loading logos:", e);
    }

    // Match Time & League
    const nptTime = matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kathmandu' });
    const utcTime = matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

    if (!isEnded) {
        ctx.fillStyle = "#fbbf24"; // Gold color
        ctx.font = "bold 65px 'Arial Black', Impact, sans-serif";
        ctx.fillText(`${nptTime} NPT`, width / 2, 920);

        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.font = "bold 30px Arial, sans-serif";
        ctx.fillText(`(${utcTime} UTC)`, width / 2, 980);
    }

    // League Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px 'Arial Black', Impact, sans-serif";
    ctx.fillText(match.league.name.toUpperCase(), width / 2, isEnded ? 920 : 1080, 850);

    // Shortened Caption or Goal Scorers space
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "italic 32px Arial, sans-serif";
    ctx.shadowBlur = 10;

    // Clean up caption: strictly remove all emojis
    let shortCaption = caption.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
    if (shortCaption.length > 80) {
        shortCaption = shortCaption.substring(0, 77).trim() + "...";
    }
    wrapTextCenter(ctx, shortCaption, width / 2, isEnded ? 1020 : 1180, 850, 45);

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