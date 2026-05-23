import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Stored avatar photos are resized to MAX_DIM × MAX_DIM JPEGs so the encoded
// data URL fits comfortably inside a Firestore document (1 MiB hard limit).
const MAX_DIM = 256;
const JPEG_QUALITY = 0.75;

export type AvatarSource = 'camera' | 'library';

async function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not decode image'));
      img.onload = () => {
        try {
          // Centre-crop to a square, then scale down to MAX_DIM.
          const side = Math.min(img.width, img.height);
          const sx = (img.width - side) / 2;
          const sy = (img.height - side) / 2;
          const target = Math.min(MAX_DIM, side);
          const canvas = document.createElement('canvas');
          canvas.width = target;
          canvas.height = target;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas unavailable'));
            return;
          }
          ctx.drawImage(img, sx, sy, side, side, 0, 0, target, target);
          resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
        } catch (e) {
          reject(e instanceof Error ? e : new Error('Image processing failed'));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Open the device's native file/photo picker. `source: 'library'` opens the
 * regular file dialog on web or the OS photo picker on native. `source:
 * 'camera'` opens a live browser preview on web, and the system camera UI on
 * iOS/Android.
 */
export async function pickAvatarPhoto(source: AvatarSource): Promise<string | null> {
  if (Platform.OS !== 'web') {
    return pickNativePhoto(source);
  }

  if (typeof document === 'undefined') {
    throw new Error('Photo upload is not available in this environment.');
  }

  if (source === 'camera') {
    return captureFromCamera();
  }
  return pickFromFileDialog();
}

async function pickNativePhoto(source: AvatarSource): Promise<string | null> {
  const permission = source === 'camera'
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error(
      source === 'camera'
        ? 'Camera permission is needed to take a profile photo. Enable Camera access in Settings and try again.'
        : 'Photo library permission is needed to choose a profile photo. Enable Photos access in Settings and try again.'
    );
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: JPEG_QUALITY,
    base64: true,
  };

  const result = source === 'camera'
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled) return null;

  const asset = result.assets?.[0];
  if (!asset?.base64) {
    throw new Error('Could not read the selected photo. Please try another.');
  }

  return `data:image/jpeg;base64,${asset.base64}`;
}

function pickFromFileDialog(): Promise<string | null> {
  return new Promise<string | null>((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.top = '-9999px';

    let settled = false;
    const cleanup = () => {
      if (input.parentNode) input.parentNode.removeChild(input);
      window.removeEventListener('focus', onFocus);
    };
    const finish = (val: string | null) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(val);
    };

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        finish(null);
        return;
      }
      try {
        const dataUrl = await fileToCompressedDataUrl(file);
        if (!settled) {
          settled = true;
          cleanup();
          resolve(dataUrl);
        }
      } catch (e) {
        if (!settled) {
          settled = true;
          cleanup();
          reject(e instanceof Error ? e : new Error('Could not load the photo.'));
        }
      }
    };

    const onFocus = () => {
      setTimeout(() => {
        if (!input.files || input.files.length === 0) finish(null);
      }, 300);
    };
    window.addEventListener('focus', onFocus);

    document.body.appendChild(input);
    input.click();
  });
}

async function captureFromCamera(): Promise<string | null> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Your browser doesn't support camera access. Try 'Choose from Library' instead.");
  }
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    throw new Error("This page isn't on a secure origin. Open it on https:// or http://localhost to use the camera.");
  }

  return new Promise<string | null>((resolve) => {
    // ─── Centred overlay shell ─────────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Camera capture');
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      backgroundColor: 'rgba(0,0,0,0.88)',
      zIndex: '99999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    } as CSSStyleDeclaration);

    // Card centred in the viewport so the "request" is impossible to miss.
    const card = document.createElement('div');
    Object.assign(card.style, {
      backgroundColor: '#111827',
      borderRadius: '20px',
      border: '1px solid #1E2940',
      padding: '24px',
      width: 'min(92vw, 420px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      boxShadow: '0 30px 90px rgba(0,0,0,0.5)',
    } as CSSStyleDeclaration);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    let stream: MediaStream | null = null;
    const cleanup = () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };
    const close = (value: string | null) => {
      cleanup();
      resolve(value);
    };

    // ─── Step 1: in-app request dialog ─────────────────────────────────────
    const renderRequest = () => {
      card.innerHTML = '';

      const icon = document.createElement('div');
      icon.textContent = '📷';
      icon.style.fontSize = '48px';

      const title = document.createElement('div');
      title.textContent = 'Use camera for your photo?';
      Object.assign(title.style, {
        color: '#F1F5F9',
        fontSize: '20px',
        fontWeight: '700',
        textAlign: 'center',
      } as CSSStyleDeclaration);

      const body = document.createElement('div');
      body.textContent =
        'Rookie Markets would like to use your camera to take a profile photo. Click Allow to continue — your browser may also ask to confirm.';
      Object.assign(body.style, {
        color: '#94A3B8',
        fontSize: '14px',
        lineHeight: '1.45',
        textAlign: 'center',
      } as CSSStyleDeclaration);

      const row = document.createElement('div');
      Object.assign(row.style, {
        display: 'flex',
        gap: '12px',
        marginTop: '8px',
        width: '100%',
      } as CSSStyleDeclaration);
      const denyBtn = makeButton("Don't Allow", '#1A2235', '#F1F5F9');
      const allowBtn = makeButton('Allow Camera', '#00B3E6', '#ffffff');
      denyBtn.style.flex = '1';
      allowBtn.style.flex = '1';
      row.appendChild(denyBtn);
      row.appendChild(allowBtn);

      card.appendChild(icon);
      card.appendChild(title);
      card.appendChild(body);
      card.appendChild(row);

      denyBtn.onclick = () => close(null);
      allowBtn.onclick = () => {
        // getUserMedia must be called within a user-gesture, so we invoke it
        // synchronously from this click handler.
        renderRequesting();
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: false })
          .then((s) => {
            stream = s;
            renderCapture();
          })
          .catch((e) => renderError(e));
      };

      // Default focus on Allow so Enter accepts.
      setTimeout(() => allowBtn.focus(), 0);
    };

    // ─── Step 2a: while the browser is deciding ────────────────────────────
    const renderRequesting = () => {
      card.innerHTML = '';

      const spinner = document.createElement('div');
      Object.assign(spinner.style, {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: '3px solid #1E2940',
        borderTopColor: '#00B3E6',
        animation: 'avp-spin 0.9s linear infinite',
      } as CSSStyleDeclaration);

      const style = document.createElement('style');
      style.textContent = '@keyframes avp-spin { to { transform: rotate(360deg); } }';
      card.appendChild(style);

      const label = document.createElement('div');
      label.textContent = 'Requesting camera access…';
      Object.assign(label.style, {
        color: '#F1F5F9',
        fontSize: '16px',
        fontWeight: '600',
        textAlign: 'center',
      } as CSSStyleDeclaration);

      const hint = document.createElement('div');
      hint.textContent = 'If your browser shows a permission prompt, click Allow.';
      Object.assign(hint.style, {
        color: '#94A3B8',
        fontSize: '13px',
        textAlign: 'center',
      } as CSSStyleDeclaration);

      card.appendChild(spinner);
      card.appendChild(label);
      card.appendChild(hint);
    };

    // ─── Step 2b: permission denied / failed ──────────────────────────────
    const renderError = async (e: any) => {
      let message: string;
      if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
        let alreadyBlocked = false;
        try {
          const perms: any = (navigator as any).permissions;
          if (perms?.query) {
            const s = await perms.query({ name: 'camera' as PermissionName });
            alreadyBlocked = s.state === 'denied';
          }
        } catch { /* permissions API unavailable */ }
        message = alreadyBlocked
          ? "Camera is blocked for this site. Click the camera/🔒 icon next to the address bar, set Camera to Allow, then reload and try again."
          : 'Camera permission was not granted.';
      } else if (e?.name === 'NotFoundError' || e?.name === 'DevicesNotFoundError') {
        message = "No camera found on this device. Try 'Choose from Library' instead.";
      } else if (e?.name === 'NotReadableError' || e?.name === 'TrackStartError') {
        message = 'Another app is using the camera. Close it and try again.';
      } else {
        message = 'Could not start the camera. ' + (e?.message || '');
      }

      card.innerHTML = '';

      const icon = document.createElement('div');
      icon.textContent = '⚠️';
      icon.style.fontSize = '40px';

      const title = document.createElement('div');
      title.textContent = 'Camera unavailable';
      Object.assign(title.style, {
        color: '#F1F5F9',
        fontSize: '18px',
        fontWeight: '700',
        textAlign: 'center',
      } as CSSStyleDeclaration);

      const body = document.createElement('div');
      body.textContent = message;
      Object.assign(body.style, {
        color: '#FCA5A5',
        fontSize: '14px',
        lineHeight: '1.45',
        textAlign: 'center',
      } as CSSStyleDeclaration);

      const okBtn = makeButton('OK', '#1A2235', '#F1F5F9');
      okBtn.style.minWidth = '120px';
      okBtn.onclick = () => close(null);

      card.appendChild(icon);
      card.appendChild(title);
      card.appendChild(body);
      card.appendChild(okBtn);
    };

    // ─── Step 3: live preview + capture ────────────────────────────────────
    const renderCapture = () => {
      card.innerHTML = '';

      const title = document.createElement('div');
      title.textContent = 'Take a photo';
      Object.assign(title.style, {
        color: '#F1F5F9',
        fontSize: '20px',
        fontWeight: '700',
      } as CSSStyleDeclaration);

      const videoWrap = document.createElement('div');
      Object.assign(videoWrap.style, {
        position: 'relative',
        width: 'min(72vmin, 320px)',
        aspectRatio: '1 / 1',
        borderRadius: '50%',
        overflow: 'hidden',
        backgroundColor: '#111827',
        border: '3px solid #00B3E6',
      } as CSSStyleDeclaration);

      const video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      Object.assign(video.style, {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: 'scaleX(-1)',
      } as CSSStyleDeclaration);
      video.srcObject = stream;
      videoWrap.appendChild(video);

      const row = document.createElement('div');
      Object.assign(row.style, {
        display: 'flex',
        gap: '12px',
        marginTop: '8px',
      } as CSSStyleDeclaration);
      const cancelBtn = makeButton('Cancel', '#1A2235', '#F1F5F9');
      const captureBtn = makeButton('Capture', '#00B3E6', '#ffffff');
      row.appendChild(cancelBtn);
      row.appendChild(captureBtn);

      card.appendChild(title);
      card.appendChild(videoWrap);
      card.appendChild(row);

      cancelBtn.onclick = () => close(null);
      captureBtn.onclick = () => {
        const w = video.videoWidth || 480;
        const h = video.videoHeight || 480;
        const side = Math.min(w, h);
        const sx = (w - side) / 2;
        const sy = (h - side) / 2;
        const target = Math.min(MAX_DIM, side);
        const canvas = document.createElement('canvas');
        canvas.width = target;
        canvas.height = target;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          close(null);
          return;
        }
        ctx.save();
        ctx.translate(target, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, sx, sy, side, side, 0, 0, target, target);
        ctx.restore();
        close(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
    };

    renderRequest();
  });
}

function makeButton(label: string, bg: string, fg: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  Object.assign(btn.style, {
    backgroundColor: bg,
    color: fg,
    border: 'none',
    borderRadius: '12px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    minWidth: '120px',
  } as CSSStyleDeclaration);
  return btn;
}
