// src/screens/ResultScreen.tsx

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useBill } from '../context/BillContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { BillHistoryEntry, BillResult } from '../types/bill.types';
import { StorageService } from '../services/storage.service';
import { colors } from '../theme/colors';

export const ResultScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { bill, calculateResults, clearBill, currentEntryMeta, setCurrentEntryMeta } = useBill();
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const results = calculateResults();
  const saveKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (results.length === 0) return;

    const payloadKey = JSON.stringify({ bill, results });
    if (saveKeyRef.current === payloadKey) return;
    saveKeyRef.current = payloadKey;

    const createdAt = currentEntryMeta?.createdAt || new Date().toISOString();
    const resolvedTitle =
      (bill.title && bill.title.trim()) || new Date(createdAt).toLocaleString();
    const resolvedNote = bill.note && bill.note.trim() ? bill.note.trim() : undefined;

    const entry: BillHistoryEntry = {
      id: currentEntryMeta?.id || Date.now().toString(),
      name: resolvedTitle,
      title: bill.title?.trim() || undefined,
      note: resolvedNote,
      createdAt,
      type: 'detailed',
      bill,
      result: results,
    };

    const persist = currentEntryMeta?.id
      ? StorageService.updateHistoryEntry(entry)
      : StorageService.saveHistoryEntry(entry);

    persist.then(() => {
      setCurrentEntryMeta({ id: entry.id, name: entry.name, createdAt: entry.createdAt });
    });
  }, [bill, results, currentEntryMeta, setCurrentEntryMeta]);

  const totalBill = results.reduce((sum, r) => sum + r.totalToPay, 0);

  const handleNewBill = () => {
    clearBill();
    navigation.navigate('DetailedSplit');
  };

  const toggleDetails = (personId: string) => {
    setExpandedPerson(expandedPerson === personId ? null : personId);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Resultado da Divisão</Text>
        {bill.title ? <Text style={styles.subtitle}>{bill.title}</Text> : null}
        {bill.note ? <Text style={styles.note}>{bill.note}</Text> : null}

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Geral</Text>
          <Text style={styles.summaryValue}>
            R$ {totalBill.toFixed(2).replace('.', ',')}
          </Text>
        </Card>

        {results.map(result => (
          <Card key={result.personId}>
            <TouchableOpacity onPress={() => toggleDetails(result.personId)}>
              <View style={styles.personHeader}>
                <View>
                  <Text style={styles.personName}>{result.personName}</Text>
                  <Text style={styles.personAmount}>
                    R$ {result.totalToPay.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
                <Text style={styles.expandIcon}>
                  {expandedPerson === result.personId ? '▼' : '▶'}
                </Text>
              </View>
            </TouchableOpacity>

            {expandedPerson === result.personId && (
              <View style={styles.details}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Itens consumidos:</Text>
                  <Text style={styles.detailValue}>
                    R$ {result.itemsTotal.toFixed(2).replace('.', ',')}
                  </Text>
                </View>

                {result.itemsDetail.map((item, index) => (
                  <View key={index} style={styles.itemDetail}>
                    <Text style={styles.itemName}>
                      • {item.itemName} ({item.quantity}x)
                    </Text>
                    <Text style={styles.itemPrice}>
                      R$ {item.subtotal.toFixed(2).replace('.', ',')}
                    </Text>
                  </View>
                ))}

                <View style={[styles.detailRow, styles.serviceFeeRow]}>
                  <Text style={styles.detailLabel}>Taxa de serviço:</Text>
                  <Text style={styles.detailValue}>
                    R$ {result.serviceFee.toFixed(2).replace('.', ',')}
                  </Text>
                </View>

                <View style={[styles.detailRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total a pagar:</Text>
                  <Text style={styles.totalValue}>
                    R$ {result.totalToPay.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
              </View>
            )}
          </Card>
        ))}

        <View style={styles.actions}>
          <Button
            title="Nova Conta"
            onPress={handleNewBill}
            style={styles.actionButton}
          />
          <Button
            title="Voltar"
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={styles.actionButton}
          />
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
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: -8,
    marginBottom: 8,
  },
  note: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: -4,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  personName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  personAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  expandIcon: {
    fontSize: 16,
    color: colors.textMuted,
  },
  details: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 0,
    backgroundColor: '#1E1C32',
    borderRadius: 16,
    paddingHorizontal: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 16,
    marginBottom: 4,
  },
  itemName: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  itemPrice: {
    fontSize: 13,
    color: colors.textMuted,
  },
  serviceFeeRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actions: {
    marginTop: 24,
  },
  actionButton: {
    marginBottom: 12,
  },
});
