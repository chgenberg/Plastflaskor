export type CompanyHit = { name: string; line1: string; postalCode: string; city: string };

export interface CompanyLookupService {
  lookup(orgNrDigits: string): Promise<CompanyHit | null>;
}
