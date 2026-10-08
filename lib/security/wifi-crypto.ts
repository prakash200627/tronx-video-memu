import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const KEY_BYTES = 32;
const IV_BYTES = 12;

function getEncryptionKey() {
  const encoded = process.env.WIFI_ENCRYPTION_KEY;
  if (!encoded) throw new Error("Wi-Fi encryption is not configured on the server.");

  const key = Buffer.from(encoded, "base64");
  if (key.length !== KEY_BYTES || key.toString("base64") !== encoded) {
    throw new Error("Wi-Fi encryption is not configured on the server.");
  }
  return key;
}

export function encryptWifiPassword(password: string) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(password, "utf8"), cipher.final()]);
  return {
    passwordCiphertext: ciphertext.toString("base64url"),
    passwordIv: iv.toString("base64url"),
    passwordAuthTag: cipher.getAuthTag().toString("base64url"),
  };
}

export function decryptWifiPassword(input: {
  passwordCiphertext: string;
  passwordIv: string;
  passwordAuthTag: string;
}) {
  const iv = Buffer.from(input.passwordIv, "base64url");
  const authTag = Buffer.from(input.passwordAuthTag, "base64url");
  if (iv.length !== IV_BYTES || authTag.length !== 16) {
    throw new Error("Stored Wi-Fi credentials are invalid.");
  }

  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(input.passwordCiphertext, "base64url")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
