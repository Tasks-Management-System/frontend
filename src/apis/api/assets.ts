import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../apiService";
import { apiPath } from "../apiPath";
import type {
  Asset,
  AssetsListResponse,
  AssetCondition,
  AssetStatus,
} from "../../types/asset.types";

export type AssetFilters = {
  status?: AssetStatus;
  assignedTo?: string;
};

export function useAssets(filters: AssetFilters = {}, orgContext?: string) {
  return useQuery({
    queryKey: ["assets", filters, orgContext],
    queryFn: () =>
      api.get<AssetsListResponse>(apiPath.assets.list, {
        auth: true,
        query: { ...(filters as Record<string, string>), ...(orgContext ? { orgContext } : {}) },
      }),
    select: (data) => data.assets,
  });
}

export function useAssetById(id: string | null) {
  return useQuery({
    queryKey: ["asset", id],
    queryFn: () =>
      api.get<{ success: boolean; asset: Asset }>(`${apiPath.assets.byId}${id}`, { auth: true }),
    enabled: !!id,
    select: (data) => data.asset,
  });
}

export type CreateAssetInput = {
  name: string;
  type: string;
  serialNumber?: string;
  notes?: string;
  conditionOnHandover?: AssetCondition;
};

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAssetInput) =>
      api.post<{ success: boolean; asset: Asset }>(apiPath.assets.create, body, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets"] }),
  });
}

export type UpdateAssetInput = Partial<CreateAssetInput> & {
  status?: AssetStatus;
  returnDate?: string | null;
};

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateAssetInput }) =>
      api.put<{ success: boolean; asset: Asset }>(`${apiPath.assets.byId}${id}`, body, {
        auth: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["asset"] });
    },
  });
}

export function useAssignAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      userId,
      condition,
      note,
    }: {
      id: string;
      userId: string;
      condition?: string;
      note?: string;
    }) =>
      api.patch<{ success: boolean; asset: Asset }>(
        `${apiPath.assets.byId}${id}/assign`,
        { userId, condition, note },
        { auth: true }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["asset"] });
    },
  });
}

export function useReturnAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, condition, note }: { id: string; condition?: string; note?: string }) =>
      api.patch<{ success: boolean; asset: Asset }>(
        `${apiPath.assets.byId}${id}/return`,
        { condition, note },
        { auth: true }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["asset"] });
    },
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`${apiPath.assets.byId}${id}`, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets"] }),
  });
}
