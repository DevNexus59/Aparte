// Pattern Strategy : chaque classifieur implémente Classifier.
// Important (I10) : classifyImage prend un Buffer, pas une URL.
// La modération s'exécute AVANT le stockage — aucune image suspecte ne touche le disque.

export interface ClassificationResult {
  classifier: string;
  score: number;     // 0..1
  flagged: boolean;
}

export interface Classifier {
  readonly name: string;
  classifyText?(text: string): Promise<ClassificationResult>;
  classifyImage?(buffer: Buffer, mime: string): Promise<ClassificationResult>;
}

export class NoopClassifier implements Classifier {
  readonly name = 'noop';
  async classifyText(_text: string): Promise<ClassificationResult> {
    return { classifier: this.name, score: 0, flagged: false };
  }
  async classifyImage(_buffer: Buffer, _mime: string): Promise<ClassificationResult> {
    return { classifier: this.name, score: 0, flagged: false };
  }
}

export const FLAG_THRESHOLD = 0.85;
export const AUTO_ACTION_THRESHOLD = 0.95;
