import asyncHandler from 'express-async-handler';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { createPaymentIntent, capturePayPalOrder } from '../services/paymentService.js';

const calculateOrderTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRate = Number(process.env.TAX_RATE || 0);
  const shippingFlat = Number(process.env.SHIPPING_FLAT || 0);
  const tax = Number((subtotal * taxRate).toFixed(2));
  const totalPrice = Number((subtotal + tax + shippingFlat).toFixed(2));

  return {
    subtotal,
    tax,
    shipping: shippingFlat,
    totalPrice,
  };
};

export const createOrder = asyncHandler(async (req, res) => {
  const { paymentMethod, shippingAddress, paymentToken } = req.body;

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Cart is empty');
  }

  const orderItems = cart.items.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    image: item.product.images?.[0],
    price: item.price,
    quantity: item.quantity,
  }));

  const totals = calculateOrderTotals(orderItems);

  let paymentResult = null;

  if (paymentMethod === 'stripe') {
    paymentResult = await createPaymentIntent({
      amount: Math.round(totals.totalPrice * 100),
      currency: process.env.CURRENCY || 'usd',
      paymentMethodId: paymentToken,
      customerEmail: req.user.email,
    });
  } else if (paymentMethod === 'paypal') {
    paymentResult = await capturePayPalOrder(paymentToken);
  }

  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod,
    paymentResult,
    ...totals,
    status: paymentMethod === 'cod' ? 'pending' : 'paid',
    paidAt: paymentMethod === 'cod' ? null : new Date(),
  });

  // Update stock
  await Promise.all(
    cart.items.map(async (item) => {
      const product = await Product.findById(item.product._id);
      if (product) {
        product.countInStock = Math.max(product.countInStock - item.quantity, 0);
        await product.save();
      }
    })
  );

  cart.items = [];
  cart.total = 0;
  await cart.save();

  res.status(201).json(order);
});

export const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Forbidden');
  }

  res.json(order);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.status = req.body.status || order.status;

  if (req.body.status === 'delivered') {
    order.deliveredAt = new Date();
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

