export type FoodItem = {
  id: string;
  name: string;
  nutrient: string;
  nutrientDesc: string;
  color: string;
  demoFill: number;
  geometryType: 'idli' | 'vada' | 'palak' | 'curd' | 'egg' | 'sambar';
  angleDeg: number;
  radius: number;
};

export const PRESET_BREAKFAST: FoodItem[] = [
  {
    id: 'food_1',
    name: 'Idli',
    nutrient: 'Carbs',
    nutrientDesc: 'a main source of energy',
    color: '#F2B33D',
    demoFill: 72,
    geometryType: 'idli',
    angleDeg: 225,
    radius: 0.75,
  },
  {
    id: 'food_2',
    name: 'Vada',
    nutrient: 'Protein',
    nutrientDesc: 'helps your body build and repair',
    color: '#2E9E5B',
    demoFill: 62,
    geometryType: 'vada',
    angleDeg: 305,
    radius: 0.8,
  },
  {
    id: 'food_3',
    name: 'Palak',
    nutrient: 'Iron',
    nutrientDesc: 'helps carry oxygen around',
    color: '#E2582E',
    demoFill: 54,
    geometryType: 'palak',
    angleDeg: 30,
    radius: 1.0,
  },
  {
    id: 'food_4',
    name: 'Curd',
    nutrient: 'Calcium',
    nutrientDesc: 'supports bones and teeth',
    color: '#2BB3CE',
    demoFill: 82,
    geometryType: 'curd',
    angleDeg: 90,
    radius: 1.05,
  },
  {
    id: 'food_5',
    name: 'Egg',
    nutrient: 'Vitamin B12',
    nutrientDesc: 'supports nerves and energy',
    color: '#7B5CD6',
    demoFill: 60,
    geometryType: 'egg',
    angleDeg: 270,
    radius: 1.05,
  },
  {
    id: 'food_6',
    name: 'Sambar',
    nutrient: 'Fiber',
    nutrientDesc: 'keeps digestion moving',
    color: '#2F9E8F',
    demoFill: 68,
    geometryType: 'sambar',
    angleDeg: 150,
    radius: 1.0,
  },
];
