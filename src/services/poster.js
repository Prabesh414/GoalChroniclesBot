import { createCanvas, loadImage } from "canvas";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local fallback backgrounds (committed to repo — used when Unsplash fetch fails)
const LOCAL_BACKGROUNDS = [
    path.join(__dirname, "..", "bg-1.jpg"), // floodlit pitch
    path.join(__dirname, "..", "bg-2.jpg"), // match-night atmosphere
    path.join(__dirname, "..", "bg-3.jpg"), // close-up grass texture
    path.join(__dirname, "..", "bg-4.jpg"), // stadium wide panorama
    path.join(__dirname, "..", "bg-5.jpg"), // pitch lines bird's eye
];

/**
 * Load a logo from a URL, auto-converting SVG → PNG via sharp.
 * football-data.org returns .svg crests which node-canvas cannot render.
 */
async function loadLogo(url) {
    if (!url) throw new Error("No logo URL provided");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "";
    const isSvg = url.includes(".svg") || contentType.includes("svg");
    if (isSvg) {
        // Rasterise SVG to a 300×300 transparent PNG
        const png = await sharp(buf)
            .resize(300, 300, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();
        return loadImage(png);
    }
    return loadImage(buf);
}

export async function generatePoster(match, caption, style, aiText = "") {
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
        // Try rotating local fallback images (same modulo rotation as Unsplash list)
        const localPath = LOCAL_BACKGROUNDS[match.fixture.id % LOCAL_BACKGROUNDS.length];
        try {
            const localBg = await loadImage(localPath);
            ctx.drawImage(localBg, 0, 0, width, height);
            console.log(`✅ Using local fallback: ${path.basename(localPath)}`);

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

    const venue = match._raw?.venue;
    if (venue) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.font = "bold 20px Arial, sans-serif";
        ctx.fillText(`📍 ${venue.toUpperCase()}`, width / 2, 400);
    }

    // Team Logos & Names
    const homeX = width / 2 - 280;
    const awayX = width / 2 + 280;
    const logosY = 460;
    const logoSize = 250;

    // Draw logos — SVGs are auto-converted to PNG via sharp
    try {
        const pHome = loadLogo(match.teams.home.logo).catch(e => { throw e; });
        const pAway = loadLogo(match.teams.away.logo).catch(e => { throw e; });
        pHome.catch(() => {}); // Prevent unhandled rejection if the other fails first
        pAway.catch(() => {});
        const [homeLogo, awayLogo] = await Promise.all([pHome, pAway]);
        ctx.shadowColor = "rgba(255, 255, 255, 0.2)";
        ctx.shadowBlur = 30;
        ctx.drawImage(homeLogo, homeX - logoSize / 2, logosY, logoSize, logoSize);
        ctx.drawImage(awayLogo, awayX - logoSize / 2, logosY, logoSize, logoSize);
        console.log("✅ Team logos loaded.");
    } catch (e) {
        console.warn("⚠️  Logo load failed (drawing placeholders):", e.message);
        // Draw circular placeholder badges instead
        [[homeX, "#1a3a5c"], [awayX, "#3a1a1a"]].forEach(([cx, fill]) => {
            ctx.beginPath();
            ctx.arc(cx, logosY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = fill;
            ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,0.4)";
            ctx.lineWidth = 3;
            ctx.stroke();
        });
    }

    // Score / VS — always drawn regardless of logo success
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 20;
    if (isEnded) {
        ctx.fillStyle = "#fbbf24";
        const rawScore = match._raw?.score || {};
        const penHome = rawScore.penalties?.home;
        const penAway = rawScore.penalties?.away;
        
        if (penHome !== undefined && penAway !== undefined && typeof penHome === "number") {
            const scoreHome = match.goals.home ?? rawScore.fullTime?.home ?? "?";
            const scoreAway = match.goals.away ?? rawScore.fullTime?.away ?? "?";
            
            const rtHome = rawScore.regularTime?.home;
            const etHome = rawScore.extraTime?.home;
            const rtAway = rawScore.regularTime?.away;
            const etAway = rawScore.extraTime?.away;
            
            // Reconstruct exact scores to avoid API inaccuracies where penalties field is wrong
            const ftHome = rtHome !== undefined ? rtHome + (etHome ?? 0) : (scoreHome !== "?" ? scoreHome - penHome : "?");
            const ftAway = rtAway !== undefined ? rtAway + (etAway ?? 0) : (scoreAway !== "?" ? scoreAway - penAway : "?");
            
            // Actual penalty score = Total goals - (Regular Time + Extra Time)
            const actualPenHome = (scoreHome !== "?" && rtHome !== undefined) ? scoreHome - ftHome : penHome;
            const actualPenAway = (scoreAway !== "?" && rtAway !== undefined) ? scoreAway - ftAway : penAway;
            
            ctx.font = "italic bold 60px 'Arial Black', Impact, sans-serif";
            ctx.fillText(`${ftHome} - ${ftAway}`, width / 2, logosY + 70);
            
            ctx.font = "bold 20px Arial, sans-serif";
            ctx.fillText("FULL TIME", width / 2, logosY + 100);
            
            ctx.font = "italic bold 40px 'Arial Black', Impact, sans-serif";
            ctx.fillText(`${actualPenHome} - ${actualPenAway}`, width / 2, logosY + 160);
            
            ctx.font = "bold 16px Arial, sans-serif";
            ctx.fillText("PENALTIES", width / 2, logosY + 185);
        } else {
            ctx.font = "italic bold 80px 'Arial Black', Impact, sans-serif";
            const scoreHome = match.goals.home ?? match._raw?.score?.fullTime?.home ?? "?";
            const scoreAway = match.goals.away ?? match._raw?.score?.fullTime?.away ?? "?";
            ctx.fillText(`${scoreHome} - ${scoreAway}`, width / 2, logosY + 130);
        }
    } else {
        ctx.font = "italic bold 80px 'Arial Black', Impact, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("VS", width / 2, logosY + 130);
    }

    // Team Names — always drawn
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 35px 'Arial Black', Impact, sans-serif";
    wrapTextCenter(ctx, match.teams.home.name.toUpperCase(), homeX, logosY + 310, 400, 45);
    wrapTextCenter(ctx, match.teams.away.name.toUpperCase(), awayX, logosY + 310, 400, 45);

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
        const { homeScorers, awayScorers } = extractGoalScorers(match);
        const hasScorers = homeScorers.length > 0 || awayScorers.length > 0;

        ctx.shadowBlur = 0;

        let analysisStartY = 970;

        if (hasScorers) {
            // ── Divider above scorers ─────────────────────────────────────────
            ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(60, 955);
            ctx.lineTo(width - 60, 955);
            ctx.stroke();

            const scorerStartY = 995;
            const scorerLineHeight = 38;
            const maxScorers = 5;

            ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
            ctx.shadowBlur = 8;

            ctx.textAlign = "left";
            ctx.font = "bold 28px Arial, sans-serif";
            homeScorers.slice(0, maxScorers).forEach((s, i) => {
                ctx.fillStyle = "#ffffff";
                ctx.fillText(`⚽ ${s}`, 90, scorerStartY + i * scorerLineHeight);
            });

            ctx.textAlign = "right";
            awayScorers.slice(0, maxScorers).forEach((s, i) => {
                ctx.fillStyle = "rgba(251, 191, 36, 0.9)";
                ctx.fillText(`${s} ⚽`, width - 90, scorerStartY + i * scorerLineHeight);
            });

            // ── Divider below scorers ─────────────────────────────────────────
            analysisStartY = scorerStartY + Math.max(homeScorers.length, awayScorers.length, 1) * scorerLineHeight + 10;
            ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(60, analysisStartY);
            ctx.lineTo(width - 60, analysisStartY);
            ctx.stroke();
            analysisStartY += 10;
        } else {
            // No scorer data — draw a single clean divider and skip scorer section
            ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(60, 955);
            ctx.lineTo(width - 60, 955);
            ctx.stroke();
        }

        // ── Match Analysis ────────────────────────────────────────────────────
        if (aiText) {
            ctx.textAlign = "center";
            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold 28px Arial, sans-serif";
            ctx.shadowBlur = 0;
            ctx.fillText("MATCH ANALYSIS", width / 2, analysisStartY + 40);

            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.font = "italic 24px Arial, sans-serif";
            let cleanAi = aiText.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
            wrapTextCenter(ctx, cleanAi, width / 2, analysisStartY + 80, 900, 34);
        } else {
            ctx.textAlign = "center";
            ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
            ctx.font = "italic 26px Arial, sans-serif";
            ctx.shadowBlur = 10;
            let shortCaption = caption.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
            wrapTextCenter(ctx, shortCaption, width / 2, analysisStartY + 45, 900, 38);
        }
    } else {
        // UPCOMING: show Key Player prominently
        ctx.textAlign = "center";
        if (aiText) {
            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold 32px Arial, sans-serif";
            ctx.fillText("KEY PLAYER TO WATCH", width / 2, 1140);

            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.font = "italic 28px Arial, sans-serif";
            // Strip "Key Player: " prefix if Gemini included it
            let cleanAi = aiText.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').replace(/^Key Player( to watch)?:?\s*-?\s*/i, '').trim();
            wrapTextCenter(ctx, cleanAi, width / 2, 1190, 850, 40);
        } else {
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.font = "italic 32px Arial, sans-serif";
            ctx.shadowBlur = 10;
            let shortCaption = caption.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
            wrapTextCenter(ctx, shortCaption, width / 2, 1180, 850, 45);
        }
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