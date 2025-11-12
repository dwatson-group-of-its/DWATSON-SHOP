import express from 'express';
import { body } from 'express-validator';
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(
    protect,
    authorize('admin'),
    [
      body('name').notEmpty().withMessage('Name is required'),
      body('description').notEmpty().withMessage('Description is required'),
      body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
      body('countInStock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
      body('categoryId').optional({ checkFalsy: true }).isMongoId().withMessage('Category must be a valid id'),
    ],
    createProduct
  );

router
  .route('/:id')
  .put(
    protect,
    authorize('admin'),
    [
      body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
      body('countInStock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
      body('categoryId').optional({ checkFalsy: true }).isMongoId().withMessage('Category must be a valid id'),
    ],
    updateProduct
  )
  .delete(protect, authorize('admin'), deleteProduct);

router.route('/:id/reviews').post(protect, createProductReview);

router.get('/slug/:slug', getProductBySlug);

export default router;
