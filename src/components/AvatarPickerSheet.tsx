import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../constants/theme';
import { pickAvatarPhoto } from '../utils/avatarPicker';

interface AvatarPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onPicked: (dataUrl: string) => void;
  onRemove?: () => void;
  showRemove?: boolean;
  embedded?: boolean;
}

export default function AvatarPickerSheet({
  visible,
  onClose,
  onPicked,
  onRemove,
  showRemove,
  embedded,
}: AvatarPickerSheetProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handlePick = async (source: 'camera' | 'library') => {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const dataUrl = await pickAvatarPhoto(source);
      if (dataUrl) {
        onPicked(dataUrl);
        onClose();
      }
    } catch (e: any) {
      setError(e?.message || 'Could not load that photo. Please try another.');
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    if (busy) return;
    setError('');
    onClose();
  };

  const sheetContent = (
    <View
      style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
      }}
    >
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={close} />
      <View
        style={{
          backgroundColor: Colors.bg.secondary,
          borderTopLeftRadius: Radius.xl,
          borderTopRightRadius: Radius.xl,
          padding: Spacing.lg,
          paddingBottom: Spacing.xl,
          gap: Spacing.sm,
        }}
      >
        <View style={{ alignItems: 'center', marginBottom: Spacing.sm }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border.default }} />
        </View>
        <Text
          style={{
            color: Colors.text.primary,
            fontSize: FontSize.lg,
            fontWeight: FontWeight.bold,
            textAlign: 'center',
            marginBottom: Spacing.xs,
          }}
        >
          Choose a photo
        </Text>
        <Text
          style={{
            color: Colors.text.tertiary,
            fontSize: FontSize.sm,
            textAlign: 'center',
            marginBottom: Spacing.md,
          }}
        >
          {Platform.OS === 'web'
            ? 'Your browser will ask permission to use the camera or photos.'
            : 'Your device will ask permission to use the camera or photo library.'}
        </Text>

        <SheetButton
          label="Take Photo"
          icon="📷"
          onPress={() => handlePick('camera')}
          disabled={busy}
        />
        <SheetButton
          label="Choose from Library"
          icon="🖼️"
          onPress={() => handlePick('library')}
          disabled={busy}
        />
        {showRemove && onRemove && (
          <SheetButton
            label="Remove Photo"
            icon="🗑️"
            destructive
            onPress={() => {
              onRemove();
              onClose();
            }}
            disabled={busy}
          />
        )}
        <SheetButton label="Cancel" onPress={close} disabled={busy} muted />

        {busy && (
          <View style={{ alignItems: 'center', paddingTop: Spacing.sm }}>
            <ActivityIndicator color={Colors.brand.primary} />
          </View>
        )}
        {error ? (
          <Text style={{ color: Colors.market.loss, fontSize: FontSize.sm, textAlign: 'center' }}>
            ⚠️ {error}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (!visible) return null;

  if (embedded) {
    return (
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: 1000,
          elevation: 1000,
        }}
      >
        {sheetContent}
      </View>
    );
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      {sheetContent}
    </Modal>
  );
}

function SheetButton({
  label,
  icon,
  onPress,
  disabled,
  destructive,
  muted,
}: {
  label: string;
  icon?: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
  muted?: boolean;
}) {
  const bg = destructive
    ? Colors.market.loss + '22'
    : muted
      ? 'transparent'
      : Colors.bg.tertiary;
  const color = destructive
    ? Colors.market.loss
    : muted
      ? Colors.text.tertiary
      : Colors.text.primary;
  const border = destructive ? Colors.market.loss + '55' : Colors.border.default;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={{
        backgroundColor: bg,
        borderRadius: Radius.lg,
        borderWidth: muted ? 0 : 1,
        borderColor: border,
        paddingVertical: 14,
        paddingHorizontal: Spacing.base,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {icon ? <Text style={{ fontSize: 18 }}>{icon}</Text> : null}
      <Text style={{ color, fontSize: FontSize.base, fontWeight: FontWeight.bold }}>{label}</Text>
    </TouchableOpacity>
  );
}
