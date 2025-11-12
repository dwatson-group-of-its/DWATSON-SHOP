import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: String,
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: String,
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    salePrice: {
      type: Number,
      min: 0,
    },
    category: {
      type: String,
      index: true,
    },
    brand: String,
    images: [String],
    countInStock: {
      type: Number,
      required: true,
      min: 0,
    },
    manufacturer: {
      type: String,
      trim: true,
      default: '',
    },
    ingredients: {
      type: String,
      default: '',
    },
    usage: {
      type: String,
      default: '',
    },
    benefits: {
      type: String,
      default: '',
    },
    sideEffects: {
      type: String,
      default: '',
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    reviews: [reviewSchema],
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);

export default Product;

