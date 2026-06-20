import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_BG_PATH = path.join(__dirname, "..", "stadium-bg.jpg");
export async function generatePoster(match, caption, style) {
    const width = 1080;
    const height = 1350; // 4:5 ratio for mobile/Instagram

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 1. Premium Stadium Backgrounds — rotates per match so every poster looks different
    const stadiumBackgrounds = [
        "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=1080&h=1350&auto=format&fit=crop", // floodlit pitch
        "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1080&h=1350&auto=format&fit=crop", // packed stadium aerial
        "https://images.unsplash.com/photo-1434648957308-5e6a859697e8?q=80&w=1080&h=1350&auto=format&fit=crop", // match-night atmosphere
        "https://images.unsplash.com/photo-1552667466-07770ae110d0?q=80&w=1080&h=1350&auto=format&fit=crop", // close-up grass texture
        "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=1080&h=1350&auto=format&fit=crop", // stadium at dusk
        "https://images.unsplash.com/photo-1518604666860-9ed391f76460?q=80&w=1080&h=1350&auto=format&fit=crop", // stadium full seats
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1080&h=1350&auto=format&fit=crop", // stadium wide panorama
        "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1080&h=1350&auto=format&fit=crop", // pitch lines bird's eye

    ];



    const bgUrl = stadiumBackgrounds[match.fixture.id % stadiumBackgrounds.length];

    try {
        const background = await loadImage(bgUrl);
        ctx.drawImage(background, 0, 0, width, height);

        // 2. Dark Overlay for Contrast (Vignette + Base Tint)
        const overlay = ctx.createLinearGradient(0, 0, 0, height);
        overlay.addColorStop(0, "rgba(0, 0, 0, 0.6)");
        overlay.addColorStop(0.5, "rgba(0, 0, 0, 0.4)");
        overlay.addColorStop(1, "rgba(0, 0, 0, 0.85)");
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, width, height);
    } catch (e) {
        console.warn("Remote background load failed:", e.message);
        // Try bundled local stadium background first
        try {
            const localBg = await loadImage(LOCAL_BG_PATH);
            ctx.drawImage(localBg, 0, 0, width, height);
            console.log("✅ Using local stadium-bg.jpg fallback");

            // Same dark overlay
            const overlay = ctx.createLinearGradient(0, 0, 0, height);
            overlay.addColorStop(0, "rgba(0, 0, 0, 0.6)");
            overlay.addColorStop(0.5, "rgba(0, 0, 0, 0.4)");
            overlay.addColorStop(1, "rgba(0, 0, 0, 0.85)");
            ctx.fillStyle = overlay;
            ctx.fillRect(0, 0, width, height);
        } catch (e2) {
            console.warn("Local background also failed, using gradient:", e2.message);
            // Last-resort gradient
            const fallback = ctx.createLinearGradient(0, 0, 0, height);
            fallback.addColorStop(0, "#0f2027");
            fallback.addColorStop(0.5, "#203a43");
            fallback.addColorStop(1, "#2c5364");
            ctx.fillStyle = fallback;
            ctx.fillRect(0, 0, width, height);
        }
    }

    // 3. Premium Border (Thin, sharp lines look more magazine-like)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, width - 60, height - 60);
    ctx.strokeRect(38, 38, width - 76, height - 76); // Double border effect

    // Page Logo (Round)
    try {
        const logoPath = path.join(__dirname, "..", "page-logo.png");
        const pageLogo = await loadImage(logoPath);
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
    ctx.fillText(match.league.name.toUpperCase(), width / 2, isEnded ? 910 : 1080, 850);

    if (isEnded) {
        // =============================================
        // GOAL SCORERS SECTION (Result Posters Only)
        // =============================================
        const { homeScorers, awayScorers } = extractGoalScorers(match);

        // Divider line above scorers
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(251, 191, 36, 0.5)"; // gold divider
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(60, 955);
        ctx.lineTo(width - 60, 955);
        ctx.stroke();

        const scorerStartY = 995;
        const scorerLineHeight = 38;
        const homeX = 90;
        const awayX = width - 90;
        const maxScorers = 5; // cap so they don't overflow

        ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
        ctx.shadowBlur = 8;

        // Home scorers (left-aligned)
        ctx.textAlign = "left";
        ctx.font = "bold 28px Arial, sans-serif";
        homeScorers.slice(0, maxScorers).forEach((s, i) => {
            ctx.fillStyle = "#ffffff";
            ctx.fillText(`⚽ ${s}`, homeX, scorerStartY + i * scorerLineHeight);
        });

        // Away scorers (right-aligned)
        ctx.textAlign = "right";
        awayScorers.slice(0, maxScorers).forEach((s, i) => {
            ctx.fillStyle = "rgba(251, 191, 36, 0.9)"; // gold for away
            ctx.fillText(`${s} ⚽`, awayX, scorerStartY + i * scorerLineHeight);
        });

        // Divider line below scorers
        const scorerEndY = scorerStartY + Math.max(homeScorers.length, awayScorers.length, 1) * scorerLineHeight + 10;
        ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(60, scorerEndY);
        ctx.lineTo(width - 60, scorerEndY);
        ctx.stroke();

        // Caption as a smaller tagline below scorers
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
        ctx.font = "italic 26px Arial, sans-serif";
        ctx.shadowBlur = 10;
        let shortCaption = caption.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
        wrapTextCenter(ctx, shortCaption, width / 2, scorerEndY + 45, 900, 38);
    } else {
        // UPCOMING: show caption prominently
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "italic 32px Arial, sans-serif";
        ctx.shadowBlur = 10;
        ctx.textAlign = "center";
        let shortCaption = caption.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
        wrapTextCenter(ctx, shortCaption, width / 2, 1180, 850, 45);
    }

    // Save folder
    const outputDir = "output";
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const filePath = path.join(outputDir, `${match.fixture.id}.png`);
    fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

    return filePath;
}

// Extract goal scorers from match events array
function extractGoalScorers(match) {
    const events = match.events || [];
    const homeScorers = [];
    const awayScorers = [];

    for (const event of events) {
        // Only goals and own goals, skip penalties unless it was the decisive one
        if (event.type === "Goal") {
            const name = event.player?.name || "Unknown";
            // Shorten long names to just last name for space
            const shortName = name.split(" ").slice(-1)[0];
            const minute = event.time?.elapsed;
            const label = event.detail === "Own Goal"
                ? `${shortName} ${minute}' (OG)`
                : `${shortName} ${minute}'`;

            if (event.team?.id === match.teams.home.id) {
                homeScorers.push(label);
            } else {
                awayScorers.push(label);
            }
        }
    }

    return { homeScorers, awayScorers };
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