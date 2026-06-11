import { PrismaClient } from "@prisma/client";
import { Inngest } from "inngest";
import { config } from "dotenv";

config({ path: ".env" });

const S3_KEY = "029c730c-5302-409e-857d-4669a67d686f/original.mp4";
const USER_EMAIL = "tk.lunartech@gmail.com";

const db = new PrismaClient();
const inngest = new Inngest({
  id: "ai-podcast-clipper",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

async function main() {
  const user = await db.user.findUnique({ where: { email: USER_EMAIL } });
  if (!user) throw new Error(`User ${USER_EMAIL} not found`);
  console.log(`Found user: ${user.email} with ${user.credits} credits`);

  const uploadedFile = await db.uploadedFile.create({
    data: {
      userId: user.id,
      s3Key: S3_KEY,
      displayName: "YRvf00NooN8 - Assigned Video",
      uploaded: true,
      status: "queued",
    },
  });
  console.log(`Created database record: ${uploadedFile.id}`);

  await inngest.send({
    name: "process-video-events",
    data: {
      uploadedFileId: uploadedFile.id,
      userId: user.id,
    },
  });
  console.log("Triggered Inngest job!");

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});