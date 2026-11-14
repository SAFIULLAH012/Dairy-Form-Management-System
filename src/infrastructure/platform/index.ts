/**
 * Platform Adapters Factory & Registry for Dairy Farm ERP
 * Tailored for Windows Laptop / Desktop (Electron) and Web environment.
 */

import { PlatformAdapters } from './interfaces.ts';
import {
  WebDatabaseAdapter,
  WebNotificationAdapter,
  WebFileStorageAdapter,
  WebCameraAdapter,
  WebBackupAdapter,
  WebShareAdapter,
} from './web/WebAdapters.ts';

let activeAdapters: PlatformAdapters | null = null;

export function getPlatformAdapters(): PlatformAdapters {
  if (activeAdapters) {
    return activeAdapters;
  }

  // Detect whether running in Electron desktop environment or standard browser
  const isElectron =
    typeof window !== 'undefined' &&
    (window.navigator.userAgent.toLowerCase().includes('electron') ||
      (window as any).process?.versions?.electron !== undefined);

  activeAdapters = {
    db: new WebDatabaseAdapter(),
    notifications: new WebNotificationAdapter(),
    storage: new WebFileStorageAdapter(),
    camera: new WebCameraAdapter(),
    backup: new WebBackupAdapter(),
    share: new WebShareAdapter(),
    isNative: false,
    platform: isElectron ? 'desktop' : 'web',
  };

  return activeAdapters;
}
