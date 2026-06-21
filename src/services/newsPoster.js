import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateNewsPoster(newsItem) {
    const width = 1080;
    const height = 1350;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // ── Background ────────────────────────────────────────────────────────────
    const fallbackBackgrounds = [
        "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=1080&h=1350&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1080&h=1350&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1434648957308-5e6a859697e8?q=80&w=1080&h=1350&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1552667466-07770ae110d0?q=80&w=1080&h=1350&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=1080&h=1350&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1080&h=1350&auto=format&fit=crop",
    ];
    const bgUrl = newsItem.imageUrl
        ? newsItem.imageUrl
        : fallbackBackgrounds[Math.floor(Math.random() * fallbackBackgrounds.length)];

    try {
        const background = await loadImage(bgUrl);
        const scale = Math.max(width / background.width, height / background.height);
        const imgW = background.width * scale;
        const imgH = background.height * scale;
        ctx.drawImage(background, (width - imgW) / 2, (height - imgH) / 2, imgW, imgH);
    } catch (e) {
        // Dark football-themed gradient fallback
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "#0a0e27");
        grad.addColorStop(1, "#1a2a1a");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
    }

    // ── Gradient overlay: transparent top → heavy dark bottom ────────────────
    const overlay = ctx.createLinearGradient(0, 0, 0, height);
    overlay.addColorStop(0,   "rgba(0, 0, 0, 0.15)");
    overlay.addColorStop(0.4, "rgba(0, 0, 0, 0.35)");
    overlay.addColorStop(0.65,"rgba(0, 0, 0, 0.75)");
    overlay.addColorStop(1,   "rgba(0, 0, 0, 0.97)");
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, width, height);

    // ── Outer border ──────────────────────────────────────────────────────────
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    // ── Page Logo (top-center) ────────────────────────────────────────────────
    const logoSize = 120;
    const logoX = width / 2;
    const logoY = 110;
    try {
        const logoPath = path.join(__dirname, "..", "page-logo.png");
        if (fs.existsSync(logoPath)) {
            const pageLogo = await loadImage(logoPath);
            // Circle clip
            ctx.save();
            ctx.beginPath();
            ctx.arc(logoX, logoY, logoSize / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(pageLogo, logoX - logoSize / 2, logoY - logoSize / 2, logoSize, logoSize);
            ctx.restore();
            // Thin gold ring around logo
            ctx.strokeStyle = "rgba(251, 191, 36, 0.7)";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(logoX, logoY, logoSize / 2 + 4, 0, Math.PI * 2);
            ctx.stroke();
        }
    } catch (e) {}

    ctx.textAlign = "center";

    // ── "BREAKING NEWS" badge ─────────────────────────────────────────────────
    const badgeY = 210;
    const badgeW = 340;
    const badgeH = 48;
    const badgeX = width / 2 - badgeW / 2;

    // Red pill background
    ctx.fillStyle = "#dc2626";
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 24);
    ctx.fill();

    // Pulsing dot
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(badgeX + 28, badgeY + badgeH / 2, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px Arial, sans-serif";
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.fillText("BREAKING NEWS", width / 2 + 10, badgeY + 32);

    // ── Gold accent line ──────────────────────────────────────────────────────
    const accentY = 290;
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(120, accentY);
    ctx.lineTo(width - 120, accentY);
    ctx.stroke();

    // ── Headline ──────────────────────────────────────────────────────────────
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 58px Arial, sans-serif";
    const headlineY = 370;
    const nextY = wrapTextCenter(ctx, newsItem.title.toUpperCase(), width / 2, headlineY, 960, 76);

    // ── Summary snippet ───────────────────────────────────────────────────────
    if (newsItem.summary) {
        ctx.shadowBlur = 10;
        ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
        ctx.font = "italic 33px Arial, sans-serif";
        const snippet = newsItem.summary.length > 160
            ? newsItem.summary.substring(0, 160).trim() + "…"
            : newsItem.summary;
        wrapTextCenter(ctx, snippet, width / 2, nextY + 55, 920, 48);
    }

    // ── Bottom info bar ───────────────────────────────────────────────────────
    // Horizontal separator
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 1230);
    ctx.lineTo(width - 60, 1230);
    ctx.stroke();

    // Source label (left)
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 26px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Sky Sports", 80, 1290);

    // Date (right)
    if (newsItem.pubDate) {
        const d = new Date(newsItem.pubDate);
        if (!isNaN(d.getTime())) {
            const dateStr = d.toLocaleDateString("en-US", {
                month: "short", day: "numeric",
                hour: "2-digit", minute: "2-digit"
            });
            ctx.fillStyle = "rgba(255,255,255,0.55)";
            ctx.font = "26px Arial, sans-serif";
            ctx.textAlign = "right";
            ctx.fillText(dateStr, width - 80, 1290);
        }
    }

    // ── Save ──────────────────────────────────────────────────────────────────
    const outputDir = path.resolve("output");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const filePath = path.join(outputDir, `news_${Date.now()}.png`);
    fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
    return filePath;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function wrapTextCenter(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    const lines = [];
    for (const word of words) {
        const test = line + word + " ";
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line.trim());
            line = word + " ";
        } else {
            line = test;
        }
    }
    if (line.trim()) lines.push(line.trim());
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x, y + i * lineHeight);
    }
    return y + lines.length * lineHeight;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
