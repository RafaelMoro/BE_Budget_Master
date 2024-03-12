import { Types } from 'mongoose';
import { LocalCategories } from './interface';

export const SUBCATEGORY_CREATED_SUCCESS = 'Subcategory created';
export const SUBCATEGORY_ERROR = 'Subcategory already exists';
export const CATEGORY_EXISTS_MESSAGE = 'Category found. ';
export const CATEGORY_DELETED_MESSAGE = 'Category deleted';
export const CATEGORY_NOT_FOUND_ERROR = 'Category not found';
export const CATEGORY_CREATED_MESSAGE = 'New category created';

export const LOCAL_CATEGORIES: LocalCategories = {
  foodAndDrink: 'Food and Drink',
  house: 'Housing',
  utilities: 'Utilities',
  subcriptions: 'Subscriptions',
  transportation: 'Transportation',
  financialExpenses: 'Financial Expenses',
  healthCare: 'Health and Personal Care',
  kids: 'Kids',
  shopping: 'Shopping',
  entertainment: 'Entertainment and Leisure',
  savings: 'Savings',
};

const FOOD_AND_DRINK_CATEGORY = {
  _id: new Types.ObjectId(),
  __v: 0,
  categoryName: 'Food and Drink',
  subCategories: [
    'Bar',
    'Alcohol & Cigarettes',
    'Takeout',
    'Fast Food',
    'Cofee shops',
    'Restaurants',
    'Groceries',
  ],
  icon: 'foodAndDrink',
};
const HOUSING_CATEGORY = {
  _id: new Types.ObjectId(),
  __v: 0,
  categoryName: 'Housing',
  subCategories: [
    'Rent',
    'Mortgage',
    'Home maintenance and Repairs',
    'Property taxes',
  ],
  icon: 'house',
};
const UTILITIES_CATEGORY = {
  _id: new Types.ObjectId(),
  __v: 0,
  categoryName: 'Utilities',
  subCategories: [
    'Electricity',
    'Gas',
    'Heating',
    'Water',
    'Internet',
    'Cable',
    'Mobile communication',
    'Safety',
  ],
  icon: 'utilities',
};
const SUSCRIPTIONS_CATEGORY = {
  _id: new Types.ObjectId(),
  __v: 0,
  categoryName: 'Subscriptions',
  subCategories: ['Streaming services', 'Gym', 'Software'],
  icon: 'subcriptions',
};
const TRANSPORTATION_CATEGORY = {
  _id: new Types.ObjectId(),
  __v: 0,
  categoryName: 'Transportation',
  subCategories: [
    'Gas/Fuel',
    'Car Rental',
    'Car maintenance and repair',
    'Parking fees',
    'Public Transportation',
    'Uber/Didi',
    'Airplane tickets',
    'Taxi',
  ],
  icon: 'transportation',
};
const FINANCIAL_EXPENSES_CATEGORY = {
  _id: new Types.ObjectId(),
  __v: 0,
  categoryName: 'Financial Expenses',
  subCategories: [
    'Counselling / Guidance',
    'Family',
    'Goverment fee/payment',
    'Bank Charges / fees',
    'Fines / Penalties',
    'Taxes',
    'Credit card debt',
    'Auto insurance / Car Loan',
    'Loan',
    'Payment',
    'Personal loan',
    'Funding',
    'Insurance',
  ],
  icon: 'debtAndLoans',
};
const HEALTHCARE_CATEGORY = {
  _id: new Types.ObjectId(),
  __v: 0,
  categoryName: 'Health and Personal Care',
  subCategories: [
    'Barber',
    'Therapist / Mental Health',
    'Speciality Care',
    'Dental care',
    'Urgent care',
    'Medicines',
    'Hospital',
    'Prescriptions',
    'Out of pocket costs for primary care',
    'Health supplements',
  ],
  icon: 'healthCare',
};
const KIDS_CATEGORY = {
  _id: new Types.ObjectId(),
  __v: 0,
  categoryName: 'Kids',
  subCategories: [
    'Child support',
    'Necessities',
    'Tuition / Tutoring',
    'Toys',
    'Gifts',
    'School supplies / lunch',
    'Extra-curricular activities',
    'Go out',
    'Clothing',
    'Footwear',
  ],
  icon: 'kids',
};
const SHOPPING = {
  _id: new Types.ObjectId(),
  __v: 0,
  categoryName: 'Shopping',
  subCategories: [
    'Clothes',
    'Footwear',
    'Kids',
    'House / Garden',
    'Electronics / accesories',
    'Videogames',
    'Software',
    'Pharmacy',
    'Jewerly / accesories',
    'Pets',
    'Stationery / tools',
    'Gifts',
    'Health and beauty',
    'Free time / Hobbies',
  ],
  icon: 'shopping',
};

const ENTERTAINMENT_AND_LEISURE_CATEGORY = {
  _id: new Types.ObjectId(),
  __v: 0,
  categoryName: 'Entertainment and Leisure',
  subCategories: [
    'Go Out',
    'Wellness and beauty',
    'Charity / Gifts',
    'Sports events / Culture',
    'Sports / Fitness',
    'Education / Personal development',
    'Special events',
    'Books, audiobooks',
    'Lottery / Gambling',
    'Vacations / Hotel',
    'Hobbies',
    'Concerts',
    'Cinema',
  ],
  icon: 'entertainment',
};
const SAVINGS_CATEGORY = {
  _id: 'local-category-11', // new Types.ObjectId('local-category-11'),
  __v: 0,
  categoryName: 'Savings',
  subCategories: [
    'Savings',
    'Collectible',
    'Emergency Fund',
    'Retirement',
    'Investments',
    'Vacations',
    'Car / Real property ',
  ],
  icon: 'savings',
};

export const CATEGORIES_RECORDS = [
  FOOD_AND_DRINK_CATEGORY,
  HOUSING_CATEGORY,
  UTILITIES_CATEGORY,
  SUSCRIPTIONS_CATEGORY,
  TRANSPORTATION_CATEGORY,
  FINANCIAL_EXPENSES_CATEGORY,
  HEALTHCARE_CATEGORY,
  KIDS_CATEGORY,
  SHOPPING,
  ENTERTAINMENT_AND_LEISURE_CATEGORY,
  SAVINGS_CATEGORY,
];
