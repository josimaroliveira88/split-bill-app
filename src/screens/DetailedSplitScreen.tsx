// src/screens/DetailedSplitScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useBill } from '../context/BillContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';

export const DetailedSplitScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    bill,
    addPerson,
    removePerson,
    addItem,
    removeItem,
    addItemConsumption,
    distributeItemEqually,
    updateSettings,
  } = useBill();

  const [personName, setPersonName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const serviceFeePercentage = bill.settings.serviceFeePercentage || 0;

  const formatCurrency = (value: number) => value.toFixed(2).replace('.', ',');

  const totalItemsValue = bill.items.reduce((sum, item) => sum + item.price, 0);
  const serviceFeeValue = totalItemsValue * (serviceFeePercentage / 100);
  const totalBillValue = totalItemsValue + serviceFeeValue;

  const handleAddPerson = () => {
    if (!personName.trim()) {
      Alert.alert('Erro', 'Digite o nome da pessoa');
      return;
    }
    addPerson(personName.trim());
    setPersonName('');
  };

  const handleAddItem = () => {
    const price = parseFloat(itemPrice);
    const quantity = parseInt(itemQuantity);

    if (!itemName.trim()) {
      Alert.alert('Erro', 'Digite o nome do item');
      return;
    }
    if (isNaN(price) || price <= 0) {
      Alert.alert('Erro', 'Digite um preço válido');
      return;
    }
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Erro', 'Digite uma quantidade válida');
      return;
    }

    addItem(itemName.trim(), price, quantity);
    setItemName('');
    setItemPrice('');
    setItemQuantity('1');
  };

  const handleDistributeItem = (itemId: string) => {
    setSelectedItemId(itemId);
    setSelectedPeople([]);
    setShowDistributeModal(true);
  };

  const togglePersonSelection = (personId: string) => {
    setSelectedPeople(prev =>
      prev.includes(personId)
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  const confirmDistribution = () => {
    if (selectedItemId && selectedPeople.length > 0) {
      distributeItemEqually(selectedItemId, selectedPeople);
      setShowDistributeModal(false);
      setSelectedItemId(null);
      setSelectedPeople([]);
    }
  };

  const handleCalculate = () => {
    if (bill.people.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos uma pessoa');
      return;
    }
    if (bill.items.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos um item');
      return;
    }
    navigation.navigate('Result');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Divisão Detalhada</Text>

        {/* Pessoas */}
        <Card>
          <Text style={styles.sectionTitle}>Pessoas</Text>
          <View style={styles.inputRow}>
            <Input
              value={personName}
              onChangeText={setPersonName}
              placeholder="Nome da pessoa"
              style={styles.flexInput}
            />
            <Button title="+" onPress={handleAddPerson} style={styles.addButton} />
          </View>
          {bill.people.map(person => (
            <View key={person.id} style={styles.listItem}>
              <Text style={styles.listItemText}>{person.name}</Text>
              <TouchableOpacity onPress={() => removePerson(person.id)}>
                <Text style={styles.removeText}>Remover</Text>
              </TouchableOpacity>
            </View>
          ))}
        </Card>

        {/* Itens */}
        <Card>
          <Text style={styles.sectionTitle}>Itens</Text>
          <Input
            label="Nome do Item"
            value={itemName}
            onChangeText={setItemName}
            placeholder="Ex: Pizza"
          />
          <Input
            label="Preço Total (R$)"
            value={itemPrice}
            onChangeText={setItemPrice}
            keyboardType="decimal-pad"
            placeholder="0,00"
          />
          <Input
            label="Quantidade"
            value={itemQuantity}
            onChangeText={setItemQuantity}
            keyboardType="number-pad"
            placeholder="1"
          />
          <Button title="Adicionar Item" onPress={handleAddItem} />

          {bill.items.map(item => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <TouchableOpacity onPress={() => removeItem(item.id)}>
                  <Text style={styles.removeText}>Remover</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.itemDetail}>
                R$ {item.price.toFixed(2)} - {item.totalQuantity} unidade(s)
              </Text>
              <Button
                title="Distribuir entre pessoas"
                onPress={() => handleDistributeItem(item.id)}
                variant="secondary"
                style={styles.distributeButton}
              />
            </View>
          ))}
        </Card>

        {/* Configurações */}
        <Card>
          <Text style={styles.sectionTitle}>Taxa de Serviço</Text>
          <Input
            label="Percentual (%)"
            value={bill.settings.serviceFeePercentage.toString()}
            onChangeText={text =>
              updateSettings({ serviceFeePercentage: parseFloat(text) || 0 })
            }
            keyboardType="decimal-pad"
          />
          <Text style={styles.label}>Modo de Divisão da Taxa:</Text>
          <View style={styles.modeButtons}>
            <Button
              title="Igualitária"
              onPress={() => updateSettings({ serviceFeeMode: 'equal' })}
              variant={bill.settings.serviceFeeMode === 'equal' ? 'primary' : 'secondary'}
              style={styles.modeButton}
            />
            <Button
              title="Proporcional"
              onPress={() => updateSettings({ serviceFeeMode: 'proportional' })}
              variant={
                bill.settings.serviceFeeMode === 'proportional' ? 'primary' : 'secondary'
              }
              style={styles.modeButton}
            />
          </View>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Resumo da Conta</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total consumido</Text>
            <Text style={styles.summaryValue}>R$ {formatCurrency(totalItemsValue)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Gorjeta ({serviceFeePercentage}%)
            </Text>
            <Text style={styles.summaryValue}>R$ {formatCurrency(serviceFeeValue)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.summaryTotalLabel}>Total da conta</Text>
            <Text style={styles.summaryTotalValue}>
              R$ {formatCurrency(totalBillValue)}
            </Text>
          </View>
        </Card>

        <Button title="Calcular Resultado" onPress={handleCalculate} />
      </View>

      {/* Modal de Distribuição */}
      <Modal visible={showDistributeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione as Pessoas</Text>
            {bill.people.map(person => (
              <TouchableOpacity
                key={person.id}
                style={[
                  styles.personOption,
                  selectedPeople.includes(person.id) && styles.personSelected,
                ]}
                onPress={() => togglePersonSelection(person.id)}
              >
                <Text style={styles.personOptionText}>{person.name}</Text>
                {selectedPeople.includes(person.id) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <View style={styles.modalButtons}>
              <Button
                title="Confirmar"
                onPress={confirmDistribution}
                style={styles.modalButton}
              />
              <Button
                title="Cancelar"
                onPress={() => setShowDistributeModal(false)}
                variant="secondary"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  flexInput: {
    flex: 1,
    marginBottom: 0,
  },
  addButton: {
    marginLeft: 8,
    paddingHorizontal: 20,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  listItemText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  removeText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  itemCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  itemDetail: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  distributeButton: {
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#F0F6FF',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#555',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 8,
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  personOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  personSelected: {
    backgroundColor: '#007AFF',
  },
  personOptionText: {
    fontSize: 16,
  },
  checkmark: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  modalButtons: {
    marginTop: 16,
    gap: 8,
  },
  modalButton: {
    marginBottom: 8,
  },
});
