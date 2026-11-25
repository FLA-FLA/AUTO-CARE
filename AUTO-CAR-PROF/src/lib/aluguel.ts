import AsyncStorage from '@react-native-async-storage/async-storage';

export type TipoUsuario = 'proprietario' | 'locatario';
export type Usuario = { id: string; nome: string; email: string; tipo: TipoUsuario };
export type Carro = { id: string; veiculoId?: string; proprietarioId: string; proprietarioNome: string; proprietarioEmail?: string; marca: string; modelo: string; ano: string; placa: string; cidade: string; diaria: number; descricao: string; fotos?: string[]; disponivel: boolean; criadoEm: string };
export type Aluguel = { id: string; carroId: string; locatarioId: string; locatarioNome: string; proprietarioId: string; inicio: string; fim: string; total: number; status: 'pendente' | 'aprovado' | 'recusado' | 'finalizado'; criadoEm: string };
export type RegistroCarro = {
  id: string;
  categoria: 'manutencao' | 'revisao';
  descricao: string;
  data: string;
  quilometragem?: string;
  valor?: number;
  observacao?: string;
  autorId: string;
  autorNome: string;
  criadoEm: string;
};

const KEYS = { usuarios: '@autocare_usuarios', sessao: '@autocare_sessao', carros: '@autocare_carros', alugueis: '@autocare_alugueis' };
export async function ler<T>(key: string, fallback: T): Promise<T> { const value = await AsyncStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; }
export async function gravar<T>(key: string, value: T) { await AsyncStorage.setItem(key, JSON.stringify(value)); }
export async function buscarSessao(): Promise<Usuario | null> {
  const sessao = await ler<Usuario | null>(KEYS.sessao, null);
  if (sessao) return sessao;

  // Reutiliza a conta conectada no Auto Care para manter o perfil de aluguel
  // associado ao mesmo usuário que escolheu locador ou locatário no cadastro.
  const conectado = await AsyncStorage.getItem('@autocare_usuario');
  if (!conectado) return null;

  try {
    const conta = JSON.parse(conectado) as {
      id?: string;
      nome?: string;
      email?: string;
      tipo?: TipoUsuario;
    };
    if (!conta.email) return null;
    return {
      id: conta.id || conta.email.trim().toLowerCase(),
      nome: conta.nome || conta.email,
      email: conta.email.trim().toLowerCase(),
      tipo: conta.tipo === 'proprietario' ? 'proprietario' : 'locatario',
    };
  } catch {
    return null;
  }
}
export const buscarCarros = () => ler<Carro[]>(KEYS.carros, []);
export const buscarAlugueis = () => ler<Aluguel[]>(KEYS.alugueis, []);
export const salvarCarros = (carros: Carro[]) => gravar(KEYS.carros, carros);
export const salvarAlugueis = (alugueis: Aluguel[]) => gravar(KEYS.alugueis, alugueis);
const chaveHistoricoCarro = (carroId: string) => `@autocare_historico_carro_${carroId}`;
export const buscarHistoricoCarro = (carroId: string) =>
  ler<RegistroCarro[]>(chaveHistoricoCarro(carroId), []);
export const salvarHistoricoCarro = (carroId: string, registros: RegistroCarro[]) =>
  gravar(chaveHistoricoCarro(carroId), registros);
export const salvarSessao = (user: Usuario | null) => gravar(KEYS.sessao, user);
export async function apagarConta(usuario: Usuario): Promise<void> {
  const email = usuario.email.trim().toLowerCase();
  const id = usuario.id || email;

  const usuarios = await ler<Array<{ email?: string }>>(KEYS.usuarios, []);
  await gravar(KEYS.usuarios, usuarios.filter((item) => item.email?.trim().toLowerCase() !== email));

  const carros = await buscarCarros();
  const carrosDoUsuario = carros.filter((carro) => carro.proprietarioId === id || carro.proprietarioId === email);
  await salvarCarros(carros.filter((carro) => !carrosDoUsuario.includes(carro)));

  const alugueis = await buscarAlugueis();
  await salvarAlugueis(alugueis.filter((aluguel) => aluguel.locatarioId !== id && aluguel.proprietarioId !== id && aluguel.locatarioId !== email && aluguel.proprietarioId !== email));

  const todasAsChaves = await AsyncStorage.getAllKeys();
  const prefixoUsuario = `@autocare_${encodeURIComponent(email)}_`;
  const chavesDoUsuario = todasAsChaves.filter((key) => key.startsWith(prefixoUsuario));
  const chavesHistorico = carrosDoUsuario.map((carro) => chaveHistoricoCarro(carro.id));
  const chavesParaRemover = [
    ...chavesDoUsuario,
    ...chavesHistorico,
    '@autocare_usuario',
    '@autocare_sessao',
    '@autocare_logado',
  ];

  const donoDadosAntigos = await AsyncStorage.getItem('@autocare_dono_dados_antigos');
  if (donoDadosAntigos?.trim().toLowerCase() === email) {
    chavesParaRemover.push(
      '@autocare_dono_dados_antigos',
      '@autocare_veiculos',
      '@autocare_veiculo',
      '@autocare_manutencoes',
      '@autocare_revisoes',
      '@autocare_documentos',
      '@autocare_combustivel',
    );
  }

  await AsyncStorage.multiRemove([...new Set(chavesParaRemover)]);
}

export async function cadastrarUsuario(nome: string, email: string, tipo: TipoUsuario): Promise<Usuario> {
  const usuarios = await ler<Usuario[]>(KEYS.usuarios, []);
  if (usuarios.some((user) => user.email.toLowerCase() === email.toLowerCase())) throw new Error('Este e-mail já está cadastrado neste aparelho.');
  const user = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, nome: nome.trim(), email: email.trim().toLowerCase(), tipo };
  await gravar(KEYS.usuarios, [...usuarios, user]); await salvarSessao(user); return user;
}

export const STORAGE_KEYS = KEYS;
