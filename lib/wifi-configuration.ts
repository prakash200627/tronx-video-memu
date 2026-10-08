import type { RestaurantWifiConfiguration } from "@/types";

type EncryptedWifiPassword = {
  passwordCiphertext: string;
  passwordIv: string;
  passwordAuthTag: string;
};

type WifiPasswordInput = {
  ssid: string;
  security: RestaurantWifiConfiguration["security"];
  password?: string;
  clearPassword: boolean;
};

export type WifiCustomerDetails = {
  ssid: string;
  security: RestaurantWifiConfiguration["security"];
  password?: string;
};

function hasEncryptedPassword(
  wifi?: RestaurantWifiConfiguration,
): wifi is RestaurantWifiConfiguration & Required<EncryptedWifiPassword> {
  return Boolean(wifi?.passwordCiphertext && wifi.passwordIv && wifi.passwordAuthTag);
}

export function resolveWifiConfigurationUpdate(
  current: RestaurantWifiConfiguration | undefined,
  input: WifiPasswordInput,
  encryptPassword: (password: string) => EncryptedWifiPassword,
): RestaurantWifiConfiguration {
  if (input.security === "OPEN") {
    return { ssid: input.ssid, security: "OPEN" };
  }

  if (input.clearPassword) {
    return { ssid: input.ssid, security: input.security };
  }

  const passwordProvided = typeof input.password === "string" && input.password.trim().length > 0;
  if (passwordProvided) {
    return { ssid: input.ssid, security: input.security, ...encryptPassword(input.password!) };
  }

  if (current?.security !== "OPEN" && hasEncryptedPassword(current)) {
    return {
      ssid: input.ssid,
      security: input.security,
      passwordCiphertext: current.passwordCiphertext,
      passwordIv: current.passwordIv,
      passwordAuthTag: current.passwordAuthTag,
    };
  }

  throw new Error("Enter a password for this secured Wi-Fi network.");
}

export function getWifiCustomerDetails(
  wifi: RestaurantWifiConfiguration | undefined,
  decryptPassword: (password: EncryptedWifiPassword) => string,
): WifiCustomerDetails | null {
  if (!wifi?.ssid) return null;
  const password = hasEncryptedPassword(wifi) ? decryptPassword(wifi) : undefined;
  return { ssid: wifi.ssid, security: wifi.security, ...(password !== undefined ? { password } : {}) };
}
