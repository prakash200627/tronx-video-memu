import { addonRepository } from "@/lib/repositories/addon.repository";
import { restaurantRepository } from "@/lib/repositories/restaurant.repository";
import type { Addon, AddonGroup } from "@/types";
import type {
  CreateAddonGroupInput,
  UpdateAddonGroupInput,
  CreateAddonInput,
  UpdateAddonInput,
} from "@/lib/validations";

export class AddonService {
  async getGroupsByRestaurantId(restaurantId: string): Promise<AddonGroup[]> {
    return addonRepository.findGroupsByRestaurantId(restaurantId);
  }

  async getGroupById(id: string): Promise<AddonGroup | null> {
    return addonRepository.findGroupById(id);
  }

  async createGroup(input: CreateAddonGroupInput): Promise<AddonGroup> {
    const restaurant = await restaurantRepository.findById(input.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    return addonRepository.createGroup(input);
  }

  async updateGroup(
    id: string,
    input: UpdateAddonGroupInput,
  ): Promise<AddonGroup | null> {
    return addonRepository.updateGroup(id, input);
  }

  async deleteGroup(id: string): Promise<boolean> {
    return addonRepository.deleteGroup(id);
  }

  async getAddonsByGroupId(groupId: string): Promise<Addon[]> {
    return addonRepository.findAddonsByGroupId(groupId);
  }

  async getAddonById(id: string): Promise<Addon | null> {
    return addonRepository.findAddonById(id);
  }

  async createAddon(input: CreateAddonInput): Promise<Addon> {
    const group = await addonRepository.findGroupById(input.addonGroupId);
    if (!group) {
      throw new Error("Add-on group not found");
    }
    return addonRepository.createAddon(input);
  }

  async updateAddon(
    id: string,
    input: UpdateAddonInput,
  ): Promise<Addon | null> {
    return addonRepository.updateAddon(id, input);
  }

  async deleteAddon(id: string): Promise<boolean> {
    return addonRepository.deleteAddon(id);
  }
}

export const addonService = new AddonService();
