export interface AssetUser {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
}

export interface TransferRecord {
  fromUser?: AssetUser | null;
  toUser?: AssetUser | null;
  date: string;
  condition: string;
  note: string;
}

export type AssetCondition = "new" | "good" | "fair" | "poor";
export type AssetStatus = "available" | "assigned" | "under_repair" | "retired";

export interface Asset {
  _id: string;
  name: string;
  type: string;
  serialNumber: string;
  assignedTo?: AssetUser | null;
  assignedDate?: string | null;
  returnDate?: string | null;
  conditionOnHandover: AssetCondition;
  status: AssetStatus;
  transferHistory: TransferRecord[];
  notes: string;
  orgAdmin: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetsListResponse {
  success: boolean;
  assets: Asset[];
}
