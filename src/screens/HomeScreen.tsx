// src/screens/HomeScreen.tsx

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { BillHistoryEntry } from '../types/bill.types';
import { StorageService } from '../services/storage.service';
import { useBill } from '../context/BillContext';
import {
  HomeStackParamList,
  MainTabParamList,
  RootStackParamList,
} from '../types/navigation.types';
import { colors } from '../theme/colors';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'Home'>,
  BottomTabScreenProps<MainTabParamList, 'HomeTab'>
>;

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
    const rootNav = navigation
      .getParent() // Tab navigator
      ?.getParent<NativeStackNavigationProp<RootStackParamList>>(); // Root stack navigator
    rootNav?.navigate('SavedBillDetail', { entry });
  };

  const handleEdit = (entry: BillHistoryEntry) => {
    if (entry.type === 'simple') {
      navigation.navigate('SimpleTab', { screen: 'SimpleSplit', params: { entry } });
      return;
    }

    loadBillFromHistory(entry);
    navigation.navigate('DetailedTab', { screen: 'DetailedSplit' });
  };

  const handleAddSimple = () => {
    setCurrentEntryMeta(null);
    navigation.navigate('SimpleTab', { screen: 'SimpleSplit' });
  };

  const handleAddDetailed = () => {
    clearBill();
    navigation.navigate('DetailedTab', { screen: 'DetailedSplit' });
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
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
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
    color: colors.textSecondary,
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
    fontWeight: '700',
    color: colors.textPrimary,
  },
  entryDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  entrySummary: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: 10,
  },
  entryNote: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeDetailed: {
    backgroundColor: 'rgba(123, 108, 255, 0.18)',
  },
  badgeSimple: {
    backgroundColor: 'rgba(45, 225, 194, 0.18)',
  },
  badgeText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  entryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
  },
  link: {
    color: colors.primary,
    fontWeight: '700',
  },
  deleteLink: {
    color: colors.danger,
  },
});
