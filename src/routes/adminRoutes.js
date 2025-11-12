import express from 'express';
import { body } from 'express-validator';
import { authorize, protect } from '../middleware/authMiddleware.js';
import {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  getAllOrders,
} from '../controllers/adminController.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put(
  '/users/:id',
  [body('role').optional().isIn(['customer', 'admin']).withMessage('Invalid role supplied')],
  updateUserRole
);
router.get('/orders', getAllOrders);

export default router;

