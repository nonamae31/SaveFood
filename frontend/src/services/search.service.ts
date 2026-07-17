import type { SearchSuggestion } from '../types/search.types';

export const searchService = {
  getSuggestions: async (query: string): Promise<SearchSuggestion[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!query.trim()) {
          resolve([]);
          return;
        }

        const lowerQuery = query.toLowerCase();

        // Mock data
        const mockData: SearchSuggestion[] = [
          { id: '1', title: 'Bánh mì thịt nướng', type: 'product', price: 20000 },
          { id: '2', title: 'Bánh ngọt ABC', type: 'product', price: 15000 },
          { id: '3', title: 'Gà rán KFC', type: 'product', price: 45000 },
          { id: '4', title: 'Cơm tấm Sà Bì Chưởng', type: 'product', price: 35000 },
          { id: '5', title: 'Tiệm bánh mì chú Hải', type: 'store' },
          { id: '6', title: 'Gà ủ muối', type: 'product', price: 150000 },
          { id: '7', title: 'Bánh mì chảo', type: 'product', price: 40000 },
        ];

        const results = mockData.filter(item => item.title.toLowerCase().includes(lowerQuery));
        resolve(results);
      }, 300);
    });
  }
};
