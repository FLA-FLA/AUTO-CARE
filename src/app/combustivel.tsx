import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Abastecimento = {
  id: string;
  data: string;
  litros: string;
  valor: string;
  km: string;
};

const CHAVE_COMBUSTIVEL = '@autocare_combustivel';

export default function CombustivelScreen() {
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);

  const carregarAbastecimentos = useCallback(async () => {
    try {
      const dados = await AsyncStorage.getItem(CHAVE_COMBUSTIVEL);

      if (dados) {
        setAbastecimentos(JSON.parse(dados));
      } else {
        setAbastecimentos([]);
      }
    } catch (error) {
      console.log('ERRO AO CARREGAR ABASTECIMENTOS:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarAbastecimentos();
    }, [carregarAbastecimentos])
  );

  async function excluirAbastecimento(id: string) {
    Alert.alert(
      'Excluir abastecimento',
      'Deseja realmente excluir este abastecimento?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const novaLista = abastecimentos.filter(
              (item) => item.id !== id
            );

            await AsyncStorage.setItem(
              CHAVE_COMBUSTIVEL,
              JSON.stringify(novaLista)
            );

            setAbastecimentos(novaLista);
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.voltar}>‹ Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          Combustível
        </Text>

        <Text style={styles.subtitle}>
          Controle seus abastecimentos
        </Text>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          router.push('/adicionar-combustivel')
        }
      >
        <Text style={styles.addButtonText}>
          + Adicionar abastecimento
        </Text>
      </TouchableOpacity>

      {abastecimentos.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>
            ⛽
          </Text>

          <Text style={styles.emptyTitle}>
            Nenhum abastecimento cadastrado
          </Text>

          <Text style={styles.emptyText}>
            Registre seus abastecimentos para acompanhar
            os gastos com combustível.
          </Text>
        </View>
      ) : (
        abastecimentos.map((item) => (
          <View
            key={item.id}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.abastecimentoTitle}>
                ⛽ Abastecimento
              </Text>

              <TouchableOpacity
                onPress={() =>
                  excluirAbastecimento(item.id)
                }
              >
                <Text style={styles.delete}>
                  Excluir
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.info}>
              📅 Data: {item.data}
            </Text>

            <Text style={styles.info}>
              ⛽ Litros: {item.litros} L
            </Text>

            <Text style={styles.info}>
              💰 Valor: R$ {item.valor}
            </Text>

            <Text style={styles.info}>
              🚗 Quilometragem: {item.km} km
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },

  content: {
    paddingBottom: 40,
  },

  header: {
    backgroundColor: '#208AEF',
    paddingTop: 55,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  voltar: {
    color: '#FFFFFF',
    fontSize: 17,
    marginBottom: 20,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#EAF4FF',
    fontSize: 15,
    marginTop: 6,
  },

  addButton: {
    backgroundColor: '#208AEF',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 25,
    borderRadius: 18,
    alignItems: 'center',
    elevation: 2,
  },

  emptyIcon: {
    fontSize: 45,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },

  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 15,
    padding: 18,
    borderRadius: 16,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  abastecimentoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
    flex: 1,
  },

  delete: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: 'bold',
  },

  info: {
    color: '#666666',
    fontSize: 14,
    marginTop: 7,
  },
});