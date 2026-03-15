import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import type { StockQuote } from '../../types';

interface StockCardProps {
  symbol: string;
  name?: string;
  quote?: StockQuote | null;
  onPress?: () => void;
  compact?: boolean;
}

export default function StockCard({ symbol, name, quote, onPress, compact }: StockCardProps) {
  const isGain = (quote?.changePercent ?? 0) >= 0;
  const changeColor = isGain ? Colors.market.gain : Colors.market.loss;
  const changeBg = isGain ? Colors.market.gainBg : Colors.market.lossBg;

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.compact]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.left}>
        <View style={styles.symbolBadge}>
          <Text style={styles.symbolText}>{symbol.slice(0, 4)}</Text>
        </View>
        <View>
          <Text style={styles.symbol}>{symbol}</Text>
          {name && <Text style={styles.name} numberOfLines={1}>{name}</Text>}
        </View>
      </View>

      <View style={styles.right}>
        {quote ? (
          <>
            <Text style={styles.price}>{formatCurrency(quote.price)}</Text>
            <View style={[styles.changeBadge, { backgroundColor: changeBg }]}>
              <Text style={[styles.change, { color: changeColor }]}>
                {formatPercent(quote.changePercent)}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  compact: {
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  symbolBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  symbolText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.brand.primary,
    letterSpacing: 0.5,
  },
  symbol: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  name: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
    maxWidth: 140,
  },
  right: { alignItems: 'flex-end', gap: 4 },
  price: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  change: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  loading: {},
  loadingText: { fontSize: FontSize.sm, color: Colors.text.tertiary },
});
