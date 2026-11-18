// Valores aproximados por 100 g (tablas USDA / etiquetas típicas). Todos son editables en la app.
// [nombre, kcal, proteína, carbohidratos, grasa]
const RAW = [
  ['Tofu firme', 144, 17.3, 2.8, 8.7],
  ['Soya texturizada (seca)', 330, 50, 30, 1],
  ['Lentejas cocidas', 116, 9, 20, 0.4],
  ['Garbanzos cocidos', 164, 8.9, 27.4, 2.6],
  ['Frijoles negros cocidos', 132, 8.9, 23.7, 0.5],
  ['Arroz blanco cocido', 130, 2.7, 28, 0.3],
  ['Arroz integral cocido', 123, 2.7, 25.6, 1],
  ['Papa cocida', 87, 1.9, 20, 0.1],
  ['Plátano (maduro/macho)', 122, 1.3, 32, 0.4],
  ['Banano', 89, 1.1, 22.8, 0.3],
  ['Aguacate', 160, 2, 8.5, 14.7],
  ['Aceite de oliva', 884, 0, 0, 100],
  ['Avena en hojuelas', 389, 16.9, 66.3, 6.9],
  ['Leche de soya (sin azúcar)', 33, 2.9, 1.7, 1.6],
  ['Leche de almendras (sin azúcar)', 15, 0.6, 0.3, 1.2],
  ['Queso campesino', 264, 17, 3, 20],
  ['Huevo entero', 143, 12.6, 0.7, 9.5],
  ['Pan integral', 247, 13, 41, 3.4],
  ['Brócoli cocido', 35, 2.4, 7.2, 0.4],
  ['Espinaca cruda', 23, 2.9, 3.6, 0.4],
  ['Tomate', 18, 0.9, 3.9, 0.2],
  ['Cebolla', 40, 1.1, 9.3, 0.1],
  ['Zanahoria', 41, 0.9, 9.6, 0.2],
  ['Salsa teriyaki', 89, 5.9, 15.6, 0],
  ['Pechuga de pollo cocida', 165, 31, 0, 3.6],
  ['Atún en agua (escurrido)', 116, 26, 0, 0.8],
]

export const seedFoods = () =>
  RAW.map(([name, kcal, p, c, f], i) => ({ id: `seed-${i}`, name, brand: '', kcal, p, c, f }))
