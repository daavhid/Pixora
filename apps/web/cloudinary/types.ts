export interface CloudinaryResource {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: 'image' | 'video' | 'raw';
  created_at: string;
  bytes: number;
  type: string;
  url: string;
  secure_url: string;
  folder: string;
  access_mode: string;
  [key: string]: any; // For extra dynamic fields
}