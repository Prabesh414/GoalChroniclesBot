import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

const IG_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;
const META_TOKEN = process.env.META_ACCESS_TOKEN;

async function diagnose() {
    try {
        const res = await axios.get(`https://graph.facebook.com/v20.0/${IG_ACCOUNT_ID}/media`, {
            params: {
                fields: "id,caption,timestamp",
                limit: 5,
                access_token: META_TOKEN
            }
        });
        console.log("IG POSTS:", JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(e.response?.data || e.message);
    }
}
diagnose();
