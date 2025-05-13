import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  console.log("Comparing passwords...");
  console.log("Supplied password:", supplied);
  console.log("Stored password format:", stored);

  if (typeof stored !== 'string') {
    console.error("Stored password is not a string. Cannot compare.");
    return false;
  }

  const parts = stored.split(".");
  if (parts.length !== 2) {
    console.error(
      `Stored password format is incorrect. Expected 'hash.salt', but found ${parts.length} part(s). Stored value: "${stored}"`
    );
    return false;
  }

  const [hashed, salt] = parts;

  if (!hashed || !salt) {
    console.error("Hashed password or salt is empty after splitting. Stored:", stored);
    return false;
  }

  try {
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;

    if (hashedBuf.length !== suppliedBuf.length) {
      console.error("Password hash lengths don't match");
      return false;
    }

    const result = timingSafeEqual(hashedBuf, suppliedBuf);
    console.log("Password comparison result:", result);
    return result;
  } catch (error) {
    console.error("Error during password comparison:", error);
    return false;
  }
} 