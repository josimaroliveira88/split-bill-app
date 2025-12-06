// src/screens/BackupScreen.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { StorageService } from '../services/storage.service';
import { BillHistoryEntry } from '../types/bill.types';
import { RootStackParamList } from '../types/navigation.types';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Backup'>;

export const BackupScreen: React.FC<Props> = ({ navigation }) => {
  const [history, setHistory] = useState<BillHistoryEntry[]>([]);
  const [importText, setImportText] = useState('');

  useEffect(() => {
    StorageService.loadBillHistory().then(setHistory);
  }, []);

  const backupJson = useMemo(() => JSON.stringify(history, null, 2), [history]);

  const handleShare = async () => {
    try {
      const message = backupJson || '[]';
      await Share.share({ message, title: 'Backup do histórico de contas' });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar o backup.');
      console.error('Share backup error', error);
    }
  };

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importText);
      const sanitized = StorageService.sanitizeHistoryEntries(parsed);

      if (sanitized.length === 0) {
        Alert.alert('Aviso', 'Nenhum item válido encontrado para restaurar.');
        return;
      }

      await StorageService.replaceHistory(sanitized);
      setHistory(sanitized);
      setImportText('');
      Alert.alert('Sucesso', 'Histórico restaurado com sucesso.');
    } catch (error) {
      Alert.alert('Erro', 'Conteúdo inválido. Cole o JSON exportado anteriormente.');
      console.error('Import backup error', error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Backup do Histórico</Text>
      <Text style={styles.subtitle}>
        Exporte seu histórico antes de reinstalar e importe novamente depois para manter seus dados.
      </Text>

      <Card>
        <Text style={styles.sectionTitle}>Exportar</Text>
        <Text style={styles.text}>
          Compartilhe o JSON abaixo para salvar uma cópia (e-mail, WhatsApp, bloco de notas, etc.).
        </Text>
        <View style={styles.codeBlock}>
          <Text style={styles.code}>{backupJson}</Text>
        </View>
        <Button title="Compartilhar backup" onPress={handleShare} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Importar</Text>
        <Text style={styles.text}>
          Cole o JSON exportado anteriormente e toque em &quot;Restaurar histórico&quot;.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Cole o JSON aqui"
          placeholderTextColor={colors.textMuted}
          multiline
          value={importText}
          onChangeText={setImportText}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button
          title="Restaurar histórico"
          onPress={handleImport}
          variant="secondary"
          style={styles.restoreButton}
          disabled={!importText.trim()}
        />
      </Card>

      <Button title="Voltar" onPress={() => navigation.goBack()} variant="secondary" />
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
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  codeBlock: {
    backgroundColor: '#1E1C32',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  code: {
    color: colors.textSecondary,
    fontFamily: 'Courier New',
    fontSize: 12,
  },
  input: {
    minHeight: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.textPrimary,
    backgroundColor: '#1E1C32',
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  restoreButton: {
    marginTop: 4,
  },
});
