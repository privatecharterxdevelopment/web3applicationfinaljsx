import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');

// Action buttons for balance card
const ACTION_BUTTONS = [
  { icon: 'arrow-up', label: 'Send' },
  { icon: 'arrow-down', label: 'Receive' },
  { icon: 'swap-horizontal', label: 'Swap' },
  { icon: 'add', label: 'Buy' },
];

// Mock assets data
const ASSETS = [
  {
    id: '1',
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '₿',
    iconColor: '#F7931A',
    balance: '0.8542',
    value: '$37,892.23',
    change: '+2.4%',
    changePositive: true,
  },
  {
    id: '2',
    symbol: 'SOL',
    name: 'Solana',
    icon: '◎',
    iconColor: '#9945FF',
    balance: '12.5',
    value: '$174.62',
    change: '+5.2%',
    changePositive: true,
  },
  {
    id: '3',
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'Ξ',
    iconColor: '#627EEA',
    balance: '0.72',
    value: '$4,299.07',
    change: '-0.8%',
    changePositive: false,
  },
  {
    id: '4',
    symbol: 'USDC',
    name: 'USD Coin',
    icon: '$',
    iconColor: '#2775CA',
    balance: '1,562.32',
    value: '$1,562.32',
    change: '0.0%',
    changePositive: true,
  },
];

export default function BalanceScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SPACING.md, paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card with Chrome Gradient */}
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientMiddle, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          {/* Wallet Label */}
          <View style={styles.walletLabelContainer}>
            <Text style={styles.walletLabel}>Primary Wallet</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.textDark} />
          </View>

          {/* Balance */}
          <Text style={styles.balanceAmount}>$39,928.24</Text>
          <Text style={styles.balanceChange}>+2.05% ($220.05)</Text>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            {ACTION_BUTTONS.map((button, index) => (
              <TouchableOpacity key={index} style={styles.actionButton}>
                <View style={styles.actionButtonIcon}>
                  <Ionicons
                    name={button.icon as any}
                    size={22}
                    color={COLORS.textPrimary}
                  />
                </View>
                <Text style={styles.actionButtonLabel}>{button.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>

        {/* Assets Section */}
        <View style={styles.assetsSection}>
          <Text style={styles.sectionTitle}>Assets</Text>

          {ASSETS.map((asset) => (
            <TouchableOpacity key={asset.id} style={styles.assetItem}>
              {/* Asset Icon */}
              <View style={[styles.assetIcon, { backgroundColor: asset.iconColor + '20' }]}>
                <Text style={[styles.assetIconText, { color: asset.iconColor }]}>
                  {asset.icon}
                </Text>
              </View>

              {/* Asset Info */}
              <View style={styles.assetInfo}>
                <Text style={styles.assetName}>{asset.name}</Text>
                <Text style={styles.assetBalance}>
                  {asset.balance} {asset.symbol}
                </Text>
              </View>

              {/* Asset Value */}
              <View style={styles.assetValue}>
                <Text style={styles.assetValueText}>{asset.value}</Text>
                <Text
                  style={[
                    styles.assetChange,
                    { color: asset.changePositive ? COLORS.positive : COLORS.negative },
                  ]}
                >
                  {asset.change}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* PCX Services Teaser */}
        <TouchableOpacity style={styles.servicesCard}>
          <LinearGradient
            colors={[COLORS.accent + '30', COLORS.accent + '10']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.servicesGradient}
          >
            <View style={styles.servicesContent}>
              <Ionicons name="airplane" size={24} color={COLORS.accent} />
              <View style={styles.servicesText}>
                <Text style={styles.servicesTitle}>PrivateCharterX Services</Text>
                <Text style={styles.servicesSubtitle}>Book jets, helicopters & more</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Bottom Navigation */}
      <BlurView intensity={80} tint="dark" style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="wallet" size={24} color={COLORS.accent} />
          <Text style={[styles.navLabel, { color: COLORS.accent }]}>Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="card-outline" size={24} color={COLORS.textSecondary} />
          <Text style={styles.navLabel}>Card</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="time-outline" size={24} color={COLORS.textSecondary} />
          <Text style={styles.navLabel}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color={COLORS.textSecondary} />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
  },

  // Balance Card
  balanceCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.card,
  },
  walletLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.lg,
  },
  walletLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textDark,
    fontWeight: '600',
    marginRight: SPACING.xs,
  },
  balanceAmount: {
    fontSize: FONT_SIZE.hero,
    fontWeight: '700',
    color: COLORS.textDark,
    textAlign: 'center',
    letterSpacing: -1,
  },
  balanceChange: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textDark,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.textDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  actionButtonLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textDark,
    fontWeight: '600',
  },

  // Assets Section
  assetsSection: {
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  assetIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetIconText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  assetInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  assetName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  assetBalance: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  assetValue: {
    alignItems: 'flex-end',
  },
  assetValueText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  assetChange: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },

  // Services Card
  servicesCard: {
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  servicesGradient: {
    padding: SPACING.md,
  },
  servicesContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicesText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  servicesTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  servicesSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Bottom Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    backgroundColor: COLORS.floatingBar,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    ...SHADOWS.floating,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  navLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
});
