/**
 * Route API pour les recherches juridiques
 * Point d'entrée principal : reçoit la question en langage naturel,
 * traite via NLP, interroge l'API PISTE, et formate la réponse
 */

import { NextRequest, NextResponse } from 'next/server';
import { nlpExtractionService } from '@/services/nlpExtractionService';
import { pisteApiService } from '@/services/pisteApiService';
import { responseFormatter } from '@/services/responseFormatter';
import { PisteSearchRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Question requise' },
        { status: 400 }
      );
    }

    // Étape 1 : Extraction NLP - transformation de la question en mots-clés
    const extractedKeywords = nlpExtractionService.extractKeywords(query);
    
    // Vérification de pertinence FPT
    if (!extractedKeywords.fptRelevant) {
      return NextResponse.json(
        responseFormatter.formatError('Cette question semble concerner le secteur privé. JurisFTP est spécialisé dans la Fonction Publique Territoriale.'),
        { status: 400 }
      );
    }

    // Étape 2 : Construction de la requête de recherche
    const searchQuery = nlpExtractionService.buildSearchQuery(extractedKeywords);

    // Enrichir la requête avec "fonction publique territoriale" si absent
    const fptQuery = query.toLowerCase().includes('fonction publique')
      ? searchQuery
      : `${searchQuery} "fonction publique territoriale"`;

    // Étape 3 : Requête vers l'API PISTE avec filtres FPT
    const searchRequest: PisteSearchRequest = {
      query: fptQuery,
      filters: {
        // Optionnel : filtres de date pour cibler les textes les plus récents
        dateDebut: '2020-01-01',
      },
    };

    const results = await pisteApiService.searchLegi(searchRequest);

    // Étape 4 : Formatage de la réponse pour l'utilisateur
    const formattedResponse = responseFormatter.formatResults(results, query);

    // Ajouter les résultats bruts
    formattedResponse.results = results.map(r => ({
      title: r.title,
      nature: r.nature,
      nor: r.nor,
      dateTexte: r.dateTexte,
      url: r.url,
      resume: (r as any).resume,
      etat: (r as any).etat,
    }));

    return NextResponse.json(formattedResponse);

  } catch (error) {
    console.error('Search API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la recherche';
    return NextResponse.json(
      responseFormatter.formatError(errorMessage),
      { status: 500 }
    );
  }
}
