/**
 * Service de connexion à l'API PISTE (Légifrance)
 * Effectue les recherches dans le fonds LEGI avec filtres FPT
 * Utilise les crédits stockés dans localStorage par l'utilisateur
 */

import axios from 'axios';
import { pisteAuthService } from './pisteAuthService';
import { PisteSearchRequest, PisteSearchResult } from '@/types';

class PisteApiService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = process.env.PISTE_API_BASE_URL || 'https://api.piste.gouv.fr/dila/legifrance/lf-engine-app';
  }

  /**
   * Récupère l'API Key depuis localStorage
   */
  private getApiKey(): string {
    if (typeof window === 'undefined') {
      return '';
    }

    const savedCreds = localStorage.getItem('pisteCredentials');
    if (!savedCreds) {
      return '';
    }

    const creds = JSON.parse(savedCreds);
    return creds.apiKey || '';
  }

  /**
   * Recherche des textes juridiques dans le fonds LEGI
   * Applique automatiquement les filtres pour la Fonction Publique Territoriale
   */
  async searchLegi(request: PisteSearchRequest): Promise<PisteSearchResult[]> {
    try {
      const token = await pisteAuthService.getAccessToken();

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      const apiKey = this.getApiKey();
      if (apiKey) {
        headers['X-API-KEY'] = apiKey;
      }

      const body = {
        fond: 'LODA_ETAT',  // ← lois/décrets/arrêtés EN VIGUEUR uniquement, exclut KALI/ACCO
        recherche: {
          champs: [
            {
              criteres: [
                {
                  typeRecherche: 'TOUS_LES_MOTS_DANS_UN_CHAMP',
                  valeur: request.query,
                  operateur: 'ET',
                },
              ],
              typeChamp: 'ALL',
              operateur: 'ET',
            },
          ],
          filtres: [
            {
              // Valeurs exactes du Swagger ligne 7604
              valeurs: ['LOI', 'ORDONNANCE', 'DECRET', 'DECRET_LOI', 'ARRETE'],
              facette: 'NATURE',
            },
          ],
          operateur: 'ET',
          typePagination: 'DEFAUT',
          pageNumber: 1,
          pageSize: 10,
          sort: 'PERTINENCE',
        },
      };

      console.log('Sending to PISTE /search:', JSON.stringify(body, null, 2));

      const response = await axios.post(
        `${this.apiBaseUrl}/search`,
        body,
        { headers }
      );

      const rawResults = response.data.results || [];
      console.log('Résultats avant filtre:', rawResults.length);
      console.log('Champs dispo:', Object.keys(response.data?.results?.[0] || {}));

      const mapped = rawResults.map((r: any) => {
        // titles est un tableau d'objets {id, cid, title, ...}
        const titlesArr = Array.isArray(r.titles) ? r.titles : [r.titles];
        const firstTitle = titlesArr[0] || {};
        const rawTitle = typeof firstTitle === 'string'
          ? firstTitle
          : (firstTitle.title || firstTitle.titre || '');
        // Supprime les balises <mark> de surbrillance
        const cleanTitle = rawTitle.replace(/<\/?mark>/g, '');

        // ← Si pas de titre, utilise le champ "text" (extrait du contenu)
        const fallbackText = !cleanTitle && r.text
          ? r.text.replace(/<\/?mark>/g, '').substring(0, 120) + '...'
          : '';

        const cid = firstTitle.cid || firstTitle.id || '';

        return {
          id: r.nor || r.num || cid || '',
          title: cleanTitle || fallbackText || r.nor || '',
          nature: r.nature || r.type || '',
          nor: r.nor || '',
          dateTexte: r.date || r.dateSignature || r.datePublication || '',
          url: cid ? `https://www.legifrance.gouv.fr/eli/id/${cid}` : '',
          etat: r.etat || '',
          resume: r.resumePrincipal || r.autreResume || '',
        };
      });

      return this.filterFPTResults(mapped);
    } catch (error) {
      console.error('Error searching LEGI:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
      }
      throw new Error('Failed to search LEGI database');
    }
  }

  /**
   * Construit les paramètres de recherche pour l'API PISTE
   * Inclut les filtres spécifiques au domaine juridique FPT
   */
  private buildSearchParams(request: PisteSearchRequest): Record<string, string> {
    const params: Record<string, string> = {
      // Fonds LEGI (législation consolidée)
      fonds: 'LEGI',
      // Recherche en texte intégral
      search: request.query,
      // Tri par pertinence
      sort: 'relevance',
    };

    // Ajout de filtres de date si spécifiés
    if (request.filters?.dateDebut) {
      params.dateDebut = request.filters.dateDebut;
    }
    if (request.filters?.dateFin) {
      params.dateFin = request.filters.dateFin;
    }

    // Filtres spécifiques pour cibler le CGFP et les textes FPT
    // Le Code général de la fonction publique est la source principale
    const fptKeywords = this.getFPTKeywords();
    if (fptKeywords.length > 0) {
      params.fields = fptKeywords.join(',');
    }

    return params;
  }

  /**
   * Retourne les mots-clés spécifiques à la FPT pour affiner la recherche
   */
  private getFPTKeywords(): string[] {
    return [
      'CODE GENERAL DE LA FONCTION PUBLIQUE',
      'FONCTION PUBLIQUE TERRITORIALE',
      'COLLECTIVITES TERRITORIALES',
      'COMMUNE',
      'DEPARTEMENT',
      'REGION',
    ];
  }

  /**
   * Filtre strictement les résultats pour ne garder que les textes FPT
   * Exclut: Code du travail, textes FPE/FPH spécifiques
   */
  private filterFPTResults(results: PisteSearchResult[]): PisteSearchResult[] {
    const FPT_INCLUDE = [
      'fonction publique territoriale',
      'collectivités territoriales',
      'agents territoriaux',
      'code général de la fonction publique',
      'commune', 'département', 'région',
      'centre de gestion',
      'cnfpt',
    ];

    const FPT_EXCLUDE = [
      'ministère des armées',
      'personnel militaire',
      'militaires',
      'forces armées',
      'défense nationale',
      'pénitentiaire',
      'gens de mer',
      'navire',
      'police nationale',
      'gendarmerie',
      'personnel hospitalier',
      'fonction publique hospitalière',
      'dopage',
      'sport',
    ];

    return results.filter(result => {
      const titleLower = (result.title || '').toLowerCase();

      // Exclure explicitement les textes non-FPT
      if (FPT_EXCLUDE.some(kw => titleLower.includes(kw))) {
        return false;
      }

      // Inclure si FPT explicitement mentionné
      if (FPT_INCLUDE.some(kw => titleLower.includes(kw))) {
        return true;
      }

      // Par défaut : garder (le texte peut être général et s'appliquer à la FPT)
      return true;
    });
  }

  /**
   * Récupère le contenu complet d'un texte juridique par son ID
   * Endpoint: /consult/texte/{id}
   */
  async getTexte(id: string): Promise<any> {
    try {
      const token = await pisteAuthService.getAccessToken();

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Ajout de l'API Key si disponible
      const apiKey = this.getApiKey();
      if (apiKey) {
        headers['X-API-KEY'] = apiKey;
      }

      const response = await axios.get(
        `${this.apiBaseUrl}/consult/texte/${id}`,
        {
          headers,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching text:', error);
      throw new Error('Failed to fetch legal text');
    }
  }
}

// Export d'une instance singleton
export const pisteApiService = new PisteApiService();
