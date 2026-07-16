export interface SearchSuggestion {
  id: string;
  title: string;
  type: 'product' | 'store';
  imageUrl?: string;
  price?: number;
}
