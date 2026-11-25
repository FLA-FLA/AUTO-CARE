
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
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

  // Verifica se o usuário já está conectado sem apagar a sessão.
  useEffect(() => {
    async function iniciarAplicativo() {
      try {
        const logado = await AsyncStorage.getItem(
          '@autocare_logado'
        );

        if (logado === 'true') {
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
        <Stack
          initialRouteName="login"
          screenOptions={{
            headerShown: false,
            animation: 'none',
            contentStyle: {
              backgroundColor: '#07111F',
            },
          }}
        >
          <Stack.Screen name="login" />
          <Stack.Screen name="cadastro" />
          <Stack.Screen name="index" />
          <Stack.Screen name="veiculo" />
          <Stack.Screen name="manutencoes" />
          <Stack.Screen name="revisoes" />
          <Stack.Screen name="documentos" />
          <Stack.Screen name="combustivel" />
          <Stack.Screen name="adicionar-manutencao" />
          <Stack.Screen name="adicionar-revisao" />
          <Stack.Screen name="adicionar-documento" />
          <Stack.Screen name="adicionar-combustivel" />
        </Stack>
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
