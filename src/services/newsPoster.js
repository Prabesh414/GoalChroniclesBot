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

    // Array of generic football backgrounds for news fallback
    const fallbackBackgrounds = [
        "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=1080&h=1350&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1080&h=1350&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1434648957308-5e6a859697e8?q=80&w=1080&h=1350&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1552667466-07770ae110d0?q=80&w=1080&h=1350&auto=format&fit=crop",
    ];
    let bgUrl = fallbackBackgrounds[Math.floor(Math.random() * fallbackBackgrounds.length)];

    if (newsItem.imageUrl) {
        bgUrl = newsItem.imageUrl; // Use the actual image from the news if available!
    }

    try {
        const background = await loadImage(bgUrl);
        // We draw the image to fill the canvas (cover)
        const scale = Math.max(width / background.width, height / background.height);
        const imgWidth = background.width * scale;
        const imgHeight = background.height * scale;
        const dx = (width - imgWidth) / 2;
        const dy = (height - imgHeight) / 2;
        ctx.drawImage(background, dx, dy, imgWidth, imgHeight);
    } catch (e) {
        ctx.fillStyle = "#0f2027";
        ctx.fillRect(0, 0, width, height);
    }

    // Heavy dark gradient for readability
    const overlay = ctx.createLinearGradient(0, 0, 0, height);
    overlay.addColorStop(0, "rgba(0, 0, 0, 0.4)");
    overlay.addColorStop(0.5, "rgba(0, 0, 0, 0.7)");
    overlay.addColorStop(1, "rgba(0, 0, 0, 0.95)");
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, width, height);

    // Premium Border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Page Logo (Round)
    try {
        const logoPath = path.join(__dirname, "..", "page-logo.png");
        if (fs.existsSync(logoPath)) {
            const pageLogo = await loadImage(logoPath);
            const pLogoSize = 140;
            const logoX = width / 2;
            const logoY = 200;

            ctx.save();
            ctx.beginPath();
            ctx.arc(logoX, logoY, pLogoSize / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(pageLogo, logoX - pLogoSize / 2, logoY - pLogoSize / 2, pLogoSize, pLogoSize);
            ctx.restore();
        }
    } catch (e) {}

    // LETS DISCUSS THIS text
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#fbbf24"; // Gold
    ctx.font = "bold 55px 'Arial Black', Impact, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("LETS DISCUSS THIS!", width / 2, 400);

    // Divider line
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(300, 440);
    ctx.lineTo(width - 300, 440);
    ctx.stroke();

    // The Headline
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 65px 'Arial Black', Impact, sans-serif";
    const nextY = wrapTextCenter(ctx, newsItem.title.toUpperCase(), width / 2, 530, 900, 80);

    // The Summary / Snippet
    if (newsItem.summary) {
        ctx.shadowBlur = 10;
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.font = "italic 35px Arial, sans-serif";
        wrapTextCenter(ctx, newsItem.summary, width / 2, nextY + 60, 850, 50);
    }

    // Source Date
    let dateStr = "";
    if (newsItem.pubDate) {
        const d = new Date(newsItem.pubDate);
        if (!isNaN(d.getTime())) {
            dateStr = " • " + d.toLocaleDateString('en-US', { 
                weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        }
    }
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "bold 30px Arial, sans-serif";
    ctx.fillText(`Source: Sky Sports${dateStr}`, width / 2, 1150);

    // Save folder — use an absolute path so fs.createReadStream works regardless of CWD
    const outputDir = path.resolve("output");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `news_${Date.now()}.png`;
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

    return filePath; // absolute path
}

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
    return y + (lines.length * lineHeight); // Returns the next available Y space
}
