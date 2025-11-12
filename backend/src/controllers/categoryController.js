import asyncHandler from 'express-async-handler';
import { validationResult } from 'express-validator';
import slugify from 'slugify';
import Category from '../models/Category.js';

const buildSlug = (value) =>
  slugify(value, {
    lower: true,
    strict: true,
  });

const attachParent = (query) =>
  query
    .populate({ path: 'parentId', select: 'name slug' })
    .lean({ virtuals: true });

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await attachParent(Category.find({ isActive: true }).sort({ order: 1, name: 1 }));
  res.json(categories);
});

export const getCategoriesAdmin = asyncHandler(async (req, res) => {
  const categories = await attachParent(Category.find().sort({ order: 1, name: 1 }));
  res.json(categories);
});

export const createCategory = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { name, slug, description, image, order, isActive, parentId } = req.body;
  const finalSlug = slug ? buildSlug(slug) : buildSlug(name);

  const exists = await Category.findOne({ slug: finalSlug });
  if (exists) {
    res.status(400);
    throw new Error('Category with this slug already exists');
  }

  const data = {
    name,
    slug: finalSlug,
    description,
    image,
    order,
    isActive,
    parentId: parentId || null,
  };

  if (parentId) {
    if (parentId === 'self') {
      res.status(400);
      throw new Error('Parent category is invalid');
    }
    const parent = await Category.findById(parentId);
    if (!parent) {
      res.status(400);
      throw new Error('Parent category not found');
    }
  }

  const category = await Category.create(data);
  const populated = await category.populate('parentId', 'name slug');
  res.status(201).json(populated);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const { parentId } = req.body;
  if (parentId !== undefined) {
    if (!parentId) {
      category.parentId = null;
    } else {
      if (parentId === category._id.toString()) {
        res.status(400);
        throw new Error('Category cannot be its own parent');
      }
      const parent = await Category.findById(parentId);
      if (!parent) {
        res.status(400);
        throw new Error('Parent category not found');
      }
      category.parentId = parent._id;
    }
  }

  if (req.body.name && req.body.name !== category.name && !req.body.slug) {
    category.slug = buildSlug(req.body.name);
  }

  if (req.body.slug) {
    const finalSlug = buildSlug(req.body.slug);
    if (finalSlug !== category.slug) {
      const exists = await Category.findOne({ slug: finalSlug });
      if (exists) {
        res.status(400);
        throw new Error('Category with this slug already exists');
      }
      category.slug = finalSlug;
    }
  }

  category.name = req.body.name ?? category.name;
  category.description = req.body.description ?? category.description;
  category.image = req.body.image ?? category.image;
  category.order = req.body.order ?? category.order;
  category.isActive = req.body.isActive ?? category.isActive;

  const updated = await category.save();
  const populated = await updated.populate('parentId', 'name slug');
  res.json(populated);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  await Category.updateMany({ parentId: category._id }, { $set: { parentId: null } });
  await category.deleteOne();
  res.json({ message: 'Category removed and children detached' });
});

