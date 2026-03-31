import { NavigatorScreenParams } from '@react-navigation/native';
import { AuthStackParamList } from '../../modules/auth/types';
import { ProductStackParamList } from '../../modules/products/types';
import { CartStackParamList } from '../../modules/cart/types';
import { OrderStackParamList } from '../../modules/orders/types';
import { WishlistStackParamList } from '../../modules/wishlist/types';
import { ProfileStackParamList } from '../../modules/users/types';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  ProductDetail: { productId: string };
  ProductList: { category?: string; search?: string; title?: string };
  Search: undefined;
  Checkout: undefined;
  OrderDetail: { orderId: string };
  Addresses: undefined;
  ChangePassword: undefined;
  FAQ: undefined;
  Policy: { type: 'terms' | 'privacy-policy' | 'refund-policy' | 'shipping-policy' };
};

export type MainTabParamList = {
  HomeTab: undefined;
  CategoriesTab: undefined;
  CartTab: undefined;
  OrdersTab: undefined;
  ProfileTab: undefined;
};

// Re-export all module param lists for convenience
export type {
  AuthStackParamList,
  ProductStackParamList,
  CartStackParamList,
  OrderStackParamList,
  WishlistStackParamList,
  ProfileStackParamList,
};

// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
