import asyncHandler from 'express-async-handler';
import { validationResult } from 'express-validator';
import Banner from '../models/Banner.js';

export const getBanners = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.placement) {
    filter.placement = req.query.placement;
  }
  const banners = await Banner.find(filter).sort({ order: 1, createdAt: -1 });
  res.json(banners);
});

export const getBannersAdmin = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.placement) {
    filter.placement = req.query.placement;
  }
  const banners = await Banner.find(filter).sort({ order: 1, createdAt: -1 });
  res.json(banners);
});

export const createBanner = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const payload = {
    title: req.body.title,
    subtitle: req.body.subtitle,
    image: req.body.image,
    linkUrl: req.body.linkUrl,
    buttonText: req.body.buttonText,
    order: req.body.order,
    backgroundColor: req.body.backgroundColor,
    isActive: req.body.isActive,
    placement: req.body.placement || 'hero',
    badgeText: req.body.badgeText || undefined,
  };

  const banner = await Banner.create(payload);
  res.status(201).json(banner);
});

export const updateBanner = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const banner = await Banner.findById(req.params.id);
  if (!banner) {
    res.status(404);
    throw new Error('Banner not found');
  }

  banner.title = req.body.title ?? banner.title;
  banner.subtitle = req.body.subtitle ?? banner.subtitle;
  banner.image = req.body.image ?? banner.image;
  banner.linkUrl = req.body.linkUrl ?? banner.linkUrl;
  banner.buttonText = req.body.buttonText ?? banner.buttonText;
  banner.isActive = req.body.isActive ?? banner.isActive;
  banner.order = req.body.order ?? banner.order;
  banner.backgroundColor = req.body.backgroundColor ?? banner.backgroundColor;
  banner.placement = req.body.placement ?? banner.placement;
  banner.badgeText = req.body.badgeText ?? banner.badgeText;

  const updated = await banner.save();
  res.json(updated);
});

export const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) {
    res.status(404);
    throw new Error('Banner not found');
  }

  await banner.deleteOne();
  res.json({ message: 'Banner removed' });
});

