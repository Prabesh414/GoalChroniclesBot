import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

// Configure using env vars
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 1. Upload a sample image
console.log("⬆️  Uploading sample image...");
const uploadResult = await cloudinary.uploader.upload(
    "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    { public_id: "goalchronicles_test" }
);

console.log("✅ Uploaded!");
console.log("   Secure URL :", uploadResult.secure_url);
console.log("   Public ID  :", uploadResult.public_id);

// 2. Get image details
const details = await cloudinary.api.resource("goalchronicles_test");
console.log("\n📋 Image metadata:");
console.log("   Width  :", details.width);
console.log("   Height :", details.height);
console.log("   Format :", details.format);
console.log("   Size   :", details.bytes, "bytes");

// 3. Generate transformed URL
//    f_auto = serve the best format for each browser (WebP, AVIF, etc.)
//    q_auto = automatically choose the best quality level to reduce file size
const transformedUrl = cloudinary.url("goalchronicles_test", {
    transformation: [{ fetch_format: "auto", quality: "auto" }],
    secure: true
});

console.log("\n🔗 Transformed URL (f_auto + q_auto):");
console.log("  ", transformedUrl);
console.log("\nDone! Click the link above to see the optimized version. Check the size and the format.");