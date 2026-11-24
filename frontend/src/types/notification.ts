export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  message: string;
  referenceType: string | null;
  referenceId: string | null;
  read: boolean;
  createdAt: string;
}
