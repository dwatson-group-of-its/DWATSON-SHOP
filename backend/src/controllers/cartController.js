import asyncHandler from 'express-async-handler';
import { validationResult } from 'express-validator';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const getUserCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [], total: 0 });
  }
  return cart;
};

export const getCart = asyncHandler(async (req, res) => {
  const cart = await getUserCart(req.user._id);
  res.json(cart);
});

export const addToCart = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { productId, quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const cart = await getUserCart(req.user._id);
  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId.toString()
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += Number(quantity);
    cart.items[itemIndex].price = product.salePrice ?? product.price;
  } else {
    cart.items.push({
      product: productId,
      quantity: Number(quantity),
      price: product.salePrice ?? product.price,
    });
  }

  cart.calculateTotals();
  await cart.save();
  await cart.populate('items.product');

  res.status(201).json(cart);
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { productId, quantity } = req.body;

  const cart = await getUserCart(req.user._id);
  const item = cart.items.find((i) => i.product.toString() === productId.toString());

  if (!item) {
    res.status(404);
    throw new Error('Item not found in cart');
  }

  item.quantity = Number(quantity);
  cart.calculateTotals();
  await cart.save();
  await cart.populate('items.product');

  res.json(cart);
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await getUserCart(req.user._id);
  cart.items = cart.items.filter((item) => item.product.toString() !== productId.toString());
  cart.calculateTotals();
  await cart.save();
  await cart.populate('items.product');

  res.json(cart);
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getUserCart(req.user._id);
  cart.items = [];
  cart.total = 0;
  await cart.save();
  res.json(cart);
});
