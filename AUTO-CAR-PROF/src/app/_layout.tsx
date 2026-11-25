
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

export default function Layout() {
  const router = useRouter();
  const segments = useSegments();

  const [carregando, setCarregando] = useState(true);
  const [inicializado, setInicializado] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState<'proprietario' | 'locatario'>('locatario');

  // Verifica se o usuário já está conectado sem apagar a sessão.
  useEffect(() => {
    async function iniciarAplicativo() {
      try {
        const logado = await AsyncStorage.getItem(
          '@autocare_logado'
        );

        if (logado === 'true') {
          const usuarioSalvo = await AsyncStorage.getItem('@autocare_usuario');
          if (usuarioSalvo) {
            const usuario = JSON.parse(usuarioSalvo);
            setTipoUsuario(usuario.tipo === 'proprietario' ? 'proprietario' : 'locatario');
          }
          router.replace('/');
        } else {
          router.replace('/login');
        }
      } catch (error) {
        console.error('Erro ao verificar login:', error);
        router.replace('/login');
      } finally {
        setCarregando(false);
        setInicializado(true);
      }
    }

    iniciarAplicativo();
  }, []);

  // Protege as telas internas do aplicativo.
  useEffect(() => {
    if (!inicializado) return;

    async function verificarAcesso() {
      try {
        const logado = await AsyncStorage.getItem(
          '@autocare_logado'
        );

        const rota = segments[0];

        const dentroDoLogin =
          rota === 'login' || rota === 'cadastro';

        if (logado === 'true') {
          const usuarioSalvo = await AsyncStorage.getItem('@autocare_usuario');
          if (usuarioSalvo) {
            const usuario = JSON.parse(usuarioSalvo);
            setTipoUsuario(usuario.tipo === 'proprietario' ? 'proprietario' : 'locatario');
          }
          if (dentroDoLogin) {
            router.replace('/');
          }
        } else {
          if (!dentroDoLogin) {
            router.replace('/login');
          }
        }
      } catch (error) {
        router.replace('/login');
      }
    }

    verificarAcesso();
  }, [segments, inicializado]);

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#168BFF" />
      </View>
    );
  }

  return (
    <View style={styles.webBackground}>
      <View style={styles.appFrame}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#55ADFF',
            tabBarInactiveTintColor: '#8295AA',
            tabBarStyle: { backgroundColor: '#0B1B30', borderTopColor: '#1D3C5B', paddingTop: 5 },
            tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
          }}
        >
          <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home-variant" color={color} size={size} /> }} />
          <Tabs.Screen name="aluguel" options={tipoUsuario === 'locatario' ? { title: 'Buscar carros', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="car-search" color={color} size={size} /> } : { href: null }} />
          <Tabs.Screen name="meus-alugueis" options={tipoUsuario === 'locatario' ? { title: 'Meus aluguéis', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="clipboard-list-outline" color={color} size={size} /> } : { href: null }} />
          <Tabs.Screen name="meus-carros" options={tipoUsuario === 'proprietario' ? { title: 'Meus carros', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="car-multiple" color={color} size={size} /> } : { href: null }} />
          <Tabs.Screen name="solicitacoes" options={tipoUsuario === 'proprietario' ? { title: 'Solicitações', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="calendar-clock" color={color} size={size} /> } : { href: null }} />
          <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-circle-outline" color={color} size={size} /> }} />

          <Tabs.Screen name="login" options={{ href: null, tabBarStyle: { display: 'none' } }} />
          <Tabs.Screen name="cadastro" options={{ href: null, tabBarStyle: { display: 'none' } }} />
          <Tabs.Screen name="esqueci-senha" options={{ href: null, tabBarStyle: { display: 'none' } }} />
          <Tabs.Screen name="veiculo" options={{ href: null }} />
          <Tabs.Screen name="manutencoes" options={{ href: null }} />
          <Tabs.Screen name="revisoes" options={{ href: null }} />
          <Tabs.Screen name="documentos" options={{ href: null }} />
          <Tabs.Screen name="combustivel" options={{ href: null }} />
          <Tabs.Screen name="nova-manutencao" options={{ href: null }} />
          <Tabs.Screen name="adicionar-manutencao" options={{ href: null }} />
          <Tabs.Screen name="adicionar-revisao" options={{ href: null }} />
          <Tabs.Screen name="adicionar-documento" options={{ href: null }} />
          <Tabs.Screen name="adicionar-combustivel" options={{ href: null }} />
          <Tabs.Screen name="adicionar-veiculo" options={{ href: null }} />
          <Tabs.Screen name="detalhes-veiculo" options={{ href: null }} />
          <Tabs.Screen name="historico-carro" options={{ href: null }} />
          <Tabs.Screen name="aluguel-conta" options={{ href: null }} />
          <Tabs.Screen name="anunciar-carro" options={{ href: null }} />
          <Tabs.Screen name="explore" options={{ href: null }} />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#07111F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  webBackground: {
    flex: 1,
    backgroundColor:
      Platform.OS === 'web' ? '#DCE5EF' : '#07111F',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({
          minHeight: '100vh',
          width: '100%',
        } as any)
      : {}),
  },

  appFrame: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 430 : undefined,
    backgroundColor: '#07111F',
    ...(Platform.OS === 'web'
      ? ({
          minHeight: '100vh',
          boxShadow: '0 0 35px rgba(24, 32, 42, 0.12)',
        } as any)
      : {}),
  },
});
