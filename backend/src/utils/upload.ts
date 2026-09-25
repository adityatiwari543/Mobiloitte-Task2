import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { env } from '../config/env.js';
import { VALIDATION_LIMITS } from '@jobconnect/shared';

// Ensure canonical persistent upload directory exists
export function getStorageDirectory(): string {
  const normalizedCwd = process.cwd().replace(/\\/g, '/');
  const isInsideBackend = normalizedCwd.endsWith('/backend') || path.basename(process.cwd()) === 'backend';
  const repoRoot = isInsideBackend ? path.resolve(process.cwd(), '..') : process.cwd();
  const dir = path.resolve(repoRoot, 'uploads');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export const uploadDirectory = getStorageDirectory();

const resumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (_req, file, cb) => {
    // Generate safe UUID identifier to eliminate path traversal / arbitrary code execution
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `resume-${uuidv4()}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Allowed MIME types (PDF, DOCX, DOC, Images: PNG, JPEG, WEBP)
  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
  ];

  // Allowed extensions
  const allowedExtensions = ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF, DOCX, DOC, and Image (PNG, JPG, WEBP) files are allowed.'));
  }
};

export const resumeUpload = multer({
  storage: resumeStorage,
  limits: {
    fileSize: VALIDATION_LIMITS.MAX_UPLOAD_SIZE_BYTES, // 5MB
    files: 1,
  },
  fileFilter,
});

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `avatar-${uuidv4()}${ext}`;
    cb(null, safeName);
  },
});

const avatarFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image format. Only PNG, JPG, JPEG, and WEBP image files are allowed.'));
  }
};

export const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: VALIDATION_LIMITS.MAX_UPLOAD_SIZE_BYTES, // 5MB
    files: 1,
  },
  fileFilter: avatarFileFilter,
});

