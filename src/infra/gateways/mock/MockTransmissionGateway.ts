import { inject, injectable } from 'tsyringe';
import type { TransmissionGateway, CreateTransmissionInput } from '@/app/gateways/TransmissionGateway';
import type { FeedEntry } from '@/app/gateways/PlayerGateway';
import type { FeedGateway } from '@/app/gateways/FeedGateway';
import { TkFeedGateway } from '@/app/gateways/FeedGateway';
import type { PlayerGateway } from '@/app/gateways/PlayerGateway';
import { TkPlayerGateway } from '@/app/gateways/PlayerGateway';
import type { MatchGateway } from '@/app/gateways/MatchGateway';
import { TkMatchGateway } from '@/app/gateways/MatchGateway';

@injectable()
export class MockTransmissionGateway implements TransmissionGateway {
  constructor(
    @inject(TkFeedGateway) private readonly feedGateway: FeedGateway,
    @inject(TkPlayerGateway) private readonly playerGateway: PlayerGateway,
    @inject(TkMatchGateway) private readonly matchGateway: MatchGateway,
  ) {}

  async createTransmission(input: CreateTransmissionInput): Promise<void> {
    if (input.targetId === input.submitterId) {
      throw new Error('Não é possível denunciar a si mesmo.');
    }
    if (!input.matchId) {
      throw new Error('Selecione uma partida válida.');
    }
    const eligibleMatches = await this.matchGateway.listEligibleMatchesForTransmission({ playerId: input.submitterId });
    const eligible = eligibleMatches.some((match) => match.id === input.matchId);
    if (!eligible) {
      throw new Error('Partida inválida ou não elegível.');
    }
    const transmittedTargets = await this.listTransmittedTargets({ submitterId: input.submitterId, matchId: input.matchId });
    if (transmittedTargets.includes(input.targetId)) {
      throw new Error('Já existe uma transmissão para este operador nesta partida.');
    }
    const player = await this.playerGateway.getPlayer(input.targetId);
    const now = new Date();
    const feedEntry: FeedEntry = {
      id: Date.now().toString(),
      type: input.type,
      targetId: input.targetId,
      targetName: player?.nickname || 'Jogador Desconhecido',
      targetAvatar: player?.avatar,
      targetAvatarFrame: player?.avatarFrame ?? null,
      targetIsVip: player?.isVip ?? false,
      content: input.content,
      date: now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '.'),
      time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    // Update player stats
    if (player) {
      const praise = player.praiseCount + (input.type === 'praise' ? 1 : 0);
      const reports = player.reportCount + (input.type === 'report' ? 1 : 0);
      this.playerGateway.updateStats(player.id, praise, reports);
    }

    await this.feedGateway.prepend({
      ...(feedEntry as any),
      submitterId: input.submitterId,
      matchId: input.matchId,
    } as any);
  }

  async listTransmittedTargets(input: { submitterId: string; matchId: string }): Promise<string[]> {
    const entries = await this.feedGateway.listBySubmitter(input.submitterId);
    return entries
      .filter((entry: any) => entry.matchId === input.matchId)
      .map((entry) => entry.targetId)
      .filter(Boolean);
  }
}
