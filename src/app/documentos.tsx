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

type Documento = {
  id: string;
  tipo: string;
  numero: string;
  validade: string;
  observacao: string;
};

const CHAVE_DOCUMENTOS = '@autocare_documentos';

export default function DocumentosScreen() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);

  const carregarDocumentos = useCallback(async () => {
    try {
      const dados = await AsyncStorage.getItem(CHAVE_DOCUMENTOS);

      if (dados) {
        setDocumentos(JSON.parse(dados));
      } else {
        setDocumentos([]);
      }
    } catch (error) {
      console.log('ERRO AO CARREGAR DOCUMENTOS:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarDocumentos();
    }, [carregarDocumentos])
  );

  async function excluirDocumento(id: string) {
    Alert.alert(
      'Excluir documento',
      'Deseja realmente excluir este documento?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const novaLista = documentos.filter(
              (item) => item.id !== id
            );

            await AsyncStorage.setItem(
              CHAVE_DOCUMENTOS,
              JSON.stringify(novaLista)
            );

            setDocumentos(novaLista);
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
          Documentos
        </Text>

        <Text style={styles.subtitle}>
          Organize os documentos do seu veículo
        </Text>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          router.push('/adicionar-documento')
        }
      >
        <Text style={styles.addButtonText}>
          + Adicionar documento
        </Text>
      </TouchableOpacity>

      {documentos.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>
            📄
          </Text>

          <Text style={styles.emptyTitle}>
            Nenhum documento cadastrado
          </Text>

          <Text style={styles.emptyText}>
            Cadastre os documentos do seu veículo para
            manter todas as informações organizadas.
          </Text>
        </View>
      ) : (
        documentos.map((item) => (
          <View
            key={item.id}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.documentTitle}>
                📄 {item.tipo}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  excluirDocumento(item.id)
                }
              >
                <Text style={styles.delete}>
                  Excluir
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.info}>
              🔢 Número: {item.numero}
            </Text>

            <Text style={styles.info}>
              📅 Validade: {item.validade}
            </Text>

            {item.observacao ? (
              <Text style={styles.info}>
                📝 {item.observacao}
              </Text>
            ) : null}
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

  documentTitle: {
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