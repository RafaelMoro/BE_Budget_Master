import { LocalCategories } from './interface';
import { CreateCategoriesDto } from './dtos/categories.dto';

export const SUBCATEGORY_CREATED_SUCCESS = 'Subcategory created';
export const SUBCATEGORY_ERROR = 'Subcategory already exists';
export const CATEGORY_EXISTS_MESSAGE = 'Category found. ';
export const CATEGORY_DELETED_MESSAGE = 'Category deleted';
export const CATEGORY_NOT_FOUND_ERROR = 'Category not found';
export const CATEGORY_CREATED_MESSAGE = 'New category created';
export const LOCAL_CATEGORIES_EXISTS_ERROR = 'Local categories already exists';

export const LOCAL_CATEGORIES: LocalCategories = {
  foodAndDrink: 'Comida y Bebida',
  house: 'Vivienda',
  utilities: 'Servicios básicos',
  subcriptions: 'Suscripciones',
  transportation: 'Transporte',
  financialExpenses: 'Gastos financieros',
  healthCare: 'Salud',
  kids: 'Niños',
  shopping: 'Compras',
  entertainment: 'Entretenimiento',
  savings: 'Ahorro',
};

const FOOD_AND_DRINK_CATEGORY = {
  categoryName: 'Comida y Bebida',
  subCategories: [
    'Bar',
    'Alcohol & Cigarros',
    'Comida para llevar',
    'Comida rápida',
    'Cafetería',
    'Restaurantes',
    'Despensa',
  ],
  icon: 'foodAndDrink',
};
const HOUSING_CATEGORY = {
  categoryName: 'Vivienda',
  subCategories: [
    'Renta',
    'Hipoteca',
    'Mantenimiento y reparaciones del hogar',
    'Impuestos sobre la vivienda',
  ],
  icon: 'house',
};
const UTILITIES_CATEGORY = {
  categoryName: 'Servicios básicos',
  subCategories: [
    'Luz',
    'Gas',
    'Calefacción',
    'Agua',
    'Internet',
    'Cable',
    'Communicación móvil',
    'Seguridad',
  ],
  icon: 'utilities',
};
const SUSCRIPTIONS_CATEGORY = {
  categoryName: 'Suscripciones',
  subCategories: [
    'Servicios de streaming',
    'Gimnasio',
    'Software',
    'Membresías',
    'Aprendizaje y educación',
    'Suscripciones en línea',
  ],
  icon: 'subcriptions',
};
const TRANSPORTATION_CATEGORY = {
  categoryName: 'Transporte',
  subCategories: [
    'Gasolina',
    'Renta de carro',
    'Mantenimiento y reparaciones del carro',
    'Tarifas de estacionamiento',
    'Transporte público',
    'Uber/Didi',
    'Boletos de avión',
    'Taxi',
  ],
  icon: 'transportation',
};
const FINANCIAL_EXPENSES_CATEGORY = {
  categoryName: 'Gastos financieros',
  subCategories: [
    'Asesoramiento u orientación',
    'Asignación familiar',
    'Pagos gubernamentales',
    'Comisiones bancarias',
    'Multas o penalizaciones',
    'Cargos y tasas',
    'Impuestos',
    'Deuda de tarjeta de crédito',
    'Seguro o préstamo del carro',
    'Préstamo',
    'Pago',
    'Financiamiento',
    'Seguro',
    'Intereses',
  ],
  icon: 'debtAndLoans',
};
const HEALTHCARE_CATEGORY = {
  categoryName: 'Salud',
  subCategories: [
    'Barbero / Peluquería',
    'Psicólogo / Salud mental',
    'Atención médica especializada',
    'Cuidado dental',
    'Atención de urgencia',
    'Medicinas',
    'Hospital',
    'Recetas médicas',
    'Suplementos de salud',
  ],
  icon: 'healthCare',
};
const KIDS_CATEGORY = {
  categoryName: 'Niños',
  subCategories: [
    'Pensión alimenticiat',
    'Necesidades básicas',
    'Clases particulares',
    'Juguetes',
    'Regalos',
    'Útiles escolares / almuerzo',
    'Actividades extracurriculares',
    'Salidas',
    'Ropa',
    'Calzado',
  ],
  icon: 'kids',
};
const SHOPPING = {
  categoryName: 'Compras',
  subCategories: [
    'Ropa',
    'Calzado',
    'Niños',
    'Casa y jardín',
    'Electrónica o accesorios',
    'Videojuegos',
    'Software',
    'Farmacia',
    'Joyeria',
    'Mascotas',
    'Papelería / Herramientas',
    'Regalos',
    'Salud y belleza',
    'Tiempo libre / Hobbies',
  ],
  icon: 'shopping',
};

const ENTERTAINMENT_AND_LEISURE_CATEGORY = {
  categoryName: 'Entretenimiento',
  subCategories: [
    'Salidas',
    'Bienestar y belleza',
    'Donaciones / Regalos',
    'Eventos deportivos / Cultura',
    'Deportes / Fitness',
    'Educación / Desarrollo personal',
    'Eventos especiales',
    'Libros, audiolibros',
    'Lotería / Juegos de azar',
    'Vacaciones / Hotel',
    'Hobbies',
    'Conciertos',
    'Cine',
  ],
  icon: 'entertainment',
};
const SAVINGS_CATEGORY = {
  categoryName: 'Ahorro',
  subCategories: [
    'Ahorros',
    'Fondo de emergencia',
    'Jubilación',
    'Inversiones',
    'Vacaciones',
    'Automóvil / Propiedad inmobiliaria ',
  ],
  icon: 'savings',
};
const INCOME_CATEGORY = {
  categoryName: 'Ingreso',
  subCategories: [
    'Salario',
    'Comisiones / bonos',
    'Propinas',
    'Inversiones',
    'Negocios',
    'Servicios profesionales',
    'Reembolsos',
    'Regalos',
  ],
  icon: 'income',
};

export const ALL_LOCAL_CATEGORIES: CreateCategoriesDto[] = [
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
  INCOME_CATEGORY,
];
