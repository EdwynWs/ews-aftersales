import { z } from "zod";
export function validCnpj(value: string) {
  const v = value.replace(/[.\-/\s]/g, "").toUpperCase();
  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(v) || /^(.)\1+$/.test(v)) return false;
  const digit = (base: string) => {
    let weight = 2,
      sum = 0;
    for (let i = base.length - 1; i >= 0; i--) {
      sum += (base.charCodeAt(i) - 48) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    const n = sum % 11;
    return n < 2 ? 0 : 11 - n;
  };
  return digit(v.slice(0, 12)) === +v[12] && digit(v.slice(0, 13)) === +v[13];
}
export const email = z
  .email()
  .max(254)
  .transform((x) => x.toLowerCase().trim());
export const password = z
  .string()
  .min(12, "Use pelo menos 12 caracteres.")
  .max(128);
export const signupSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email,
    password,
    company: z.string().trim().min(2).max(180),
    cnpj: z
      .string()
      .transform((v) => v.replace(/[.\-/\s]/g, "").toUpperCase())
      .refine(validCnpj, "CNPJ inválido."),
    phone: z.string().regex(/^\+?[0-9 ()-]{10,22}$/),
    plan: z.enum(["start", "growth", "industry"]),
    terms: z.literal(true),
  })
  .strict();
export const brandSchema = z
  .object({
    brandName: z.string().trim().min(2).max(100),
    brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    supportEmail: email,
    supportPhone: z.string().min(10).max(22),
    hours: z.string().trim().min(2).max(160),
  })
  .strict();
export const roleSchema = z.enum([
  "admin",
  "commercial",
  "support",
  "technician",
]);
