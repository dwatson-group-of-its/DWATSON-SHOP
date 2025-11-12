import express from 'express';
import { body } from 'express-validator';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
} from '../controllers/orderController.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(
    [
      body('paymentMethod')
        .isIn(['stripe', 'paypal', 'cod'])
        .withMessage('Payment method must be stripe, paypal, or cod'),
      body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
    ],
    createOrder
  )
  .get(getUserOrders);

router.route('/:id').get(getOrderById).put(authorize('admin'), updateOrderStatus);

export default router;

