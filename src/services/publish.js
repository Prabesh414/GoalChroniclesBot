import axios from "axios";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

const FB_PAGE_ID    = process.env.FACEBOOK_PAGE_ID;
const IG_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;
const META_TOKEN    = process.env.META_ACCESS_TOKEN;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
        // ─────────────────────────────────────────────────────────────────
        // STEP 1: Upload image to Cloudinary to get a public URL.
        //         Both Facebook photo post and Instagram need a public URL.
        // ─────────────────────────────────────────────────────────────────
        console.log("☁️  Uploading image to Cloudinary...");
        const publicId = `goalchronicles_${path.basename(imagePath, path.extname(imagePath))}`;
        const uploadResult = await cloudinary.uploader.upload(imagePath, {
            public_id:     publicId,
            overwrite:     true,
            resource_type: "image",
        });
        const imageUrl = uploadResult.secure_url;
        console.log("✅ Cloudinary upload done:", imageUrl);

        // ─────────────────────────────────────────────────────────────────
        // STEP 2: Post the poster image to Facebook → appears in Photos tab.
        // ─────────────────────────────────────────────────────────────────
        console.log("🖼️  Posting photo to Facebook Photos tab...");
        const photoRes = await axios.post(
            `https://graph.facebook.com/v20.0/${FB_PAGE_ID}/photos`,
            null,
            { params: { url: imageUrl, caption: caption, access_token: META_TOKEN } }
        );
        console.log("✅ Photo posted! ID:", photoRes.data.id);

        // ─────────────────────────────────────────────────────────────────
        // STEP 3: Post caption as text to Facebook feed → appears in All tab.
        // ─────────────────────────────────────────────────────────────────
        console.log("📝 Posting text to Facebook All tab...");
        const feedRes = await axios.post(
            `https://graph.facebook.com/v20.0/${FB_PAGE_ID}/feed`,
            null,
            { params: { message: caption, access_token: META_TOKEN } }
        );
        console.log("✅ Timeline post created! ID:", feedRes.data.id);

        // ─────────────────────────────────────────────────────────────────
        // STEP 4: Publish the same image to Instagram.
        // ─────────────────────────────────────────────────────────────────
        console.log("🚀 Publishing to Instagram...");
        const igContainerRes = await axios.post(
            `https://graph.facebook.com/v20.0/${IG_ACCOUNT_ID}/media`,
            null,
            { params: { image_url: imageUrl, caption: caption, access_token: META_TOKEN } }
        );
        const creationId = igContainerRes.data.id;

        console.log("⏳ Waiting 5 seconds for Instagram to process...");
        await new Promise(r => setTimeout(r, 5000));

        const igPublishRes = await axios.post(
            `https://graph.facebook.com/v20.0/${IG_ACCOUNT_ID}/media_publish`,
            null,
            { params: { creation_id: creationId, access_token: META_TOKEN } }
        );
        console.log("✅ Posted to Instagram! Media ID:", igPublishRes.data.id);
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
