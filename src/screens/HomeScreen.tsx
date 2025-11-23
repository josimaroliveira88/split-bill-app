// src/screens/HomeScreen.tsx

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { BillHistoryEntry } from '../types/bill.types';
import { StorageService } from '../services/storage.service';
import { useBill } from '../context/BillContext';
import { MainTabParamList } from '../types/navigation.types';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [history, setHistory] = useState<BillHistoryEntry[]>([]);
  const { loadBillFromHistory, setCurrentEntryMeta, clearBill } = useBill();

  const loadHistory = useCallback(async () => {
    const entries = await StorageService.loadBillHistory();
    setHistory(entries);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const handleDelete = (entryId: string) => {
    Alert.alert('Confirmar', 'Deseja realmente excluir esta conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await StorageService.deleteHistoryEntry(entryId);
          loadHistory();
        },
      },
    ]);
  };

  const handleConsult = (entry: BillHistoryEntry) => {
    const rootNav = navigation.getParent ? navigation.getParent() : navigation;
    rootNav?.navigate('SavedBillDetail', { entry });
  };

  const handleEdit = (entry: BillHistoryEntry) => {
    if (entry.type === 'simple') {
      navigation.navigate('SimpleSplit', { entry });
      return;
    }

    loadBillFromHistory(entry);
    navigation.navigate('DetailedStackNav', { screen: 'DetailedSplit' });
  };

  const handleAddSimple = () => {
    setCurrentEntryMeta(null);
    navigation.navigate('SimpleSplit');
  };

  const handleAddDetailed = () => {
    clearBill();
    navigation.navigate('DetailedStackNav', { screen: 'DetailedSplit' });
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const resolveTitle = (entry: BillHistoryEntry) => {
    if (entry.title && entry.title.trim()) return entry.title;
    if (entry.name && entry.name.trim()) return entry.name;
    return formatDate(entry.createdAt);
  };

  const renderSummary = (entry: BillHistoryEntry) => {
    if (entry.type === 'simple') {
      const perPerson = typeof entry.result === 'number' ? entry.result : 0;
      return `R$ ${perPerson.toFixed(2)} por pessoa`;
    }

    const total = Array.isArray(entry.result)
      ? entry.result.reduce((sum, r) => sum + r.totalToPay, 0)
      : 0;
    return `Total: R$ ${total.toFixed(2)}`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Minhas Contas</Text>
        <Text style={styles.subtitle}>
          Consulte, edite ou crie novas contas simples ou detalhadas.
        </Text>

        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Criar nova</Text>
          <View style={styles.actionsRow}>
            <Button title="Conta Simples" onPress={handleAddSimple} style={styles.actionButton} />
            <Button
              title="Conta Detalhada"
              onPress={handleAddDetailed}
              variant="secondary"
              style={styles.actionButton}
            />
          </View>
        </Card>

        {history.length === 0 && (
          <Card>
            <Text style={styles.emptyText}>Nenhuma conta salva ainda.</Text>
          </Card>
        )}

        {history.map(entry => (
          <Card key={entry.id} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <View>
                <Text style={styles.entryTitle}>{resolveTitle(entry)}</Text>
                <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
              </View>
              <View
                style={[styles.badge, entry.type === 'detailed' ? styles.badgeDetailed : styles.badgeSimple]}
              >
                <Text style={styles.badgeText}>
                  {entry.type === 'detailed' ? 'Detalhada' : 'Simples'}
                </Text>
              </View>
            </View>

            <Text style={styles.entrySummary}>{renderSummary(entry)}</Text>
            {entry.note ? (
              <Text style={styles.entryNote}>Obs: {entry.note}</Text>
            ) : null}

            <View style={styles.entryActions}>
              <TouchableOpacity onPress={() => handleConsult(entry)}>
                <Text style={styles.link}>Consultar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEdit(entry)}>
                <Text style={styles.link}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(entry.id)}>
                <Text style={[styles.link, styles.deleteLink]}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#5C5C60',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  actionsCard: {
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#5C5C60',
  },
  entryCard: {
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  entryDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  entrySummary: {
    fontSize: 14,
    color: '#5C5C60',
    marginBottom: 10,
  },
  entryNote: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeDetailed: {
    backgroundColor: '#E5F0FF',
  },
  badgeSimple: {
    backgroundColor: '#F5F5F5',
  },
  badgeText: {
    fontSize: 12,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  entryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
  },
  link: {
    color: '#007AFF',
    fontWeight: '600',
  },
  deleteLink: {
    color: '#FF3B30',
  },
});
