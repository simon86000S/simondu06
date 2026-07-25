import { ExtractedKeywords } from '@/types';

class NLPExtractionService {
  // Termes du secteur privé uniquement (liste courte et précise)
  private privateSectorKeywords = [
    'code du travail',
    'contrat de travail privé', 
    'salaire minimum',
    'prud\'hommes',
    'convention collective privée',
  ];

  extractKeywords(question: string): ExtractedKeywords {
    const normalizedQuestion = question.toLowerCase();

    // Vérification secteur privé
    const fptRelevant = !this.privateSectorKeywords.some(kw => 
      normalizedQuestion.includes(kw)
    );

    // On retourne la question directement comme mot-clé principal
    // L'API PISTE fait sa propre recherche full-text
    return {
      primaryKeywords: [question], // ← la question originale, pas transformée
      secondaryKeywords: [],
      legalDomain: 'general',
      fptRelevant,
    };
  }

  buildSearchQuery(extracted: ExtractedKeywords): string {
    // Envoie directement la question à PISTE, sans transformation
    return extracted.primaryKeywords[0] || 'fonction publique territoriale';
  }
}

export const nlpExtractionService = new NLPExtractionService();
