import type { Addon, AddonGroup } from "@/types";
import type { IAddonRepository } from "./types";
import { connectToDatabase } from "@/lib/db/mongodb";
import { AddonGroupModel, AddonModel, DishModel } from "@/lib/db/models";
import { toDomain } from "@/lib/db/mongo-mappers";

export class AddonRepository implements IAddonRepository {
  async findGroupsByRestaurantId(restaurantId: string): Promise<AddonGroup[]> {
    await connectToDatabase();
    const groups = await AddonGroupModel.find({ restaurantId })
      .sort({ sortOrder: 1 })
      .lean();
    const addons = await AddonModel.find({
      addonGroupId: { $in: groups.map((group) => group.id) },
    })
      .sort({ sortOrder: 1 })
      .lean();
    const addonsByGroup = new Map<string, Addon[]>();

    for (const addon of addons) {
      const groupAddons = addonsByGroup.get(addon.addonGroupId) ?? [];
      groupAddons.push(toDomain<Addon>(addon));
      addonsByGroup.set(addon.addonGroupId, groupAddons);
    }

    return groups.map((group) => ({
      ...toDomain<Omit<AddonGroup, "addons">>(group),
      addons: addonsByGroup.get(group.id) ?? [],
    }));
  }

  async findGroupById(id: string): Promise<AddonGroup | null> {
    await connectToDatabase();
    const group = await AddonGroupModel.findOne({ id }).lean();
    if (!group) return null;

    const addons = await AddonModel.find({ addonGroupId: group.id })
      .sort({ sortOrder: 1 })
      .lean();
    return {
      ...toDomain<Omit<AddonGroup, "addons">>(group),
      addons: addons.map((addon) => toDomain<Addon>(addon)),
    };
  }

  async createGroup(
    data: Omit<AddonGroup, "id" | "addons" | "createdAt" | "updatedAt">,
  ): Promise<AddonGroup> {
    await connectToDatabase();
    const now = new Date().toISOString();
    const id = `addon-group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newGroup = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    const created = await AddonGroupModel.create(newGroup);
    return { ...toDomain<AddonGroup>(created.toObject()), addons: [] };
  }

  async updateGroup(
    id: string,
    data: Partial<AddonGroup>,
  ): Promise<AddonGroup | null> {
    await connectToDatabase();
    const { addons: _ignoredAddons, ...groupData } = data;
    const updated = await AddonGroupModel.findOneAndUpdate(
      { id },
      { $set: { ...groupData, id, updatedAt: new Date().toISOString() } },
      { new: true, runValidators: true },
    ).lean();
    if (!updated) return null;
    return this.findGroupById(id);
  }

  async deleteGroup(id: string): Promise<boolean> {
    await connectToDatabase();
    const group = await AddonGroupModel.findOne({ id }).lean();
    if (!group) return false;

    await DishModel.updateMany(
      { addonGroupIds: id },
      { $pull: { addonGroupIds: id } },
    );
    await AddonModel.deleteMany({ addonGroupId: id });
    const result = await AddonGroupModel.deleteOne({ id });
    return result.deletedCount === 1;
  }

  async findAddonsByGroupId(groupId: string): Promise<Addon[]> {
    await connectToDatabase();
    const addons = await AddonModel.find({ addonGroupId: groupId })
      .sort({ sortOrder: 1 })
      .lean();
    return addons.map((addon) => toDomain<Addon>(addon));
  }

  async findAddonById(id: string): Promise<Addon | null> {
    await connectToDatabase();
    const addon = await AddonModel.findOne({ id }).lean();
    return addon ? toDomain<Addon>(addon) : null;
  }

  async createAddon(
    data: Omit<Addon, "id" | "createdAt" | "updatedAt">,
  ): Promise<Addon> {
    await connectToDatabase();
    const now = new Date().toISOString();
    const id = `addon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newAddon = {
      ...data,
      id,
      isActive: data.isActive ?? true,
      isAvailable: data.isAvailable ?? true,
      createdAt: now,
      updatedAt: now,
    };
    const created = await AddonModel.create(newAddon);
    return toDomain<Addon>(created.toObject());
  }

  async updateAddon(id: string, data: Partial<Addon>): Promise<Addon | null> {
    await connectToDatabase();
    const { addonGroupId: _ignoredGroupId, ...addonData } = data;
    const updated = await AddonModel.findOneAndUpdate(
      { id },
      { $set: { ...addonData, id, updatedAt: new Date().toISOString() } },
      { new: true, runValidators: true },
    ).lean();
    return updated ? toDomain<Addon>(updated) : null;
  }

  async deleteAddon(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await AddonModel.deleteOne({ id });
    return result.deletedCount === 1;
  }
}

export const addonRepository = new AddonRepository();
