export type RequestStatus = "pending" | "accepted" | "rejected";

/** Row shape as stored in the `requests` table (snake_case). */
export type RequestRow = {
  id: string;
  seeker_id: string;
  developer_id: string;
  project_name: string;
  project_description: string;
  is_paid: boolean;
  payment_mode: string | null;
  payment_timing: string | null;
  deadline: string | null;
  work_type: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
};

export const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
};
