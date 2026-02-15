// Notification settings per alert category
export interface NotificationSettings {
  visaExpiry: { enabled: boolean; channels: string[]; daysBeforeWarning: number; daysBeforeUrgent: number };
  attendanceLow: { enabled: boolean; channels: string[]; threshold: number };
  fimsDeadline: { enabled: boolean; channels: string[]; daysBeforeWarning: number };
  insuranceExpiry: { enabled: boolean; channels: string[] };
}

// In-memory settings store (per university)
const settingsCache = new Map<string, NotificationSettings>();

const DEFAULT_SETTINGS: NotificationSettings = {
  visaExpiry: { enabled: true, channels: ['IN_APP', 'EMAIL'], daysBeforeWarning: 60, daysBeforeUrgent: 30 },
  attendanceLow: { enabled: true, channels: ['IN_APP'], threshold: 70 },
  fimsDeadline: { enabled: true, channels: ['IN_APP', 'EMAIL'], daysBeforeWarning: 7 },
  insuranceExpiry: { enabled: true, channels: ['IN_APP'] },
};

/**
 * Get notification settings for a university.
 * Returns defaults if no custom settings have been saved.
 */
export const getSettings = (universityId: string): NotificationSettings => {
  return settingsCache.get(universityId) ?? { ...DEFAULT_SETTINGS };
};

/**
 * Update notification settings for a university (partial merge).
 * Returns the updated full settings object.
 */
export const updateSettings = (
  universityId: string,
  partial: Partial<NotificationSettings>,
): NotificationSettings => {
  const current = getSettings(universityId);
  const updated: NotificationSettings = {
    visaExpiry: partial.visaExpiry ?? current.visaExpiry,
    attendanceLow: partial.attendanceLow ?? current.attendanceLow,
    fimsDeadline: partial.fimsDeadline ?? current.fimsDeadline,
    insuranceExpiry: partial.insuranceExpiry ?? current.insuranceExpiry,
  };
  settingsCache.set(universityId, updated);
  return updated;
};

// Dispatch parameters for sending notifications via different channels
interface DispatchParams {
  channel: string;
  to: string;
  subject: string;
  message: string;
}

/**
 * Dispatch a notification via the specified channel.
 * Currently only logs for external channels (EMAIL, KAKAO, SMS).
 * IN_APP alerts are handled directly by the alert engine DB writes.
 */
export const dispatch = async (params: DispatchParams): Promise<void> => {
  switch (params.channel) {
    case 'IN_APP':
      // No-op: already persisted to DB by the alert engine
      break;
    case 'EMAIL':
      // TODO: Integrate with AWS SES for email delivery
      console.log(`[EMAIL] To: ${params.to}, Subject: ${params.subject}`);
      break;
    case 'KAKAO':
      // TODO: Integrate with Kakao BizMessage API
      console.log(`[KAKAO] To: ${params.to}, Message: ${params.message}`);
      break;
    case 'SMS':
      // TODO: Integrate with SMS provider
      console.log(`[SMS] To: ${params.to}, Message: ${params.message}`);
      break;
    default:
      console.warn(`[NOTIFICATION] Unknown channel: ${params.channel}`);
  }
};
