// src/screens/DetailedSplitScreen.tsx

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useBill } from '../context/BillContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import { BillHistoryEntry, ItemConsumption } from '../types/bill.types';
import { StorageService } from '../services/storage.service';

export const DetailedSplitScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    bill,
    currentEntryMeta,
    updateBillInfo,
    addPerson,
    removePerson,
    addItem,
    removeItem,
    distributeItemEqually,
    distributeItemCustom,
    updateSettings,
    calculateResults,
  } = useBill();

  const [personName, setPersonName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [payerId, setPayerId] = useState('');
  const [priceMode, setPriceMode] = useState<'total' | 'unit'>('total');
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [peopleQuantities, setPeopleQuantities] = useState<Record<string, string>>({});
  const serviceFeePercentage = bill.settings.serviceFeePercentage || 0;

  const formatCurrency = (value: number) => value.toFixed(2).replace('.', ',');

  const totalItemsValue = bill.items.reduce((sum, item) => sum + item.price, 0);
  const serviceFeeValue = totalItemsValue * (serviceFeePercentage / 100);
  const totalBillValue = totalItemsValue + serviceFeeValue;
  const selectedItem = useMemo(
    () => bill.items.find(item => item.id === selectedItemId) || null,
    [bill.items, selectedItemId]
  );
  const distributedQuantity = useMemo(() => {
    return selectedPeople.reduce((sum, personId) => {
      const qty = parseFloat(peopleQuantities[personId] || '0');
      return sum + (isNaN(qty) ? 0 : qty);
    }, 0);
  }, [peopleQuantities, selectedPeople]);
  const remainingQuantity = selectedItem
    ? Math.max(selectedItem.totalQuantity - distributedQuantity, 0)
    : 0;
  const liveResults = useMemo(
    () => (bill.people.length > 0 && bill.items.length > 0 ? calculateResults() : []),
    [bill, calculateResults]
  );

  const handleAddPerson = () => {
    if (!personName.trim()) {
      Alert.alert('Erro', 'Digite o nome da pessoa');
      return;
    }
    addPerson(personName.trim());
    setPersonName('');
  };

  const handleAddItem = () => {
    if (bill.people.length === 0) {
      Alert.alert('Erro', 'Adicione pessoas e escolha quem paga este item.');
      return;
    }

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
    if (!payerId) {
      Alert.alert('Erro', 'Selecione quem é o responsável por este item');
      return;
    }

    const totalPrice = priceMode === 'unit' ? price * quantity : price;

    addItem(itemName.trim(), totalPrice, quantity, payerId);
    setItemName('');
    setItemPrice('');
    setItemQuantity('1');
    setPayerId('');
    setPriceMode('total');
  };

  const handleDistributeItem = (itemId: string) => {
    setSelectedItemId(itemId);
    setSelectedPeople([]);
    setPeopleQuantities({});
    setShowDistributeModal(true);
  };

  const togglePersonSelection = (personId: string) => {
    setSelectedPeople(prev => {
      const alreadySelected = prev.includes(personId);

      if (alreadySelected) {
        setPeopleQuantities(current => {
          const updated = { ...current };
          delete updated[personId];
          return updated;
        });
        return prev.filter(id => id !== personId);
      }

      return [...prev, personId];
    });
  };

  const confirmDistribution = () => {
    if (!selectedItemId || selectedPeople.length === 0) {
      Alert.alert('Erro', 'Selecione ao menos uma pessoa para distribuir.');
      return;
    }

    const item = bill.items.find(i => i.id === selectedItemId);
    if (!item) return;

    const manualConsumptions = selectedPeople
      .map(personId => ({
        itemId: item.id,
        personId,
        quantity: parseFloat(peopleQuantities[personId] || '0'),
      }))
      .filter(c => !isNaN(c.quantity) && c.quantity > 0);

    if (manualConsumptions.length === 0) {
      distributeItemEqually(selectedItemId, selectedPeople);
      setShowDistributeModal(false);
      setSelectedItemId(null);
      setSelectedPeople([]);
      setPeopleQuantities({});
      return;
    }

    const totalDistributed = manualConsumptions.reduce((sum, c) => sum + c.quantity, 0);

    if (totalDistributed > item.totalQuantity) {
      Alert.alert(
        'Erro',
        'A quantidade distribuída excede a quantidade total disponível para este item.'
      );
      return;
    }

    const consumptions: ItemConsumption[] = [...manualConsumptions];
    const remaining = item.totalQuantity - totalDistributed;

    if (remaining > 0) {
      if (item.payerId) {
        const payerIndex = consumptions.findIndex(c => c.personId === item.payerId);

        if (payerIndex >= 0) {
          consumptions[payerIndex] = {
            ...consumptions[payerIndex],
            quantity: consumptions[payerIndex].quantity + remaining,
          };
        } else {
          consumptions.push({ itemId: item.id, personId: item.payerId, quantity: remaining });
        }
      } else {
        Alert.alert(
          'Atenção',
          'Distribua toda a quantidade do item ou selecione um pagador para ficar com o restante.'
        );
        return;
      }
    }

    distributeItemCustom(item.id, consumptions);
    setShowDistributeModal(false);
    setSelectedItemId(null);
    setSelectedPeople([]);
    setPeopleQuantities({});
  };

  const persistTitleAndNote = React.useCallback(async () => {
    if (!currentEntryMeta?.id) return;
    const history = await StorageService.loadBillHistory();
    const entry = history.find(e => e.id === currentEntryMeta.id);
    if (!entry) return;

    const resolvedTitle =
      (bill.title && bill.title.trim()) ||
      entry.title ||
      entry.name ||
      new Date(entry.createdAt).toLocaleString();
    const resolvedNote = bill.note && bill.note.trim() ? bill.note.trim() : undefined;

    const updated: BillHistoryEntry = {
      ...entry,
      name: resolvedTitle,
      title: bill.title?.trim() || undefined,
      note: resolvedNote,
      bill: {
        ...(entry.bill as any),
        ...bill,
        title: bill.title?.trim() || undefined,
        note: resolvedNote,
      },
    };

    await StorageService.updateHistoryEntry(updated);
  }, [bill, currentEntryMeta]);

  useFocusEffect(
    useMemo(
      () => () => {
        persistTitleAndNote();
      },
      [persistTitleAndNote]
    )
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Divisão Detalhada</Text>
        <Card>
          <Input
            label="Título da conta (ex: nome do estabelecimento)"
            value={bill.title}
            onChangeText={text => updateBillInfo({ title: text })}
            placeholder="Ex: Churrascaria Boi na Brasa"
          />
          <Input
            label="Observações"
            value={bill.note}
            onChangeText={text => updateBillInfo({ note: text })}
            placeholder="Ex: Atendimento excelente, pedir mesa ao fundo."
            multiline
            numberOfLines={3}
            style={styles.noteInput}
          />
        </Card>

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
          <View style={styles.priceModeRow}>
            <Button
              title="Preço Total"
              onPress={() => setPriceMode('total')}
              variant={priceMode === 'total' ? 'primary' : 'secondary'}
              style={styles.priceModeButton}
            />
            <Button
              title="Preço Unitário"
              onPress={() => setPriceMode('unit')}
              variant={priceMode === 'unit' ? 'primary' : 'secondary'}
              style={styles.priceModeButton}
            />
          </View>
          <Input
            label="Nome do Item"
            value={itemName}
            onChangeText={setItemName}
            placeholder="Ex: Pizza"
          />
          <Input
            label={priceMode === 'total' ? 'Preço Total (R$)' : 'Preço Unitário (R$)'}
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
          <View style={styles.payerSection}>
            <Text style={styles.payerLabel}>Quem paga por este item? (obrigatório)</Text>
            {bill.people.length === 0 ? (
              <Text style={styles.payerHelper}>Adicione pessoas para selecionar um pagador.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {bill.people.map(person => {
                  const selected = payerId === person.id;
                  return (
                    <TouchableOpacity
                      key={person.id}
                      style={[styles.payerChip, selected && styles.payerChipSelected]}
                      onPress={() => setPayerId(selected ? '' : person.id)}
                    >
                      <Text style={[styles.payerChipText, selected && styles.payerChipTextSelected]}>
                        {person.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
          <Button title="Adicionar Item" onPress={handleAddItem} />

          {bill.items.map(item => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <TouchableOpacity onPress={() => removeItem(item.id)}>
                  <Text style={styles.removeText}>Remover</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.itemDetail}>
                <Text style={styles.itemDetailQuantity}>
                  {item.totalQuantity} unidade(s)
                </Text>
                <Text style={styles.itemDetailPrice}>
                  Unitário: R$ {formatCurrency(item.price / item.totalQuantity)}
                  {'  '}•{'  '}
                  Total: R$ {formatCurrency(item.price)}
                </Text>
              </View>
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

        {liveResults.length > 0 && (
          <Card style={styles.liveResultsCard}>
            <Text style={styles.sectionTitle}>Resultado Atual</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total geral</Text>
              <Text style={styles.summaryValue}>
                R$ {formatCurrency(liveResults.reduce((sum, r) => sum + r.totalToPay, 0))}
              </Text>
            </View>
            {liveResults.map(result => (
              <View key={result.personId} style={styles.livePersonRow}>
                <View>
                  <Text style={styles.personName}>{result.personName}</Text>
                  <Text style={styles.liveSubText}>
                    Consumo: R$ {formatCurrency(result.itemsTotal)} • Gorjeta: R$ {formatCurrency(result.serviceFee)}
                  </Text>
                </View>
                <Text style={styles.liveAmount}>R$ {formatCurrency(result.totalToPay)}</Text>
              </View>
            ))}

            <Button
              title="Ver detalhamento completo"
              onPress={() => navigation.navigate('Result')}
              style={styles.liveButton}
            />
          </Card>
        )}
      </View>

      {/* Modal de Distribuição */}
      <Modal visible={showDistributeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione as Pessoas</Text>
            {selectedItem && (
              <Text style={styles.modalHelper}>
                Total: {selectedItem.totalQuantity}  •  Distribuída: {distributedQuantity || 0}
                {'  '}•{'  '}Restante: {remainingQuantity}
              </Text>
            )}
            <Text style={styles.modalHelper}>
              Informe a quantidade para cada pessoa. Se deixar em branco, dividiremos o item
              igualmente entre os selecionados.
            </Text>
            {bill.people.map(person => (
              <View
                key={person.id}
                style={[
                  styles.personOption,
                  selectedPeople.includes(person.id) && styles.personSelected,
                ]}
              >
                <TouchableOpacity
                  style={styles.personInfo}
                  onPress={() => togglePersonSelection(person.id)}
                >
                  <Text
                    style={[
                      styles.personOptionText,
                      selectedPeople.includes(person.id) && styles.personOptionTextSelected,
                    ]}
                  >
                    {person.name}
                  </Text>
                  {selectedPeople.includes(person.id) && (
                    <Text style={styles.personHint}>Selecionado</Text>
                  )}
                </TouchableOpacity>

                {selectedPeople.includes(person.id) && (
                  <View style={styles.quantityInputContainer}>
                    <Text style={styles.quantityLabel}>Qtd.</Text>
                    <TextInput
                      value={peopleQuantities[person.id] || ''}
                      onChangeText={text =>
                        setPeopleQuantities(prev => ({ ...prev, [person.id]: text }))
                      }
                      placeholder="0"
                      keyboardType="decimal-pad"
                      style={styles.quantityInput}
                    />
                  </View>
                )}
              </View>
            ))}
            <View style={styles.modalButtons}>
              <Button
                title="Confirmar"
                onPress={confirmDistribution}
                style={styles.modalButton}
              />
              <Button
                title="Cancelar"
                onPress={() => {
                  setShowDistributeModal(false);
                  setSelectedItemId(null);
                  setSelectedPeople([]);
                  setPeopleQuantities({});
                }}
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
    marginBottom: 8,
  },
  itemDetailQuantity: {
    fontSize: 14,
    color: '#5C5C60',
  },
  itemDetailPrice: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
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
  priceModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  priceModeButton: {
    flex: 1,
  },
  payerSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  payerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  payerHelper: {
    fontSize: 13,
    color: '#8E8E93',
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  payerChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  payerChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  payerChipText: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  payerChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#F0F6FF',
  },
  liveResultsCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
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
  livePersonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  liveSubText: {
    fontSize: 12,
    color: '#5C5C60',
    marginTop: 2,
  },
  liveAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  liveButton: {
    marginTop: 12,
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
  personOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  personInfo: {
    flex: 1,
  },
  personHint: {
    fontSize: 12,
    color: '#E5E5EA',
    marginTop: 4,
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  quantityLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginRight: 6,
  },
  quantityInput: {
    width: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    color: '#1C1C1E',
  },
  modalButtons: {
    marginTop: 16,
    gap: 8,
  },
  modalButton: {
    marginBottom: 8,
  },
  modalHelper: {
    fontSize: 13,
    color: '#5C5C60',
    marginBottom: 8,
    lineHeight: 18,
  },
});
