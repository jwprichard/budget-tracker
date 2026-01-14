import multer from 'multer';
import { Request } from 'express';

// Configure multer for memory storage (no disk persistence)
const storage = multer.memoryStorage();

// File filter to only accept CSV files
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'));
  }
};

// Configure multer with limits
export const uploadCSV = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 1, // Only one file at a time
  },
});
