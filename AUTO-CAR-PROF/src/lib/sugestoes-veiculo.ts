export type CampoVeiculo = 'marca' | 'modelo' | 'ano';

export const MODELOS_POR_MARCA: Record<string, string[]> = {
  Audi: ['A3', 'A4', 'A5', 'A6', 'Q3', 'Q5', 'Q7'],
  BMW: ['Série 1', 'Série 2', 'Série 3', 'Série 5', 'X1', 'X3', 'X5'],
  BYD: ['Dolphin', 'Dolphin Mini', 'King', 'Seal', 'Song Plus', 'Yuan Plus'],
  'Caoa Chery': ['Arrizo 5', 'Arrizo 6', 'Tiggo 5X', 'Tiggo 7', 'Tiggo 8'],
  Chevrolet: ['Agile', 'Celta', 'Cobalt', 'Corsa', 'Cruze', 'Montana', 'Onix', 'Prisma', 'S10', 'Spin', 'Tracker'],
  Citroën: ['Aircross', 'Basalt', 'C3', 'C3 Aircross', 'C4 Cactus'],
  Fiat: ['Argo', 'Cronos', 'Fastback', 'Fiorino', 'Mobi', 'Palio', 'Pulse', 'Strada', 'Toro'],
  Ford: ['Bronco', 'EcoSport', 'Ka', 'Maverick', 'Ranger', 'Territory'],
  GWM: ['Haval H6', 'Ora 03', 'Poer'],
  Honda: ['City', 'Civic', 'Fit', 'HR-V', 'WR-V'],
  Hyundai: ['Creta', 'HB20', 'HB20S', 'i30', 'Tucson'],
  Jeep: ['Commander', 'Compass', 'Renegade', 'Wrangler'],
  Kia: ['Bongo', 'Cerato', 'Niro', 'Sportage'],
  'Mercedes-Benz': ['Classe A', 'Classe C', 'Classe E', 'GLA', 'GLB', 'GLC'],
  Mitsubishi: ['ASX', 'Eclipse Cross', 'L200', 'Outlander', 'Pajero'],
  Nissan: ['Frontier', 'Kicks', 'March', 'Sentra', 'Versa'],
  Peugeot: ['2008', '208', '3008', 'Partner'],
  Renault: ['Captur', 'Duster', 'Kardian', 'Kwid', 'Logan', 'Oroch', 'Sandero'],
  Subaru: ['Forester', 'Impreza', 'XV'],
  Suzuki: ['Jimny', 'S-Cross', 'Swift', 'Vitara'],
  Tesla: ['Model 3', 'Model S', 'Model X', 'Model Y'],
  Toyota: ['Camry', 'Corolla', 'Corolla Cross', 'Etios', 'Hilux', 'RAV4', 'SW4', 'Yaris'],
  Volkswagen: ['Amarok', 'Fox', 'Gol', 'Golf', 'Jetta', 'Nivus', 'Polo', 'Saveiro', 'T-Cross', 'Tera', 'Taos', 'Tiguan', 'Virtus'],
  Volvo: ['C40', 'EX30', 'S60', 'XC40', 'XC60', 'XC90'],
};

export const MARCAS_VEICULO = Object.keys(MODELOS_POR_MARCA).sort((a, b) => a.localeCompare(b, 'pt-BR'));

export function normalizarBusca(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
}

export function modelosDaMarca(marca: string): string[] {
  const busca = normalizarBusca(marca);
  const marcaEncontrada = MARCAS_VEICULO.find((item) => normalizarBusca(item) === busca);
  return marcaEncontrada ? MODELOS_POR_MARCA[marcaEncontrada] : [];
}

export function anosVeiculo(): string[] {
  const anoAtual = new Date().getFullYear();
  return Array.from({ length: anoAtual + 1 - 1970 + 1 }, (_, index) => String(anoAtual + 1 - index));
}

