import asyncHandler from 'express-async-handler';
import slugify from 'slugify';
import { validationResult } from 'express-validator';
import Product from '../models/Product.js';

export const getProducts = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 12;
  const page = Number(req.query.page) || 1;

  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  const categoryFilter = req.query.category ? { category: req.query.category } : {};
  const featuredFilter = req.query.featured === 'true' ? { isFeatured: true } : {};
  const trendingFilter = req.query.trending === 'true' ? { isTrending: true } : {};

  const filters = { ...keyword, ...categoryFilter, ...featuredFilter, ...trendingFilter };
  const count = await Product.countDocuments(filters);
  const products = await Product.find(filters)
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json(product);
});

export const createProduct = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const {
    name,
    description,
    price,
    salePrice,
    category,
    brand,
    images,
    countInStock,
    isFeatured,
    isTrending,
    manufacturer,
    ingredients,
    usage,
    benefits,
    sideEffects,
  } = req.body;

  const slug = slugify(name, { lower: true, strict: true });

  const productExists = await Product.findOne({ slug });
  if (productExists) {
    res.status(400);
    throw new Error('Product with this name already exists');
  }

  const product = await Product.create({
    name,
    slug,
    description,
    price,
    salePrice,
    category,
    brand,
    images,
    countInStock,
    isFeatured,
    isTrending,
    manufacturer,
    ingredients,
    usage,
    benefits,
    sideEffects,
  });

  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const {
    name,
    description,
    price,
    salePrice,
    category,
    brand,
    images,
    countInStock,
    isFeatured,
    isTrending,
    manufacturer,
    ingredients,
    usage,
    benefits,
    sideEffects,
  } = req.body;

  if (name && name !== product.name) {
    product.slug = slugify(name, { lower: true, strict: true });
  }

  product.name = name || product.name;
  product.description = description || product.description;
  product.price = price ?? product.price;
  product.salePrice = salePrice ?? product.salePrice;
  product.category = category || product.category;
  product.brand = brand || product.brand;
  product.images = images || product.images;
  product.countInStock = countInStock ?? product.countInStock;
  product.isFeatured = isFeatured ?? product.isFeatured;
  product.isTrending = isTrending ?? product.isTrending;
  product.manufacturer = manufacturer ?? product.manufacturer;
  product.ingredients = ingredients ?? product.ingredients;
  product.usage = usage ?? product.usage;
  product.benefits = benefits ?? product.benefits;
  product.sideEffects = sideEffects ?? product.sideEffects;

  const updatedProduct = await product.save();

  res.json(updatedProduct);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  await product.deleteOne();

  res.json({ message: 'Product removed' });
});

export const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const alreadyReviewed = product.reviews.find(
    (review) => review.user.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('Product already reviewed');
  }

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  product.reviews.push(review);
  product.ratingsCount = product.reviews.length;
  product.ratingsAverage =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

  await product.save();
  res.status(201).json({ message: 'Review added' });
});

