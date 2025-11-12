import express from 'express';
import { body } from 'express-validator';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  getAllOrders,
} from '../controllers/adminController.js';
import {
  getCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import {
  getBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
} from '../controllers/bannerController.js';

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

router
  .route('/categories')
  .get(getCategoriesAdmin)
  .post(
    [
      body('name').notEmpty().withMessage('Name is required'),
      body('slug').optional({ checkFalsy: true }).isString(),
      body('description').optional({ checkFalsy: true }).isString(),
      body('image').optional({ checkFalsy: true }).isString(),
      body('order').optional().isInt({ min: 0 }).withMessage('Order must be a positive integer'),
      body('isActive').optional().isBoolean(),
      body('parentId').optional({ checkFalsy: true }).isMongoId().withMessage('Parent must be a valid category id'),
    ],
    createCategory
  );

router
  .route('/categories/:id')
  .put(
    [
      body('name').optional({ checkFalsy: true }).isString(),
      body('slug').optional({ checkFalsy: true }).isString(),
      body('description').optional({ checkFalsy: true }).isString(),
      body('image').optional({ checkFalsy: true }).isString(),
      body('order').optional().isInt({ min: 0 }).withMessage('Order must be a positive integer'),
      body('isActive').optional().isBoolean(),
      body('parentId').optional({ checkFalsy: true }).isMongoId().withMessage('Parent must be a valid category id'),
    ],
    updateCategory
  )
  .delete(deleteCategory);

router
  .route('/banners')
  .get(getBannersAdmin)
  .post(
    [
      body('title').optional({ checkFalsy: true }).isString(),
      body('image').notEmpty().withMessage('Image URL is required'),
      body('subtitle').optional({ checkFalsy: true }).isString(),
      body('linkUrl').optional({ checkFalsy: true }).isString(),
      body('buttonText').optional({ checkFalsy: true }).isString(),
      body('order').optional().isInt({ min: 0 }).withMessage('Order must be a positive integer'),
      body('isActive').optional().isBoolean(),
      body('backgroundColor').optional({ checkFalsy: true }).isString(),
      body('placement')
        .optional({ checkFalsy: true })
        .isIn(['hero', 'sale', 'promo'])
        .withMessage('Placement must be hero, sale, or promo'),
      body('badgeText').optional({ checkFalsy: true }).isString(),
    ],
    createBanner
  );

router
  .route('/banners/:id')
  .put(
    [
      body('title').optional({ checkFalsy: true }).isString(),
      body('image').optional({ checkFalsy: true }).isString(),
      body('subtitle').optional({ checkFalsy: true }).isString(),
      body('linkUrl').optional({ checkFalsy: true }).isString(),
      body('buttonText').optional({ checkFalsy: true }).isString(),
      body('order').optional().isInt({ min: 0 }).withMessage('Order must be a positive integer'),
      body('isActive').optional().isBoolean(),
      body('backgroundColor').optional({ checkFalsy: true }).isString(),
      body('placement')
        .optional({ checkFalsy: true })
        .isIn(['hero', 'sale', 'promo'])
        .withMessage('Placement must be hero, sale, or promo'),
      body('badgeText').optional({ checkFalsy: true }).isString(),
    ],
    updateBanner
  )
  .delete(deleteBanner);

export default router;
