import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { Inngest } from "inngest";
import { v4 as uuidv4 } from "uuid";
import { createReadStream, statSync } from "fs";
import { unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import YTDlpWrapModule from "yt-dlp-wrap";
const YTDlpWrap = YTDlpWrapModule.default || YTDlpWrapModule;
import { config } from "dotenv";

config({ path: ".env" });

const YOUTUBE_URL = "https://www.youtube.com/watch?v=YRvf00NooN8";
const USER_EMAIL = "tk.lunartech@gmail.com";

const db = new PrismaClient();
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const inngest = new Inngest({
  id: "ai-podcast-clipper",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

async function main() {
  console.log("Starting YouTube ingestion...");

  // 1. Find user
  const user = await db.user.findUnique({ where: { email: USER_EMAIL } });
  if (!user) throw new Error(`User ${USER_EMAIL} not found`);
  console.log(`Found user: ${user.email} with ${user.credits} credits`);

  // 2. Download YouTube video
  const uniqueId = uuidv4();
  const outputPath = join(tmpdir(), `${uniqueId}.mp4`);
  console.log(`Downloading YouTube video to ${outputPath}...`);

  const ytDlp = new YTDlpWrap();
  await ytDlp.execPromise([
    YOUTUBE_URL,
    "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]",
    "--merge-output-format", "mp4",
    "-o", outputPath,
  ]);
  console.log("Download complete!");

  // 3. Upload to S3
  const s3Key = `${uniqueId}/original.mp4`;
  console.log(`Uploading to S3 at ${s3Key}...`);
  const fileStream = createReadStream(outputPath);
  const fileSize = statSync(outputPath).size;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: s3Key,
    Body: fileStream,
    ContentType: "video/mp4",
    ContentLength: fileSize,
  }));
  console.log("Upload to S3 complete!");

  // 4. Create database record
  const uploadedFile = await db.uploadedFile.create({
    data: {
      userId: user.id,
      s3Key,
      displayName: "YRvf00NooN8 - Assigned Video",
      uploaded: true,
      status: "queued",
    },
  });
  console.log(`Created database record: ${uploadedFile.id}`);

  // 5. Trigger Inngest
  await inngest.send({
    name: "process-video-events",
    data: {
      uploadedFileId: uploadedFile.id,
      userId: user.id,
    },
  });
  console.log("Triggered Inngest job!");

  // 6. Cleanup
  await unlink(outputPath);
  console.log("Cleaned up temp file!");
  console.log("Done! Check your dashboard for processing status.");

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});