/**
 * Service d'authentification OAuth2 pour l'API PISTE (Légifrance)
 * Gère la récupération et le rafraîchissement des tokens d'accès
 * Utilise les crédits stockés dans localStorage par l'utilisateur
 */

import axios from 'axios';
import { PisteTokenResponse } from '@/types';

class PisteAuthService {
  private token: string | null = null;
  private tokenExpiry: number | null = null;
  private tokenUrl: string;

  constructor() {
    this.tokenUrl = process.env.PISTE_TOKEN_URL || 'https://oauth.piste.gouv.fr/api/oauth/token';
  }

  /**
   * Récupère les crédits depuis localStorage
   */
  private getCredentials(): { clientId: string; clientSecret: string } {
    if (typeof window === 'undefined') {
      return { clientId: '', clientSecret: '' };
    }

    const savedCreds = localStorage.getItem('pisteCredentials');
    if (!savedCreds) {
      throw new Error('PISTE credentials not configured. Please set them in Settings.');
    }

    const creds = JSON.parse(savedCreds);
    return {
      clientId: creds.clientId || '',
      clientSecret: creds.clientSecret || '',
    };
  }

  /**
   * Récupère un token d'accès valide
   * Utilise le token en cache si disponible et non expiré
   */
  async getAccessToken(): Promise<string> {
    // Vérifie si le token est valide et non expiré
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    // Récupère un nouveau token
    return this.fetchNewToken();
  }

  /**
   * Récupère un nouveau token depuis l'API PISTE
   * Essaie d'abord le format Basic Auth, puis fallback sur body params
   */
  private async fetchNewToken(): Promise<string> {
    const { clientId, clientSecret } = this.getCredentials();

    if (!clientId || !clientSecret) {
      throw new Error('PISTE credentials not configured. Please set them in Settings.');
    }

    try {
      // Essai 1: Basic Auth (recommandé pour OAuth2 client_credentials)
      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      
      const response = await axios.post<PisteTokenResponse>(
        this.tokenUrl,
        new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'openid',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`,
          },
        }
      );

      this.token = response.data.access_token;
      // Expiration avec une marge de sécurité (5 minutes avant expiration réelle)
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiry = Date.now() + (expiresIn - 300) * 1000;

      return this.token;
    } catch (error) {
      console.error('Error fetching PISTE token with Basic Auth:', error);
      
      // Fallback: Essai avec credentials dans le body
      try {
        const response = await axios.post<PisteTokenResponse>(
          this.tokenUrl,
          new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
            scope: 'openid',
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        this.token = response.data.access_token;
        const expiresIn = response.data.expires_in || 3600;
        this.tokenExpiry = Date.now() + (expiresIn - 300) * 1000;

        return this.token;
      } catch (fallbackError) {
        console.error('Error fetching PISTE token with body params:', fallbackError);
        
        if (axios.isAxiosError(fallbackError) && fallbackError.response) {
          console.error('PISTE API Response:', fallbackError.response.data);
        }
        
        throw new Error('Failed to authenticate with PISTE API. Please check your credentials in Settings.');
      }
    }
  }

  /**
   * Réinitialise le token (utile pour les tests ou en cas d'erreur)
   */
  resetToken(): void {
    this.token = null;
    this.tokenExpiry = null;
  }
}

// Export d'une instance singleton
export const pisteAuthService = new PisteAuthService();
