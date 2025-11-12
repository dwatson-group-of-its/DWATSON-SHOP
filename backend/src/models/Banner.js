import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: '',
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      required: true,
    },
    linkUrl: {
      type: String,
      default: '',
    },
    buttonText: {
      type: String,
      default: 'Shop Now',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
    backgroundColor: {
      type: String,
      default: '#ffffff',
    },
    placement: {
      type: String,
      enum: ['hero', 'sale', 'promo'],
      default: 'hero',
      index: true,
    },
    badgeText: {
      type: String,
      default: 'Hot Deals',
      trim: true,
    },
  },
  { timestamps: true }
);

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;

