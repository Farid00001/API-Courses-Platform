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
 * Duplicate a stored file inside the uploads directory and return the new relative path.
 */
export function duplicateStoredFile(filePath: string): string {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Source file not found: ${absolutePath}`);
  }

  const parsed = path.parse(absolutePath);
  const duplicateName = `${parsed.name}-copy-${Date.now()}${parsed.ext}`;
  const duplicatePath = path.join(parsed.dir, duplicateName);
  fs.copyFileSync(absolutePath, duplicatePath);

  return path.relative(process.cwd(), duplicatePath).replace(/\\/g, '/');
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
