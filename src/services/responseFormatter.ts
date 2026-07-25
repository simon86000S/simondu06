/**
 * Service de formatage des réponses juridiques
 * Transforme les résultats bruts de l'API en réponses accessibles aux agents
 */

import { PisteSearchResult, LegalResponse } from '@/types';

class ResponseFormatter {
  /**
   * Formate les résultats de recherche en une réponse structurée
   */
  formatResults(results: PisteSearchResult[], userQuestion: string): LegalResponse {
    if (results.length === 0) {
      return {
        summary: 'Aucun résultat trouvé dans les textes applicables à la Fonction Publique Territoriale. Essayez de reformuler votre question.',
        legalBasis: {
          articles: [],
          source: 'Aucun',
        },
      };
    }

    // Génère un résumé vulgarisé basé sur les résultats
    const summary = this.generateSummary(results, userQuestion);
    
    // Extrait les références légales
    const legalBasis = this.extractLegalBasis(results);
    
    // Identifie les conditions et démarches si présentes dans les résultats
    const conditions = this.extractConditions(results);
    const procedures = this.extractProcedures(results);

    return {
      summary,
      legalBasis,
      conditions: conditions.length > 0 ? conditions : undefined,
      procedures: procedures.length > 0 ? procedures : undefined,
    };
  }

  /**
   * Génère un résumé clair et vulgarisé des résultats
   */
  private generateSummary(results: PisteSearchResult[], userQuestion: string): string {
    const primaryResult = results[0];
    const title = String(primaryResult.title || '').toLowerCase();
    const resume = (primaryResult as any).resume || '';

    let summary = `D'après les textes officiels, `;

    if (resume) {
      // ✅ Utilise le vrai résumé PISTE si disponible
      summary += resume + ' ';
    } else if (title.includes('congé')) {
      summary += `vous avez droit à ce congé sous certaines conditions. `;
    } else if (title.includes('prime') || title.includes('indemnité')) {
      summary += `cette prime est prévue par les textes réglementaires. `;
    } else if (title.includes('grève') || title.includes('retrait')) {
      summary += `ce droit est reconnu dans la fonction publique. `;
    } else {
      summary += `ce droit est prévu par les textes de la fonction publique territoriale. `;
    }

    summary += `${results.length} texte(s) trouvé(s). Voir les références légales ci-dessous.`;
    return summary;
  }

  /**
   * Extrait les références légales (articles, codes)
   */
  private extractLegalBasis(results: PisteSearchResult[]): { articles: string[]; source: string } {
    const articles: string[] = [];
    const sources = new Set<string>();

    results.forEach(result => {
      const title = result.title || '';
      const nature = result.nature || '';
      const nor = result.nor || '';

      if (nor) articles.push(nor);  // ✅ NOR = référence officielle

      const articleMatch = title.match(/article\s+[L\d.-]+/gi);
      if (articleMatch) articles.push(...articleMatch);

      if (nature) sources.add(nature);
    });

    return {
      articles: [...new Set(articles)].slice(0, 5),
      source: Array.from(sources).join(', ') || 'Légifrance',
    };
  }

  /**
   * Extrait les conditions d'application si mentionnées
   */
  private extractConditions(results: PisteSearchResult[]): string[] {
    const conditions: string[] = [];
    results.forEach(result => {
      const title = (result.title || (result as any).titreTexte || (result as any).titre || '').toLowerCase();
      if (title.includes('ancienneté')) conditions.push("Condition d'ancienneté requise");
      if (title.includes('temps partiel')) conditions.push('Peut varier selon la quotité de travail');
      if (title.includes('demande')) conditions.push('Soumis à demande préalable');
    });
    return conditions;
  }

  /**
   * Extrait les démarches à suivre si mentionnées
   */
  private extractProcedures(results: PisteSearchResult[]): string[] {
    const procedures: string[] = [];
    results.forEach(result => {
      const title = (result.title || (result as any).titreTexte || (result as any).titre || '').toLowerCase();
      if (title.includes('demande')) procedures.push("Adressez une demande écrite à l'autorité territoriale");
      if (title.includes('autorisation')) procedures.push("Obtenez l'autorisation préalable de l'autorité territoriale");
    });
    return procedures;
  }

  /**
   * Formate une réponse d'erreur
   */
  formatError(error: string): LegalResponse {
    return {
      summary: `Une erreur est survenue lors de la recherche : ${error}`,
      legalBasis: {
        articles: [],
        source: 'Erreur',
      },
    };
  }
}

// Export d'une instance singleton
export const responseFormatter = new ResponseFormatter();
