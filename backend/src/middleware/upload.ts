import type { RequestHandler } from 'express';
import { IMAGE_MAX_BYTES, IMAGE_TYPES, RESUME_MAX_BYTES, ERROR_CODES } from '@parichay/shared';
import multer from 'multer';
import { AppError } from '../lib/errors';
import { ERRORS } from '../lib/messages';

interface UploadOptions {
  field: string; // the multipart field name
  maxBytes: number;
  allowedTypes: string[];
  typeMessage: string;
  sizeMessage: string;
  invalidMessage: string;
}

// Memory storage: the file stays in a Buffer for this request only, never on disk. The declared
// type is only a cheap first check; the services verify the real bytes (detectImageType,
// looksLikePdf). Every upload failure becomes the API's standard error format.
function singleFileUpload(options: UploadOptions): RequestHandler {
  const { field, maxBytes, allowedTypes, typeMessage, sizeMessage, invalidMessage } = options;
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) return cb(null, true);
      cb(new AppError(400, 'UNSUPPORTED_FILE_TYPE', typeMessage));
    },
  }).single(field);

  return (req, res, next) => {
    upload(req, res, (err: unknown) => {
      if (!err) return next();
      if (err instanceof AppError) return next(err);
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError(413, ERROR_CODES.FILE_TOO_LARGE, sizeMessage));
      }
      next(new AppError(400, 'INVALID_UPLOAD', invalidMessage));
    });
  };
}

// One image in the "avatar" field, up to 2 MB, into req.file.
export const avatarUpload = singleFileUpload({
  field: 'avatar',
  maxBytes: IMAGE_MAX_BYTES,
  allowedTypes: [...IMAGE_TYPES],
  typeMessage: ERRORS.imageTypes,
  sizeMessage: ERRORS.imageTooLarge,
  invalidMessage: ERRORS.sendAvatar,
});

// One PDF in the "resume" field, up to 5 MB, into req.file.
export const resumeUpload = singleFileUpload({
  field: 'resume',
  maxBytes: RESUME_MAX_BYTES,
  allowedTypes: ['application/pdf'],
  typeMessage: ERRORS.pdfOnly,
  sizeMessage: ERRORS.pdfTooLarge,
  invalidMessage: ERRORS.sendResume,
});

// One image in the "cover" field, up to 2 MB (the same limits as the avatar), into req.file.
export const coverUpload = singleFileUpload({
  field: 'cover',
  maxBytes: IMAGE_MAX_BYTES,
  allowedTypes: [...IMAGE_TYPES],
  typeMessage: ERRORS.imageTypes,
  sizeMessage: ERRORS.imageTooLarge,
  invalidMessage: ERRORS.sendCover,
});

// One image in the "image" field, up to 2 MB (the same limits as the avatar), into req.file: a project's
// gallery image.
export const imageUpload = singleFileUpload({
  field: 'image',
  maxBytes: IMAGE_MAX_BYTES,
  allowedTypes: [...IMAGE_TYPES],
  typeMessage: ERRORS.imageTypes,
  sizeMessage: ERRORS.imageTooLarge,
  invalidMessage: ERRORS.sendImage,
});
