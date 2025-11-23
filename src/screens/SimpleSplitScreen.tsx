// src/screens/SimpleSplitScreen.tsx

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import { CalculationService } from '../services/calculation.service';
import { BillHistoryEntry, SimpleBill } from '../types/bill.types';
import { StorageService } from '../services/storage.service';
import { MainTabParamList } from '../types/navigation.types';
import { colors } from '../theme/colors';

type Props = BottomTabScreenProps<MainTabParamList, 'SimpleSplit'>;

export const SimpleSplitScreen: React.FC<Props> = ({ route }) => {
  const existingEntry: BillHistoryEntry | undefined = route?.params?.entry;
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState('');
  const [serviceFee, setServiceFee] = useState('10');
  const [result, setResult] = useState<number | null>(null);
  const initialTitleRef = useRef('');
  const initialNoteRef = useRef('');

  useEffect(() => {
    if (existingEntry && existingEntry.type === 'simple') {
      const bill = existingEntry.bill as SimpleBill;
      setTotalAmount(bill.totalAmount.toString());
      setNumberOfPeople(bill.numberOfPeople.toString());
      setServiceFee(bill.serviceFeePercentage.toString());
      if (typeof existingEntry.result === 'number') {
        setResult(existingEntry.result);
      }
      setTitle(bill.title || existingEntry.title || existingEntry.name || '');
      setNote(bill.note || existingEntry.note || '');
      initialTitleRef.current = bill.title || existingEntry.title || existingEntry.name || '';
      initialNoteRef.current = bill.note || existingEntry.note || '';
      return;
    }

    // Nova conta simples: limpar tudo ao chegar
    handleClear();
    initialTitleRef.current = '';
    initialNoteRef.current = '';
  }, [existingEntry]);

  useEffect(() => {
    if (!existingEntry || existingEntry.type !== 'simple') return;

    return () => {
      const trimmedTitle = title.trim();
      const trimmedNote = note.trim();
      const titleChanged = trimmedTitle !== initialTitleRef.current;
      const noteChanged = trimmedNote !== initialNoteRef.current;

      if (!titleChanged && !noteChanged) return;

      const resolvedTitle =
        trimmedTitle || new Date(existingEntry.createdAt).toLocaleString();

      const updatedEntry: BillHistoryEntry = {
        ...existingEntry,
        name: resolvedTitle,
        title: trimmedTitle || undefined,
        note: trimmedNote || undefined,
      };

      StorageService.updateHistoryEntry(updatedEntry);
    };
  }, [existingEntry, title, note]);

  const handleCalculate = () => {
    const total = parseFloat(totalAmount);
    const people = parseInt(numberOfPeople);
    const fee = parseFloat(serviceFee);

    if (isNaN(total) || total <= 0) {
      Alert.alert('Erro', 'Digite um valor total válido');
      return;
    }

    if (isNaN(people) || people <= 0) {
      Alert.alert('Erro', 'Digite um número de pessoas válido');
      return;
    }

    if (isNaN(fee) || fee < 0) {
      Alert.alert('Erro', 'Digite uma taxa de serviço válida');
      return;
    }

    const perPerson = CalculationService.calculateSimpleSplit({
      totalAmount: total,
      numberOfPeople: people,
      serviceFeePercentage: fee,
    });

    setResult(perPerson);

    const billToSave: SimpleBill = {
      totalAmount: total,
      numberOfPeople: people,
      serviceFeePercentage: fee,
      title: title.trim() || undefined,
      note: note.trim() || undefined,
    };

    if (existingEntry && existingEntry.type === 'simple') {
      const resolvedTitle = title.trim()
        ? title.trim()
        : new Date(existingEntry.createdAt).toLocaleString();
      const updatedEntry: BillHistoryEntry = {
        ...existingEntry,
        name: resolvedTitle,
        title: title.trim() || undefined,
        note: note.trim() || undefined,
        bill: billToSave,
        result: perPerson,
      };
      StorageService.updateHistoryEntry(updatedEntry);
    } else {
      StorageService.saveSimpleBill(billToSave, perPerson, {
        title: title.trim(),
        note: note.trim(),
      });
    }
  };

  const handleClear = () => {
    setTitle('');
    setNote('');
    setTotalAmount('');
    setNumberOfPeople('');
    setServiceFee('10');
    setResult(null);
  };

  useEffect(() => {
    if (existingEntry || !route?.params?.resetKey) return;
    handleClear();
    initialTitleRef.current = '';
    initialNoteRef.current = '';
  }, [existingEntry, route?.params?.resetKey]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Divisão Simples</Text>
        <Text style={styles.subtitle}>
          Divida a conta igualmente entre todos
        </Text>

        <Card>
          <Input
            label="Título da conta (opcional)"
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Restaurante Central"
          />
          <Input
            label="Observações"
            value={note}
            onChangeText={setNote}
            placeholder="Comentários sobre o atendimento, etc."
            multiline
            numberOfLines={3}
            style={styles.noteInput}
          />
        </Card>

        <Card>
          <Input
            label="Valor Total (R$)"
            value={totalAmount}
            onChangeText={setTotalAmount}
            keyboardType="decimal-pad"
            placeholder="0,00"
          />

          <Input
            label="Número de Pessoas"
            value={numberOfPeople}
            onChangeText={setNumberOfPeople}
            keyboardType="number-pad"
            placeholder="0"
          />

          <Input
            label="Taxa de Serviço (%)"
            value={serviceFee}
            onChangeText={setServiceFee}
            keyboardType="decimal-pad"
            placeholder="10"
          />
        </Card>

        {result !== null && (
          <Card style={styles.resultCard}>
            <Text style={styles.resultLabel}>Valor por pessoa:</Text>
            <Text style={styles.resultValue}>
              R$ {result.toFixed(2).replace('.', ',')}
            </Text>
            <View style={styles.resultDetails}>
              <Text style={styles.resultDetailText}>
                Total da conta: R$ {parseFloat(totalAmount).toFixed(2).replace('.', ',')}
              </Text>
              <Text style={styles.resultDetailText}>
                Taxa de serviço: R${' '}
                {(parseFloat(totalAmount) * (parseFloat(serviceFee) / 100))
                  .toFixed(2)
                  .replace('.', ',')}
              </Text>
              <Text style={styles.resultDetailText}>
                Total com taxa: R${' '}
                {(
                  parseFloat(totalAmount) +
                  parseFloat(totalAmount) * (parseFloat(serviceFee) / 100)
                )
                  .toFixed(2)
                  .replace('.', ',')}
              </Text>
            </View>
          </Card>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title="Calcular"
            onPress={handleCalculate}
            style={styles.calculateButton}
          />
          {result !== null && (
            <Button
              title="Limpar"
              onPress={handleClear}
              variant="secondary"
              style={styles.clearButton}
            />
          )}
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  resultCard: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  resultLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 52,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  resultDetails: {
    width: '100%',
    borderTopWidth: 0,
    paddingTop: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    paddingHorizontal: 14,
  },
  resultDetailText: {
    fontSize: 14,
    color: '#F5F7FF',
    marginBottom: 6,
  },
  buttonContainer: {
    marginTop: 16,
  },
  calculateButton: {
    marginBottom: 12,
  },
  clearButton: {
    marginBottom: 12,
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
