import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';

const uploadDir = path.join(process.cwd(), 'uploads', 'img');
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const detectedFormats = {
  jpg: { extension: '.jpg', mime: 'image/jpeg' },
  png: { extension: '.png', mime: 'image/png' },
  webp: { extension: '.webp', mime: 'image/webp' },
};

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, _file, cb) => cb(null, `${crypto.randomUUID()}.upload`),
});

const hasPrefix = (buffer, bytes, offset = 0) => bytes.every((byte, index) => buffer[offset + index] === byte);

const detectImageFormat = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  if (hasPrefix(buffer, [0xff, 0xd8, 0xff])) return detectedFormats.jpg;
  if (hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return detectedFormats.png;
  if (hasPrefix(buffer, [0x52, 0x49, 0x46, 0x46]) && hasPrefix(buffer, [0x57, 0x45, 0x42, 0x50], 8)) return detectedFormats.webp;
  return null;
};

const validateAndRename = (file) => {
  const originalExtension = path.extname(file.originalname || '').toLowerCase();
  if (!allowedExtensions.has(originalExtension)) {
    throw new Error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.');
  }

  const detected = detectImageFormat(file.path);
  const extensionMatches = detected && (detected.extension === originalExtension || (detected.extension === '.jpg' && originalExtension === '.jpeg'));
  if (!detected || detected.mime !== file.mimetype || !extensionMatches) {
    throw new Error('Định dạng ảnh không hợp lệ hoặc không khớp nội dung tệp.');
  }

  const finalName = `${crypto.randomUUID()}${detected.extension}`;
  const finalPath = path.join(uploadDir, finalName);
  fs.renameSync(file.path, finalPath);
  file.filename = finalName;
  file.path = finalPath;
  file.destination = uploadDir;
  file.originalname = `${finalName}`;
  file.mimetype = detected.mime;
};

const validateUploadedFiles = (req, _res, next) => {
  const files = [...(req.files || []), ...(req.file ? [req.file] : [])];
  try {
    files.forEach(validateAndRename);
    next();
  } catch (error) {
    files.forEach((file) => {
      if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    });
    next(error);
  }
};

const fileFilter = (_req, file, cb) => {
  const extension = path.extname(file.originalname || '').toLowerCase();
  if (!allowedExtensions.has(extension)) {
    cb(new Error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.'));
    return;
  }
  cb(null, true);
};

export const uploadImage = Object.assign(
  multer({
    storage,
    fileFilter,
    limits: { fileSize: 3 * 1024 * 1024 },
  }),
  { validateUploadedFiles },
);

export { validateUploadedFiles };
