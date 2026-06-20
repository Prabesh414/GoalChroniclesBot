import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import dotenv from "dotenv";
dotenv.config();

const FB_PAGE_ID    = process.env.FACEBOOK_PAGE_ID;
const IG_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;
const META_TOKEN    = process.env.META_ACCESS_TOKEN;

export async function publishToSocialMedia(imagePath, caption) {
    if (!META_TOKEN || !FB_PAGE_ID || !IG_ACCOUNT_ID) {
        console.log("⚠️ Missing Meta credentials, skipping social media post.");
        return false;
    }

    if (!fs.existsSync(imagePath)) {
        console.error(`❌ Image file not found at path: ${imagePath}`);
        return false;
    }

    try {
        // ── STEP 1: Upload poster to Facebook → appears in Photos tab ────
        console.log("🖼️  Posting photo to Facebook...");
        const form = new FormData();
        form.append("access_token", META_TOKEN);
        form.append("caption", caption);
        form.append("source", fs.createReadStream(imagePath));

        const fbRes = await axios.post(
            `https://graph.facebook.com/v20.0/${FB_PAGE_ID}/photos`,
            form,
            { headers: form.getHeaders() }
        );
        const photoId = fbRes.data.id;
        console.log("✅ Photo posted! ID:", photoId);

        // ── STEP 2: Text post to feed → appears in All tab ───────────────
        console.log("📝 Posting text to All tab...");
        const feedRes = await axios.post(
            `https://graph.facebook.com/v20.0/${FB_PAGE_ID}/feed`,
            null,
            { params: { message: caption, access_token: META_TOKEN } }
        );
        console.log("✅ Timeline post created! ID:", feedRes.data.id);

        // ── STEP 3: Get the hosted image URL for Instagram ────────────────
        const photoData = await axios.get(
            `https://graph.facebook.com/v20.0/${photoId}`,
            { params: { fields: "images", access_token: META_TOKEN } }
        );
        const imageUrl = photoData.data.images[0].source;

        // ── STEP 4: Publish to Instagram ──────────────────────────────────
        console.log("🚀 Publishing to Instagram...");
        const containerRes = await axios.post(
            `https://graph.facebook.com/v20.0/${IG_ACCOUNT_ID}/media`,
            null,
            { params: { image_url: imageUrl, caption, access_token: META_TOKEN } }
        );

        console.log("⏳ Waiting 5 seconds for Instagram to process...");
        await new Promise(r => setTimeout(r, 5000));

        const publishRes = await axios.post(
            `https://graph.facebook.com/v20.0/${IG_ACCOUNT_ID}/media_publish`,
            null,
            { params: { creation_id: containerRes.data.id, access_token: META_TOKEN } }
        );
        console.log("✅ Posted to Instagram! Media ID:", publishRes.data.id);
        return true;

    } catch (error) {
        if (error.response) {
            console.error("❌ Error publishing (API error):", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("❌ Error publishing:", error.message || error);
        }
        return false;
    }
}
