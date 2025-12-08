export type ItemLocation = {
  lat: number;
  lon: number;
  accuracy?: number;
};

export type Item = {
  id: string;
  label: string;
  note?: string;
  photoUri: string;
  createdAt: number;
  location?: ItemLocation;
  roomId?: string;
  roomName?: string;
};
