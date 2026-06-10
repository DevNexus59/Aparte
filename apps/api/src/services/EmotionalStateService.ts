import { Repositories } from '../repositories';
import { EmotionalState, StateValue } from '../entities/EmotionalState';

export class EmotionalStateService {
  constructor(private readonly repos: Repositories) {}

  set(userId: string, state: StateValue, durationHours = 24): Promise<EmotionalState> {
    return this.repos.states.set({ userId, state, durationHours });
  }

  getMyCurrent(userId: string): Promise<EmotionalState | null> {
    return this.repos.states.getMyCurrent(userId);
  }

  clearMine(userId: string): Promise<void> {
    return this.repos.states.clearMine(userId);
  }

  listCircle(userId: string) {
    return this.repos.states.listVisibleForUser(userId);
  }
}
