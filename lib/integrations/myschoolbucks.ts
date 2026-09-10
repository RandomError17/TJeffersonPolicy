/**
 * MySchoolBucks — outbound links only.
 *
 * FCPS collects student payments through MySchoolBucks (Heartland). It is a
 * payment processor with no public integration API for a club site, and there
 * is no version of this application that should be nearer to a card number
 * than a hyperlink. Members pay there; officers record the outcome here.
 *
 * The store URL differs per school and per item, so it is a club setting
 * (`links.myschoolbucks`) and an optional per-item `externalUrl`, not a
 * constant.
 */

export const MYSCHOOLBUCKS_HOME = "https://www.myschoolbucks.com/";

/** Prefer the item's own link, then the club default, then the generic site. */
export function paymentUrl(itemUrl: string | null | undefined, clubUrl: string | null | undefined): string {
  return itemUrl || clubUrl || MYSCHOOLBUCKS_HOME;
}

export const NSDA_MEMBERSHIP_INFO = "https://www.speechanddebate.org/join/";
