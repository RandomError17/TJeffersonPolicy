/**
 * Officer-editable club settings.
 *
 * Anything an officer might reasonably want to change without a deploy lives
 * here rather than in the source tree. Defaults come from the content carried
 * over from the previous site (lib/content/club.ts).
 */
import { prisma } from "../db";
import { CLUB, EXTERNAL_LINKS, PUBLISHED_FIGURES, SOCIALS } from "../content/club";
import { env } from "../env";

export const SETTING_DEFAULTS = {
  "club.email": CLUB.email,
  "club.addressLine1": CLUB.addressLine1,
  "club.addressLine2": CLUB.addressLine2,
  "social.instagram": SOCIALS.instagram.url,
  "social.facebook": SOCIALS.facebook.url,
  "social.discord": SOCIALS.discord.url,
  "links.calendarEmbed": EXTERNAL_LINKS.googleCalendarEmbed,
  "links.lectureSlides": EXTERNAL_LINKS.lectureSlidesFolderOpen,
  "links.myschoolbucks": env.MYSCHOOLBUCKS_URL,
  "figures.activeDebaters": PUBLISHED_FIGURES.activeDebaters,
  "figures.tournamentsPerYear": PUBLISHED_FIGURES.tournamentsPerYear,
  "dues.instructions":
    "Dues are collected through MySchoolBucks. What you owe is the total of your tournament entry fees and orders for the season — pay that, then an officer will mark your status as paid here, usually within a few days.",
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type ClubSettings = Record<SettingKey, string>;

/** Read every setting, falling back to the compiled-in default per key. */
export async function getSettings(): Promise<ClubSettings> {
  const rows = await prisma.clubSetting.findMany();
  const stored = new Map(rows.map((row) => [row.key, row.value]));
  const result = {} as ClubSettings;
  for (const key of Object.keys(SETTING_DEFAULTS) as SettingKey[]) {
    result[key] = stored.get(key) ?? SETTING_DEFAULTS[key];
  }
  return result;
}

export async function updateSettings(values: Record<string, string>): Promise<string[]> {
  const allowed = new Set(Object.keys(SETTING_DEFAULTS));
  const changed: string[] = [];

  await prisma.$transaction(
    Object.entries(values)
      .filter(([key]) => allowed.has(key))
      .map(([key, value]) => {
        changed.push(key);
        return prisma.clubSetting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        });
      }),
  );

  return changed;
}
