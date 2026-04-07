import { Router } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import courseRoutes from './course.routes';
import userRoutes from './user.routes';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'success',
    message: 'API is running',
    docs: '/api-docs',
  });
});

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/courses', courseRoutes);
router.use('/users', userRoutes);

export default router;
