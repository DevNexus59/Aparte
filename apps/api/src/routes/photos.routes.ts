import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { services } from '../services';
import { requireAuth, currentUser, AuthedRequest } from '../middlewares/auth';
import { asyncHandler, AppError } from '../middlewares/errorHandler';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

// I11 : rate limit applicatif — pas plus de 5 uploads/h/user.
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

export const photosRouter = Router();
photosRouter.use(requireAuth);

// Upload de la photo de profil (B6 : pas d'URL publique générée).
photosRouter.post(
  '/me',
  uploadLimiter,
  upload.single('photo'),
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.file) throw new AppError(400, 'Aucun fichier fourni (champ "photo")');
    const result = await services.photos.uploadProfilePhoto({
      userId: currentUser(req).id,
      buffer: req.file.buffer,
      mime: req.file.mimetype,
    });
    res.status(201).json(result);
  }),
);

// B6 : lecture authentifiée. La photo n'est visible que par soi-même
// ou par un membre du cercle réciproque.
photosRouter.get(
  '/:userId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { buffer, mime } = await services.photos.readPhotoFor(
      currentUser(req).id,
      req.params.userId,
    );
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(buffer);
  }),
);
