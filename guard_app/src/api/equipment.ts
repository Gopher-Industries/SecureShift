import http from '../lib/http';

export type EquipmentStatus = 'ACTIVE' | 'DAMAGED' | 'LOST';

export type EquipmentItem = {
  _id: string;
  name: string;
  status: EquipmentStatus;
  assignedTo?:
    | {
        _id: string;
        name?: string;
        email?: string;
        role?: string;
      }
    | string
    | null;
};

type EquipmentListResponse = {
  count: number;
  equipment: EquipmentItem[];
};

type EquipmentReportResponse = {
  message: string;
  equipment: EquipmentItem;
};

export async function getAssignedEquipment(guardId: string) {
  const { data } = await http.get<EquipmentListResponse>(`/equipment/guard/${guardId}`);
  return data.equipment ?? [];
}

export async function reportEquipmentFault(equipmentId: string, status: EquipmentStatus) {
  const { data } = await http.patch<EquipmentReportResponse>(`/equipment/${equipmentId}/report`, {
    status,
  });

  return data;
}
