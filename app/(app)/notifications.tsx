import React, { useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import { formatRelativeTime } from '../../src/utils/formatters';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../src/constants/theme';

// ─── Mock news data (shared shape with home.tsx) ──────────────────────────────

export const ALL_NEWS = [
  {
    id: '1',
    headline: 'Markets selloff deepens as tariff fears and recession concerns rattle investors',
    source: 'Reuters',
    publishedAt: Date.now() - 1_800_000,
    relatedSymbols: ['SPY', 'QQQ'],
  },
  {
    id: '2',
    headline: 'Tesla slides as EV demand concerns mount and margin pressure weighs on outlook',
    source: 'Bloomberg',
    publishedAt: Date.now() - 5_400_000,
    relatedSymbols: ['TSLA'],
  },
  {
    id: '3',
    headline: 'NVIDIA faces pressure as AI spending scrutiny grows among hyperscalers',
    source: 'WSJ',
    publishedAt: Date.now() - 9_000_000,
    relatedSymbols: ['NVDA', 'AMD'],
  },
  {
    id: '4',
    headline: 'Apple quietly launches new iPhone SE with advanced AI features at lower price point',
    source: 'CNBC',
    publishedAt: Date.now() - 14_400_000,
    relatedSymbols: ['AAPL'],
  },
  {
    id: '5',
    headline: 'Fed holds rates steady, signals patient approach as jobs data stays resilient',
    source: 'Financial Times',
    publishedAt: Date.now() - 21_600_000,
    relatedSymbols: ['SPY', 'GLD'],
  },
  {
    id: '6',
    headline: 'Microsoft Azure growth accelerates as enterprise AI adoption surges',
    source: 'Bloomberg',
    publishedAt: Date.now() - 28_800_000,
    relatedSymbols: ['MSFT'],
  },
  {
    id: '7',
    headline: 'Meta beats expectations on advertising revenue, raises full-year guidance',
    source: 'Reuters',
    publishedAt: Date.now() - 36_000_000,
    relatedSymbols: ['META'],
  },
  {
    id: '8',
    headline: 'Coinbase shares rise after Bitcoin hits new weekly high on institutional demand',
    source: 'CNBC',
    publishedAt: Date.now() - 43_200_000,
    relatedSymbols: ['COIN', 'BTC'],
  },
  {
    id: '9',
    headline: 'Oil giants Exxon and Chevron raise dividends as energy prices stabilise',
    source: 'Financial Times',
    publishedAt: Date.now() - 50_400_000,
    relatedSymbols: ['XOM', 'CVX'],
  },
  {
    id: '10',
    headline: 'Netflix subscriber growth beats estimates, password-sharing crackdown pays off',
    source: 'WSJ',
    publishedAt: Date.now() - 57_600_000,
    relatedSymbols: ['NFLX'],
  },
];

// ─── Article Card ─────────────────────────────────────────────────────────────

function ArticleCard({ article, isHoldings }: { article: typeof ALL_NEWS[0]; isHoldings?: boolean }) {
  return (
    <TouchableOpacity style={[styles.card, isHoldings && styles.cardHighlighted]} activeOpacity={0.8}>
      <View style={styles.cardContent}>
        <View style={styles.cardMeta}>
          <Text style={styles.cardSource}>{article.source}</Text>
          <Text style={styles.cardDot}>·</Text>
          <Text style={styles.cardTime}>{formatRelativeTime(article.publishedAt)}</Text>
          {isHoldings && (
            <View style={styles.holdingsBadge}>
              <Text style={styles.holdingsBadgeText}>Your stock</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardHeadline} numberOfLines={3}>{article.headline}</Text>
        {article.relatedSymbols.length > 0 && (
          <View style={styles.tags}>
            {article.relatedSymbols.slice(0, 4).map(sym => (
              <View key={sym} style={styles.tag}>
                <Text style={styles.tagText}>{sym}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const { portfolio, setNewsLastRead } = useAppStore();

  // Mark news as read when screen is opened
  useEffect(() => {
    setNewsLastRead(Date.now());
  }, []);

  const heldSymbols = useMemo(
    () => portfolio?.holdings.map(h => h.symbol) ?? [],
    [portfolio],
  );

  const holdingsNews = useMemo(
    () => ALL_NEWS.filter(n => n.relatedSymbols.some(s => heldSymbols.includes(s))),
    [heldSymbols],
  );

  const marketNews = useMemo(
    () => ALL_NEWS.filter(n => !n.relatedSymbols.some(s => heldSymbols.includes(s))),
    [heldSymbols],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(app)/dashboard')}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>News & Alerts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Holdings News */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📈</Text>
          <Text style={styles.sectionTitle}>Your Holdings</Text>
        </View>

        {holdingsNews.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No news for your holdings yet</Text>
            <Text style={styles.emptySubtext}>Buy stocks to see relevant news here</Text>
          </View>
        ) : (
          holdingsNews.map(article => (
            <ArticleCard key={article.id} article={article} isHoldings />
          ))
        )}

        {/* Market News */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <Text style={styles.sectionIcon}>🌐</Text>
          <Text style={styles.sectionTitle}>Market News</Text>
        </View>

        {marketNews.map(article => (
          <ArticleCard key={article.id} article={article} />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    backgroundColor: Colors.bg.primary,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 28,
    color: Colors.brand.primary,
    lineHeight: 32,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: Spacing.sm },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  sectionIcon: { fontSize: 18 },
  sectionTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    letterSpacing: 0.3,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.secondary,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  cardHighlighted: {
    borderColor: Colors.brand.primary + '60',
    backgroundColor: Colors.brand.primary + '0A',
  },
  cardContent: { flex: 1 },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: 4,
    flexWrap: 'wrap',
  },
  cardSource: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.brand.primary,
  },
  cardDot: {
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
  },
  cardTime: {
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
  },
  holdingsBadge: {
    backgroundColor: Colors.market.gain + '22',
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: Colors.market.gain + '55',
  },
  holdingsBadgeText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.market.gain,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardHeadline: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  tag: {
    backgroundColor: Colors.bg.tertiary,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  tagText: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
  },
  arrow: {
    fontSize: 22,
    color: Colors.text.tertiary,
    marginLeft: Spacing.sm,
  },

  emptyCard: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderStyle: 'dashed',
  },
  emptyIcon: { fontSize: 32, marginBottom: Spacing.sm },
  emptyText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
});
