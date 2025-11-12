import asyncHandler from 'express-async-handler';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Category from '../models/Category.js';
import Banner from '../models/Banner.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [users, products, orders, categories, banners] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    Category.countDocuments(),
    Banner.countDocuments(),
  ]);

  res.json({
    users,
    products,
    orders,
    categories,
    banners,
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.role = req.body.role || user.role;
  user.isActive = req.body.isActive ?? user.isActive;

  const updatedUser = await user.save();
  res.json(updatedUser);
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
  res.json(orders);
});
