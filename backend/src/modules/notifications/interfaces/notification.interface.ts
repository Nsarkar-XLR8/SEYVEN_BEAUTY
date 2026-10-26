export enum NotificationChannel {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
}

export enum NotificationStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  SUPPRESSED_QUIET_HOURS = 'SUPPRESSED_QUIET_HOURS',
}
