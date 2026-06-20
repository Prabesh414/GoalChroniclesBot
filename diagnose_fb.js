import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const META_TOKEN = process.env.META_ACCESS_TOKEN;

async function diagnose() {
    console.log("🔍 FACEBOOK PAGE DIAGNOSTIC\n");

    // 1. Check what's in the page FEED (timeline posts)
    try {
        const feedRes = await axios.get(`https://graph.facebook.com/v20.0/${FB_PAGE_ID}/feed`, {
            params: {
                fields: "id,message,created_time,story",
                limit: 5,
                access_token: META_TOKEN
            }
        });
        console.log("📋 FEED POSTS (last 5):");
        if (feedRes.data.data.length === 0) {
            console.log("   ⚠️  NO feed posts found at all.");
        } else {
            feedRes.data.data.forEach(p => {
                console.log(`   - [${p.created_time}] ID: ${p.id}`);
                console.log(`     Message: ${(p.message || "(no message)").substring(0, 80)}`);
            });
        }
    } catch (e) {
        console.error("   ❌ Error fetching feed:", e.response?.data || e.message);
    }

    console.log("");

    // 2. Check photos separately
    try {
        const photosRes = await axios.get(`https://graph.facebook.com/v20.0/${FB_PAGE_ID}/photos`, {
            params: {
                fields: "id,name,created_time",
                type: "uploaded",
                limit: 5,
                access_token: META_TOKEN
            }
        });
        console.log("🖼️  PHOTOS (last 5 uploaded):");
        if (photosRes.data.data.length === 0) {
            console.log("   ⚠️  NO photos found.");
        } else {
            photosRes.data.data.forEach(p => {
                console.log(`   - [${p.created_time}] ID: ${p.id}`);
                console.log(`     Caption: ${(p.name || "(no caption)").substring(0, 80)}`);
            });
        }
    } catch (e) {
        console.error("   ❌ Error fetching photos:", e.response?.data || e.message);
    }

    console.log("");

    // 3. Check page published status
    try {
        const pageRes = await axios.get(`https://graph.facebook.com/v20.0/${FB_PAGE_ID}`, {
            params: {
                fields: "id,name,is_published,fan_count",
                access_token: META_TOKEN
            }
        });
        console.log("🏷️  PAGE STATUS:");
        console.log("   Name:", pageRes.data.name);
        console.log("   Published:", pageRes.data.is_published);
        console.log("   Fans:", pageRes.data.fan_count);
    } catch (e) {
        console.error("   ❌ Error fetching page info:", e.response?.data || e.message);
    }
}

diagnose();
