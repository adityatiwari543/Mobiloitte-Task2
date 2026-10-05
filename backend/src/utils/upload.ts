import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { VALIDATION_LIMITS, ERROR_CODES } from '@jobconnect/shared';
import { sendError } from './response.js';

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

/**
 * Binary Magic-Byte Inspection (OWASP ASVS V12 - File and Resource Verification)
 * Validates the true binary format of uploaded files to prevent MIME spoofing,
 * polyglot file attacks, and executable uploads disguised as safe documents/images.
 */
export function validateFileMagicBytes(filePath: string, expectedType: 'resume' | 'image' | 'pdf'): boolean {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  let fd: number | null = null;
  try {
    const buffer = Buffer.alloc(12);
    fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 12, 0);
    if (bytesRead < 4) {
      return false;
    }

    // 1. PDF: %PDF- (0x25 0x50 0x44 0x46)
    const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;

    // 2. PNG: \x89PNG (0x89 0x50 0x4E 0x47)
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;

    // 3. JPEG/JPG: \xFF\xD8\xFF
    const isJpg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;

    // 4. WEBP: RIFF....WEBP (0x52 0x49 0x46 0x46 .... 0x57 0x45 0x42 0x50)
    const isWebp =
      bytesRead >= 12 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50;

    // 5. DOCX / OpenXML (ZIP archive header: 0x50 0x4B 0x03 0x04)
    const isDocx = buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;

    // 6. Legacy DOC (OLE Compound File Header: 0xD0 0xCF 0x11 0xE0)
    const isDoc = buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0;

    if (expectedType === 'pdf') {
      return isPdf;
    }

    if (expectedType === 'image') {
      return isPng || isJpg || isWebp;
    }

    if (expectedType === 'resume') {
      return isPdf || isDocx || isDoc || isPng || isJpg || isWebp;
    }

    return false;
  } catch {
    return false;
  } finally {
    if (fd !== null) {
      try {
        fs.closeSync(fd);
      } catch {}
    }
  }
}

/**
 * Express middleware to validate magic bytes immediately after file upload.
 * If validation fails, the uploaded file is securely unlinked from disk and HTTP 400 is returned.
 */
export const validateUploadMagicBytes = (expectedType: 'resume' | 'image' | 'pdf') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.file) {
      return next();
    }

    const isValid = validateFileMagicBytes(req.file.path, expectedType);
    if (!isValid) {
      // Securely delete spoofed/malicious file
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch {}

      sendError(
        res,
        ERROR_CODES.VALIDATION_ERROR,
        `File verification failed. The uploaded file content does not match the expected binary signature (${expectedType}).`,
        400
      );
      return;
    }

    next();
  };
};


