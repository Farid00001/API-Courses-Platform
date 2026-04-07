import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import { ALLOWED_FILE_EXTENSIONS, ALLOWED_MIME_TYPES } from '../config/constants';
import { AppError } from '../errors/AppError';

// Ensure upload directory exists
const uploadDir = path.resolve(env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  const ext = path.extname(file.originalname).toLowerCase();
  const isAllowedExt = (ALLOWED_FILE_EXTENSIONS as readonly string[]).includes(ext);
  const isAllowedMime = (ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype);

  if (isAllowedExt && isAllowedMime) {
    cb(null, true);
  } else {
    cb(new AppError(`File type not allowed. Accepted extensions: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`, 400));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE,
  },
});
