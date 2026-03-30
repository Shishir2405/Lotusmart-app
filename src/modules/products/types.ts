export type ProductStackParamList = {
  Home: undefined;
  ProductList: { category?: string; search?: string; title?: string };
  ProductDetail: { productId: string };
  Search: undefined;
};
