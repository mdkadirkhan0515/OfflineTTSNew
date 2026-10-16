/**
 * src/screens/HomeScreen.tsx
 * MANUAL VERSION - CardList manually built inside HomeScreen
 * Features: FlatList + CardItem + logo.png empty state + FixedInputBar + FloatingController
 * Uses: useActiveSession, useCards, useTTS (your edited 3 hooks)
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useColorScheme,
  Image,
  Pressable,
  Clipboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import FixedInputBar from '../components/InputBar/FixedInputBar';
import FloatingAudioController from '../components/GlobalController/FloatingAudioController';
import { useActiveSession } from '../hooks/useActiveSession';
import { useCards } from '../hooks/useCards';
import { useTTS } from '../hooks/useTTS';
import { Card } from '../types/card.types';

const PRIMARY_BLUE = '#2563EB';
const YELLOW_GLOW = '#FEF08A';

// --- CardItem Manual (same as CardItem.tsx but inside) ---
type CardItemProps = {
  id: string;
  content: string;
  isPlaying: boolean;
  isCurrentCard: boolean;
  highlightedCharIndex: number;
  onDelete: (id: string) => void;
  onCopy: (content: string) => void;
  onSoundPress: (card: Card) => void;
  isDark: boolean;
};

const CardItemManual: React.FC<CardItemProps> = ({
  id,
  content,
  isPlaying,
  isCurrentCard,
  highlightedCharIndex,
  onDelete,
  onCopy,
  onSoundPress,
  isDark,
}) => {
  const theme = {
    cardBg: isDark ? '#1E293B' : '#F8FAFC',
    text: isDark ? '#F1F5F9' : '#0F172A',
    border: isDark ? '#334155' : '#E2E8F0',
    icon: isDark ? '#94A3B8' : '#64748B',
  };

  const renderContent = () => {
    if (!isCurrentCard || !isPlaying || highlightedCharIndex === 0) {
      return <Text style={[styles.contentText, { color: theme.text }]}>{content}</Text>;
    }
    const before = content.substring(0, highlightedCharIndex);
    const activeChar = content.substring(highlightedCharIndex, highlightedCharIndex + 1);
    const after = content.substring(highlightedCharIndex + 1);
    return (
      <Text style={[styles.contentText, { color: theme.text }]}>
        <Text>{before}</Text>
        <Text style={styles.highlightedText}>{activeChar}</Text>
        <Text>{after}</Text>
      </Text>
    );
  };

  return (
    <View style={[styles.cardContainer, { backgroundColor: theme.cardBg, borderColor: isCurrentCard && isPlaying ? PRIMARY_BLUE : theme.border }]}>
      <View style={styles.topRow}>
        <Pressable onPress={() => onDelete(id)} hitSlop={10} style={styles.iconButton}>
          <Icon name="delete-outline" size={20} color={theme.icon} />
        </Pressable>
      </View>
      <View style={styles.contentBody}>{renderContent()}</View>
      <View style={styles.bottomRow}>
        <Pressable onPress={() => onCopy(content)} hitSlop={10} style={styles.iconButton}>
          <Icon name="content-copy" size={20} color={theme.icon} />
        </Pressable>
        <Pressable onPress={() => onSoundPress({ id, content } as Card)} hitSlop={10} style={[styles.iconButton, { marginLeft: 8 }]}>
          <Icon name={isCurrentCard && isPlaying ? 'stop' : 'volume-up'} size={22} color={isCurrentCard && isPlaying ? PRIMARY_BLUE : theme.icon} />
        </Pressable>
      </View>
    </View>
  );
};

// --- Empty State with logo.png ---
const EmptyState: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <View style={styles.emptyContainer}>
      <Image
        source={require('../assets/images/logo.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />
      <Text style={[styles.emptyTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>No cards yet</Text>
      <Text style={[styles.emptySubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>Type a message below to create your first TTS card</Text>
      {/* Premium illustration from earlier */}
      <Image
        source={require('../assets/images/logo.png')}
        style={[styles.emptyIllustration, { opacity: isDark ? 0.8 : 1 }]}
        resizeMode="contain"
      />
    </View>
  );
};

// --- Main HomeScreen ---
const HomeScreen: React.FC<any> = ({ route }) => {
  const systemColorScheme = useColorScheme();
  const isDark = systemColorScheme === 'dark';

  const { activeSessionId, createNewSession } = useActiveSession();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(activeSessionId);

  const { cards, removeCard, addCard } = useCards(currentSessionId);
  const { currentCardId, charIndex, status, speakCard, stop, isPlaying, pause, resume, showController } = useTTS();

  React.useEffect(() => {
    setCurrentSessionId(activeSessionId);
  }, [activeSessionId]);

  React.useEffect(() => {
    if (route?.params?.newChat) {
      const newId = createNewSession();
      setCurrentSessionId(newId);
    }
  }, [route?.params?.newChat, createNewSession]);

  const handleSubmit = useCallback(
    (text: string) => {
      let sessionId = currentSessionId;
      if (!sessionId) {
        sessionId = createNewSession();
        setCurrentSessionId(sessionId);
      }
      addCard(text);
    },
    [currentSessionId, createNewSession, addCard]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (currentCardId === id) stop();
      removeCard(id);
    },
    [removeCard, currentCardId, stop]
  );

  const handleCopy = useCallback((content: string) => {
    Clipboard.setString(content);
  }, []);

  const handleSoundPress = useCallback(
    (card: Card) => {
      const fullCard = cards.find((c) => c.id === card.id);
      if (!fullCard) return;
      if (currentCardId === card.id && isPlaying) {
        stop();
      } else {
        speakCard(fullCard as Card);
      }
    },
    [cards, currentCardId, isPlaying, speakCard, stop]
  );

  const renderItem = useCallback(
    ({ item }: { item: Card }) => {
      const isCurrent = item.id === currentCardId;
      return (
        <CardItemManual
          id={item.id}
          content={item.content}
          isPlaying={isCurrent && isPlaying}
          isCurrentCard={isCurrent}
          highlightedCharIndex={isCurrent ? charIndex : 0}
          onDelete={handleDelete}
          onCopy={handleCopy}
          onSoundPress={handleSoundPress}
          isDark={isDark}
        />
      );
    },
    [currentCardId, charIndex, isPlaying, isDark, handleDelete, handleCopy, handleSoundPress]
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}>
      {cards.length === 0 ? (
        <EmptyState isDark={isDark} />
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}

      <FixedInputBar onSubmit={handleSubmit} />
      <FloatingAudioController visible={showController} isPlaying={isPlaying} onToggle={() => (isPlaying ? pause() : resume())} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 120 },
  cardContainer: { width: '100%', borderRadius: 16, borderWidth: 1, padding: 16, marginVertical: 8 },
  topRow: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 8 },
  contentBody: { minHeight: 20 },
  contentText: { fontSize: 16, lineHeight: 24, fontFamily: 'System' },
  highlightedText: { backgroundColor: YELLOW_GLOW, color: '#000000', borderRadius: 4 },
  bottomRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 12 },
  iconButton: { padding: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 100 },
  logoImage: { width: 120, height: 120, borderRadius: 24, marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  emptyIllustration: { width: 280, height: 200, marginTop: 10 },
});

export default HomeScreen;

