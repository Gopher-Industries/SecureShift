// AI Incident Assistant (GA-045): a modal that helps a guard write an incident
// report — drafts/structures it, suggests a severity, flags missing details, and
// answers "what do I do?" procedure questions. Backend-agnostic (see
// api/aiIncident.ts); works offline via the deterministic mock.
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { askAssistant, assistIncident, type AssistResult, type Severity } from '../api/aiIncident';
import { useAppTheme } from '../theme';

import type { MissingField } from '../lib/incidentAssist';
import type { AppColors } from '../theme/colors';

type Props = {
  visible: boolean;
  description: string;
  shiftTitle?: string;
  dateTime?: string;
  onApplyDraft: (text: string) => void;
  onApplySeverity: (severity: Severity) => void;
  onClose: () => void;
};

export default function IncidentAssistantModal({
  visible,
  description,
  shiftTitle,
  dateTime,
  onApplyDraft,
  onApplySeverity,
  onClose,
}: Props) {
  const { colors } = useAppTheme();
  const s = getStyles(colors);
  const { t } = useTranslation();

  const [tab, setTab] = useState<'improve' | 'ask'>('improve');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssistResult | null>(null);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);

  const severityLabel = (sev: Severity) => t(`incidentReport.types.${sev.toLowerCase()}`);
  const missingLabel = (m: MissingField) => t(`aiIncident.missingFields.${m}`);

  const runImprove = async () => {
    if (!description.trim()) {
      setError(t('aiIncident.noDescription'));
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await assistIncident({ description, dateTime, shiftTitle });
      setResult(r);
    } catch {
      setError(t('aiIncident.error'));
    } finally {
      setLoading(false);
    }
  };

  const runAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const r = await askAssistant(question.trim());
      setAnswer(r.answer);
    } catch {
      setError(t('aiIncident.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.header}>
            <Text style={s.title}>✨ {t('aiIncident.title')}</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel={t('aiIncident.close')}>
              <Text style={s.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={s.tabs}>
            <TouchableOpacity
              style={[s.tab, tab === 'improve' && s.tabActive]}
              onPress={() => setTab('improve')}
            >
              <Text style={[s.tabText, tab === 'improve' && s.tabTextActive]}>
                {t('aiIncident.improveTab')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tab, tab === 'ask' && s.tabActive]}
              onPress={() => setTab('ask')}
            >
              <Text style={[s.tabText, tab === 'ask' && s.tabTextActive]}>
                {t('aiIncident.askTab')}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={s.body} contentContainerStyle={s.bodyContent}>
            {loading ? <ActivityIndicator color={colors.primary} style={s.spinner} /> : null}
            {error ? <Text style={s.error}>{error}</Text> : null}

            {tab === 'improve' ? (
              <>
                <TouchableOpacity style={s.primaryBtn} onPress={runImprove} disabled={loading}>
                  <Text style={s.primaryBtnText}>{t('aiIncident.improveCta')}</Text>
                </TouchableOpacity>

                {result ? (
                  <>
                    <Text style={s.sectionHeading}>{t('aiIncident.draftHeading')}</Text>
                    <View style={s.draftBox}>
                      <Text style={s.draftText}>{result.draft}</Text>
                    </View>
                    <TouchableOpacity
                      style={s.applyBtn}
                      onPress={() => {
                        onApplyDraft(result.draft);
                        onClose();
                      }}
                    >
                      <Text style={s.applyBtnText}>{t('aiIncident.useDraft')}</Text>
                    </TouchableOpacity>

                    <Text style={s.sectionHeading}>{t('aiIncident.severityHeading')}</Text>
                    <TouchableOpacity
                      style={s.applyBtn}
                      onPress={() => onApplySeverity(result.suggestedSeverity)}
                    >
                      <Text style={s.applyBtnText}>
                        {t('aiIncident.applySeverity', {
                          level: severityLabel(result.suggestedSeverity),
                        })}
                      </Text>
                    </TouchableOpacity>

                    <Text style={s.sectionHeading}>{t('aiIncident.missingHeading')}</Text>
                    {result.missing.length === 0 ? (
                      <Text style={s.allGood}>✅ {t('aiIncident.nothingMissing')}</Text>
                    ) : (
                      result.missing.map((m) => (
                        <Text key={m} style={s.missingItem}>
                          • {missingLabel(m)}
                        </Text>
                      ))
                    )}
                  </>
                ) : null}
              </>
            ) : (
              <>
                <TextInput
                  value={question}
                  onChangeText={setQuestion}
                  placeholder={t('aiIncident.askPlaceholder')}
                  placeholderTextColor={colors.muted}
                  style={s.input}
                  multiline
                />
                <TouchableOpacity style={s.primaryBtn} onPress={runAsk} disabled={loading}>
                  <Text style={s.primaryBtnText}>{t('aiIncident.askCta')}</Text>
                </TouchableOpacity>

                {answer ? (
                  <>
                    <Text style={s.sectionHeading}>{t('aiIncident.answerHeading')}</Text>
                    <View style={s.draftBox}>
                      <Text style={s.draftText}>{answer}</Text>
                    </View>
                  </>
                ) : null}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    backdrop: { backgroundColor: 'rgba(0,0,0,0.5)', flex: 1, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.bg,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      maxHeight: '88%',
      paddingBottom: 24,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
    },
    title: { color: colors.text, fontSize: 18, fontWeight: '700' },
    close: { color: colors.muted, fontSize: 20, paddingHorizontal: 8 },
    tabs: { flexDirection: 'row', paddingHorizontal: 16 },
    tab: {
      borderBottomColor: colors.border,
      borderBottomWidth: 2,
      flex: 1,
      paddingVertical: 10,
    },
    tabActive: { borderBottomColor: colors.primary },
    tabText: { color: colors.muted, fontWeight: '600', textAlign: 'center' },
    tabTextActive: { color: colors.primary },
    body: { paddingHorizontal: 16 },
    bodyContent: { paddingBottom: 24, paddingTop: 12 },
    spinner: { marginVertical: 12 },
    error: { color: colors.status.rejected, marginBottom: 8 },
    primaryBtn: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 10,
      marginBottom: 12,
      paddingVertical: 14,
    },
    primaryBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
    sectionHeading: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 6,
      marginTop: 12,
    },
    draftBox: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 10,
      borderWidth: 1,
      padding: 12,
    },
    draftText: { color: colors.text, fontSize: 14, lineHeight: 20 },
    applyBtn: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 10,
      marginTop: 8,
      paddingVertical: 12,
    },
    applyBtnText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
    allGood: { color: colors.success, fontSize: 14 },
    missingItem: { color: colors.text, fontSize: 14, marginBottom: 2 },
    input: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 10,
      borderWidth: 1,
      color: colors.text,
      marginBottom: 12,
      minHeight: 64,
      padding: 12,
      textAlignVertical: 'top',
    },
  });
