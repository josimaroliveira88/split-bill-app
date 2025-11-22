// src/screens/SimpleSplitScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import { CalculationService } from '../services/calculation.service';

export const SimpleSplitScreen: React.FC = () => {
  const [totalAmount, setTotalAmount] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState('');
  const [serviceFee, setServiceFee] = useState('10');
  const [result, setResult] = useState<number | null>(null);

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
  };

  const handleClear = () => {
    setTotalAmount('');
    setNumberOfPeople('');
    setServiceFee('10');
    setResult(null);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Divisão Simples</Text>
        <Text style={styles.subtitle}>
          Divida a conta igualmente entre todos
        </Text>

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
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
  },
  resultCard: {
    backgroundColor: '#007AFF',
    alignItems: 'center',
    paddingVertical: 24,
  },
  resultLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  resultDetails: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    paddingTop: 16,
  },
  resultDetailText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
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
});