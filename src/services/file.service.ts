import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

/**
 * Delete a file from the uploads directory.
 */
export async function deleteFile(filePath: string): Promise<void> {
  const absolutePath = path.resolve(filePath);
  try {
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (error) {
    console.error(`Failed to delete file: ${absolutePath}`, error);
  }
}

/**
 * Get the absolute path for a stored file.
 */
export function getAbsolutePath(filePath: string): string {
  return path.resolve(filePath);
}

/**
 * Ensure the uploads directory exists.
 */
export function ensureUploadDir(): void {
  const uploadDir = path.resolve(env.UPLOAD_DIR);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}
