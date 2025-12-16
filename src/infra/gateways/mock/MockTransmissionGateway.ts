import { inject, injectable } from 'tsyringe';
import type { TransmissionGateway, CreateTransmissionInput } from '@/app/gateways/TransmissionGateway';
import type { FeedEntry } from '@/app/gateways/PlayerGateway';
import type { FeedGateway } from '@/app/gateways/FeedGateway';
import { TkFeedGateway } from '@/app/gateways/FeedGateway';
import type { PlayerGateway } from '@/app/gateways/PlayerGateway';
import { TkPlayerGateway } from '@/app/gateways/PlayerGateway';

@injectable()
export class MockTransmissionGateway implements TransmissionGateway {
  constructor(
    @inject(TkFeedGateway) private readonly feedGateway: FeedGateway,
    @inject(TkPlayerGateway) private readonly playerGateway: PlayerGateway,
  ) {}

  async createTransmission(input: CreateTransmissionInput): Promise<void> {
    const player = await this.playerGateway.getPlayer(input.targetId);
    const now = new Date();
    const feedEntry: FeedEntry = {
      id: Date.now().toString(),
      type: input.type,
      targetId: input.targetId,
      targetName: player?.nickname || 'Jogador Desconhecido',
      targetAvatar: player?.avatar,
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

    await this.feedGateway.prepend({ ...(feedEntry as any), submitterId: input.submitterId } as any);
  }
}
