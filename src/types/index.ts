export type UserRole = 'admin' | 'customer';

export type ProductType = 'spice' | 'dry_fruit' | 'gifting' | 'herb' | 'honey' | 'superfood';

export type ProductUnit = 'kg' | 'g' | 'pieces' | 'pack' | 'ml' | 'L' | 'box';

export type PaymentMethod = 'cod' | 'razorpay';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type AddressLabel = 'home' | 'work' | 'other';

export type AuthProvider = 'local' | 'google';

export interface IGeoCoordinates {
  lat: number;
  lng: number;
}

export interface IAddress {
  _id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
  label?: AddressLabel;
  coordinates?: IGeoCoordinates;
  formattedAddress?: string;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  addresses: IAddress[];
  isVerified: boolean;
  profileComplete: boolean;
  authProvider?: AuthProvider;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IProductVariantOption {
  name: string;
  value: string;
  priceAdjustment: number;
  stock: number;
}

export interface IProductVariant {
  name: string;
  options: IProductVariantOption[];
}

export interface INutritionInfo {
  servingSize?: string;
  calories?: number;
  totalFat?: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  sodium?: number;
  totalCarbohydrates?: number;
  dietaryFiber?: number;
  sugars?: number;
  protein?: number;
  vitamins?: Record<string, string>;
  minerals?: Record<string, string>;
}

export interface IBulkPricing {
  minQty: number;
  maxQty: number;
  price: number;
  unit: ProductUnit;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  images: string[];
  category: ICategory | string;
  subcategory?: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stock: number;
  variants: IProductVariant[];
  ratings: { average: number; count: number };
  brand?: string;
  nutritionInfo?: INutritionInfo;
  bulkPricing?: IBulkPricing[];
  certifications?: string[];
  isOrganic?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  productType?: ProductType;
  unit?: ProductUnit;
  isFeatured?: boolean;
  isActive?: boolean;
  tags?: string[];
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICartItem {
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  variant?: string;
  stock: number;
  unit?: string;
}

export interface IWishlistItem {
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  unit?: string;
  isInStock: boolean;
}

export interface IOrderItem {
  product: string | IProduct;
  name: string;
  image: string;
  price: number;
  quantity: number;
  variant?: string;
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  user: string;
  items: IOrderItem[];
  shippingAddress: IAddress;
  billingAddress?: IAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  trackingNumber?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICoupon {
  _id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
}

export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]> | string[];
  statusCode: number;
}

export interface IPaginatedResponse<T = unknown> extends IApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  search?: string;
  page?: number;
  limit?: number;
  tags?: string;
  isFeatured?: boolean;
  productType?: ProductType;
}
