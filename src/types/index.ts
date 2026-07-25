/**
 * Types pour l'application JurisFTP
 * Définitions des interfaces pour l'API PISTE et les données juridiques
 */

export interface PisteTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface PisteSearchRequest {
  query: string;
  filters?: {
    dateDebut?: string;
    dateFin?: string;
    id?: string;
    idTexte?: string;
    numTexte?: string;
  };
}

export interface PisteSearchResult {
  id: string;
  title: string;
  nature: string;
  nor: string;
  dateTexte: string;
  url: string;
  etat?: string;
  resume?: string;
}

export interface LegalResult {
  title: string;
  nature: string;
  nor: string;
  dateTexte: string;
  url: string;
  resume?: string;
  etat?: string;
}

export interface LegalResponse {
  summary: string;
  legalBasis: {
    articles: string[];
    source: string;
  };
  conditions?: string[];
  procedures?: string[];
  results?: LegalResult[];
}

export interface FPTFilter {
  excludePrivate: boolean;
  excludeFPE: boolean;
  excludeFPH: boolean;
  includeCGFP: boolean;
}

export interface ExtractedKeywords {
  primaryKeywords: string[];
  secondaryKeywords: string[];
  legalDomain: string;
  fptRelevant: boolean;
}
