import type { Media } from "@/types";
import type { IMediaRepository } from "./types";
import { connectToDatabase } from "@/lib/db/mongodb";
import { MediaModel } from "@/lib/db/models";
import { toDomain } from "@/lib/db/mongo-mappers";

export class MediaRepository implements IMediaRepository {
  async findByRestaurantId(restaurantId: string): Promise<Media[]> {
    await connectToDatabase();
    const media = await MediaModel.find({ restaurantId }).lean();
    return media.map((item) => toDomain<Media>(item));
  }

  async findById(id: string): Promise<Media | null> {
    await connectToDatabase();
    const media = await MediaModel.findOne({ id }).lean();
    return media ? toDomain<Media>(media) : null;
  }

  async create(
    data: Omit<Media, "id" | "createdAt" | "updatedAt">,
  ): Promise<Media> {
    await connectToDatabase();
    const now = new Date().toISOString();
    const id = `media-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newMedia = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    const created = await MediaModel.create(newMedia);
    return toDomain<Media>(created.toObject());
  }

  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await MediaModel.deleteOne({ id });
    return result.deletedCount === 1;
  }
}

export const mediaRepository = new MediaRepository();
