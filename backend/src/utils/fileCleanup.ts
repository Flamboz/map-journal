import fs from "fs";
import path from "path";

function uploadsRoot() {
  return path.join(process.cwd(), "uploads");
}

export function deleteUploadedFile(relativePath: string) {
  const absoluteFilePath = path.join(uploadsRoot(), relativePath);
  if (fs.existsSync(absoluteFilePath)) {
    fs.unlinkSync(absoluteFilePath);
  }
}

export function removeEventUploadDirectory(userId: number, eventId: string) {
  const eventUploadDirectory = path.join(uploadsRoot(), `user-${userId}`, `event-${eventId}`);
  if (fs.existsSync(eventUploadDirectory)) {
    fs.rmSync(eventUploadDirectory, { recursive: true, force: true });
  }
}

export function removeUserDirectoryIfEmpty(userId: number) {
  const userUploadDirectory = path.join(uploadsRoot(), `user-${userId}`);
  if (fs.existsSync(userUploadDirectory) && fs.readdirSync(userUploadDirectory).length === 0) {
    fs.rmdirSync(userUploadDirectory);
  }
}
