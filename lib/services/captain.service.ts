import { captainRepository } from "@/lib/repositories/captain.repository";
import { hashCaptainPassword, verifyCaptainPassword } from "@/lib/security/captain-password";
import type { Captain, CaptainView } from "@/types";

const publicCaptain = (captain: Captain): CaptainView => {
  const safeCaptain: Partial<Captain> = { ...captain };
  delete safeCaptain.passwordHash;
  return safeCaptain as CaptainView;
};

export class CaptainService {
  getById(id: string) {
    return captainRepository.findById(id);
  }

  async authenticate(restaurantId: string, email: string, password: string) {
    const captain = await captainRepository.findByRestaurantAndEmail(restaurantId, email.trim().toLowerCase());
    if (!captain || !captain.isActive || !(await verifyCaptainPassword(password, captain.passwordHash))) return null;
    return captain;
  }

  async list(restaurantId: string) {
    return (await captainRepository.findByRestaurantId(restaurantId)).map(publicCaptain);
  }

  async create(restaurantId: string, input: { name: string; email: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    const existing = await captainRepository.findByRestaurantAndEmail(restaurantId, email);
    if (existing) throw new Error("A Captain with this email already exists for this restaurant.");
    const captain = await captainRepository.create({
      restaurantId,
      name: input.name.trim(),
      email,
      passwordHash: await hashCaptainPassword(input.password),
      isActive: true,
    });
    return publicCaptain(captain);
  }

  async setActive(restaurantId: string, id: string, isActive: boolean) {
    const captain = await captainRepository.updateForRestaurant(restaurantId, id, { isActive });
    return captain ? publicCaptain(captain) : null;
  }

  async resetPassword(restaurantId: string, id: string, password: string) {
    const captain = await captainRepository.updateForRestaurant(restaurantId, id, { passwordHash: await hashCaptainPassword(password) });
    return captain ? publicCaptain(captain) : null;
  }
}

export const captainService = new CaptainService();
