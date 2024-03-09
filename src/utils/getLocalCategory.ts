import { LOCAL_CATEGORIES } from '../categories/constants';

export function getLocalCategory(category: string) {
  for (const key in LOCAL_CATEGORIES) {
    if (LOCAL_CATEGORIES[key] === category) {
      return key;
    }
  }
  return null;
}
