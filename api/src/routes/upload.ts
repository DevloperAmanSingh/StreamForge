import { Router } from 'express';
import multer from 'multer';
import { uploadHandler } from '../controllers/uploadController';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('video'), uploadHandler);

export default router;
