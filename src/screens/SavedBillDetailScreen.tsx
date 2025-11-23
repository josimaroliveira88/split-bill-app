// src/screens/SavedBillDetailScreen.tsx

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BillHistoryEntry, BillResult, DetailedBill, SimpleBill } from '../types/bill.types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StorageService } from '../services/storage.service';
import { CalculationService } from '../services/calculation.service';
import { useBill } from '../context/BillContext';
import { RootStackParamList } from '../types/navigation.types';
import { colors } from '../theme/colors';

type SavedBillDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'SavedBillDetail'>;

export const SavedBillDetailScreen: React.FC<SavedBillDetailScreenProps> = ({ navigation, route }) => {
  const { entry } = route.params;
  const { loadBillFromHistory } = useBill();

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const resolveTitle = () => {
    if (entry.title && entry.title.trim()) return entry.title;
    if (entry.name && entry.name.trim()) return entry.name;
    return formatDate(entry.createdAt);
  };

  const detailedResults: BillResult[] | null = useMemo(() => {
    if (entry.type === 'detailed') {
      if (Array.isArray(entry.result)) return entry.result as BillResult[];
      return CalculationService.calculateDetailedSplit(entry.bill as DetailedBill);
    }
    return null;
  }, [entry]);

  const handleDelete = async () => {
    Alert.alert('Confirmar', 'Deseja excluir esta conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await StorageService.deleteHistoryEntry(entry.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleEdit = () => {
    if (entry.type === 'simple') {
      navigation.navigate('MainTabs', {
        screen: 'SimpleTab',
        params: { screen: 'SimpleSplit', params: { entry } },
      });
      return;
    }

    loadBillFromHistory(entry);
    navigation.navigate('MainTabs', { screen: 'DetailedTab', params: { screen: 'DetailedSplit' } });
  };

  const formatCurrency = (value: number) => value.toFixed(2).replace('.', ',');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{resolveTitle()}</Text>
        <Text style={styles.subtitle}>{formatDate(entry.createdAt)}</Text>

        <Card>
          <Text style={styles.sectionTitle}>Tipo</Text>
          <Text style={styles.text}>{entry.type === 'detailed' ? 'Divisão Detalhada' : 'Divisão Simples'}</Text>
        </Card>

        {entry.note ? (
          <Card>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Text style={styles.text}>{entry.note}</Text>
          </Card>
        ) : null}

        {entry.type === 'simple' && (
          <Card>
            <Text style={styles.sectionTitle}>Resumo</Text>
            <Text style={styles.text}>Valor total: R$ {formatCurrency((entry.bill as SimpleBill).totalAmount)}</Text>
            <Text style={styles.text}>Pessoas: {(entry.bill as SimpleBill).numberOfPeople}</Text>
            <Text style={styles.text}>Taxa de serviço: {(entry.bill as SimpleBill).serviceFeePercentage}%</Text>
            <Text style={styles.totalText}>
              Valor por pessoa: R$ {formatCurrency(typeof entry.result === 'number' ? entry.result : 0)}
            </Text>
          </Card>
        )}

        {entry.type === 'detailed' && detailedResults && (
          <Card>
            <Text style={styles.sectionTitle}>Resumo</Text>
            <Text style={styles.text}>Total da conta: R$ {formatCurrency(detailedResults.reduce((sum, r) => sum + r.totalToPay, 0))}</Text>
            {detailedResults.map(result => (
              <View key={result.personId} style={styles.personRow}>
                <View>
                  <Text style={styles.personName}>{result.personName}</Text>
                  <Text style={styles.text}>Consumo: R$ {formatCurrency(result.itemsTotal)}</Text>
                  <Text style={styles.text}>Taxa: R$ {formatCurrency(result.serviceFee)}</Text>
                </View>
                <Text style={styles.personTotal}>R$ {formatCurrency(result.totalToPay)}</Text>
              </View>
            ))}
          </Card>
        )}

        <View style={styles.buttons}>
          <Button title="Editar" onPress={handleEdit} style={styles.button} />
          <Button title="Excluir" onPress={handleDelete} variant="secondary" style={styles.button} />
          <Button title="Voltar" onPress={() => navigation.goBack()} variant="secondary" />
        </View>
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
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 8,
  },
  personRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginTop: 10,
    backgroundColor: '#1E1C32',
    borderRadius: 14,
  },
  personName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  personTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  buttons: {
    marginTop: 16,
    gap: 10,
  },
  button: {
    marginBottom: 8,
  },
});
