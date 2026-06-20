import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import dotenv from "dotenv";
dotenv.config();

const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const IG_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;
const META_TOKEN = process.env.META_ACCESS_TOKEN;

export async function publishToSocialMedia(imagePath, caption) {
    if (!META_TOKEN || !FB_PAGE_ID || !IG_ACCOUNT_ID) {
        console.log("⚠️ Missing Meta credentials, skipping social media post.");
        return false;
    }

    // Pre-flight: verify the image file actually exists before attempting upload
    if (!fs.existsSync(imagePath)) {
        console.error(`❌ Image file not found at path: ${imagePath}`);
        return false;
    }

    try {
        console.log("🚀 Publishing to Facebook...");

        // 1. Upload to Facebook Page
        const fbUrl = `https://graph.facebook.com/v20.0/${FB_PAGE_ID}/photos`;
        const form = new FormData();
        form.append("access_token", META_TOKEN);
        form.append("message", caption);
        form.append("source", fs.createReadStream(imagePath));

        const fbResponse = await axios.post(fbUrl, form, {
            headers: form.getHeaders()
        });

        const photoId = fbResponse.data.id;
        console.log("✅ Posted to Facebook! Photo ID:", photoId);

        // 2. Get Public Image URL from Facebook (Instagram needs a public URL)
        console.log("🔗 Fetching public image URL for Instagram...");
        const photoUrlReq = `https://graph.facebook.com/v20.0/${photoId}?fields=images&access_token=${META_TOKEN}`;
        const photoData = await axios.get(photoUrlReq);
        const publicImageUrl = photoData.data.images[0].source; // Get the highest resolution image

        console.log("🚀 Publishing to Instagram...");

        // 3. Create Instagram Media Container
        const igContainerUrl = `https://graph.facebook.com/v20.0/${IG_ACCOUNT_ID}/media`;
        const igContainerResponse = await axios.post(igContainerUrl, null, {
            params: {
                image_url: publicImageUrl,
                caption: caption,
                access_token: META_TOKEN
            }
        });

        const creationId = igContainerResponse.data.id;

        // Wait for Instagram to finish processing the container image
        console.log("⏳ Waiting 5 seconds for Instagram to process the image container...");
        await new Promise(r => setTimeout(r, 5000));

        // 4. Publish the Instagram Container
        const igPublishUrl = `https://graph.facebook.com/v20.0/${IG_ACCOUNT_ID}/media_publish`;
        const igPublishResponse = await axios.post(igPublishUrl, null, {
            params: {
                creation_id: creationId,
                access_token: META_TOKEN
            }
        });

        console.log("✅ Posted to Instagram! Media ID:", igPublishResponse.data.id);
        return true;

    } catch (error) {
        if (error.response) {
            // Facebook/Instagram API returned an error response
            console.error("❌ Error publishing to social media (API error):", JSON.stringify(error.response.data, null, 2));
        } else if (error.message) {
            console.error("❌ Error publishing to social media:", error.message);
        } else {
            console.error("❌ Error publishing to social media (unknown error):", error);
        }
        return false;
    }
}
