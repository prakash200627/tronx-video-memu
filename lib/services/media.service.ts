import { mediaRepository } from "@/lib/repositories/media.repository";
import type { Media } from "@/types";

export class MediaService {
  async getByRestaurantId(restaurantId: string): Promise<Media[]> {
    return mediaRepository.findByRestaurantId(restaurantId);
  }

  async getById(id: string): Promise<Media | null> {
    return mediaRepository.findById(id);
  }

  async createRecord(data: Omit<Media, "id" | "createdAt" | "updatedAt">): Promise<Media> {
    return mediaRepository.create(data);
  }

  async delete(id: string): Promise<boolean> {
    return mediaRepository.delete(id);
  }
}

export const mediaService = new MediaService();
