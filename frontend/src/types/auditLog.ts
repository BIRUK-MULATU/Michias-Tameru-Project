export interface AuditLogResponse {
  id: string;
  userId: string | null;
  username: string | null;
  userRole: string | null;
  actionType: string;
  module: string;
  description: string | null;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  success: boolean;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
