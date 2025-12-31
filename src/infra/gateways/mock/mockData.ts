import type { FeedEntry, Player } from '@/app/gateways/PlayerGateway';
import type { Notification } from '@/app/gateways/NotificationGateway';
import { calculateReputation } from '@/domain/reputation';

// Seed data adapted from the original in-memory state
const feedSeed: FeedEntry[] = [
  {
    id: '1',
    type: 'praise',
    targetId: '1',
    targetName: 'Carlos "Raptor" Silva',
    targetAvatar: 'https://images.unsplash.com/photo-1695271710977-ee9a4b095304?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    content: 'Jogador extremamente honesto. Durante partida no campo Zona Alpha, sinalizou hit mesmo estando em posição vantajosa.',
    date: '14.12.24',
    time: '15:30',
  },
  {
    id: '2',
    type: 'report',
    targetId: '2',
    targetName: 'João "Shadow" Santos',
    targetAvatar: 'https://images.unsplash.com/photo-1686587847397-ab5882b8d34f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    content: 'Não aceitou hits múltiplos na partida de domingo. Vários jogadores confirmaram tiros certeiros no alvo, mas continuou jogando sem sinalizar.',
    date: '13.12.24',
    time: '18:45',
  },
  {
    id: '3',
    type: 'praise',
    targetId: '3',
    targetName: 'Maria "Eagle" Costa',
    targetAvatar: 'https://images.unsplash.com/photo-1735031896550-aae16d84b711?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    content: 'Atitude profissional e respeitosa. Ajudou jogador iniciante a ajustar equipamento e explicou regras.',
    date: '12.12.24',
    time: '10:15',
  },
  {
    id: '4',
    type: 'report',
    targetId: '2',
    targetName: 'João "Shadow" Santos',
    targetAvatar: 'https://images.unsplash.com/photo-1686587847397-ab5882b8d34f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    content: 'Comportamento agressivo após eliminação. Discutiu com árbitro e outros jogadores de forma desrespeitosa.',
    date: '11.12.24',
    time: '16:20',
    isRetracted: true,
  },
  {
    id: '5',
    type: 'praise',
    targetId: '4',
    targetName: 'Pedro "Ghost" Oliveira',
    targetAvatar: 'https://images.unsplash.com/photo-1620058689342-80271a734f23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    content: 'Organizou evento beneficente no campo. Doou equipamentos para jogadores novos.',
    date: '10.12.24',
    time: '14:00',
  },
];

const playersSeed = {
  '1': {
    id: '1',
    name: 'Carlos Silva Santos',
    nickname: 'Carlos "Raptor" Silva',
    motto: 'Disciplina antes do disparo.',
    avatar: 'https://images.unsplash.com/photo-1695271710977-ee9a4b095304?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    reportCount: 1,
    praiseCount: 12,
    history: [
      {
        id: '101',
        type: 'praise',
        targetId: '1',
        targetName: 'Carlos "Raptor" Silva',
        targetAvatar: 'https://images.unsplash.com/photo-1695271710977-ee9a4b095304?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
        content: 'Jogador extremamente honesto. Durante partida no campo Zona Alpha, sinalizou hit mesmo estando em posição vantajosa.',
        date: '14.12.24',
        time: '15:30',
      },
    ],
  },
  '2': {
    id: '2',
    name: 'João Santos',
    nickname: 'João "Shadow" Santos',
    motto: 'Sombras movem a missão.',
    avatar: 'https://images.unsplash.com/photo-1686587847397-ab5882b8d34f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    reportCount: 14,
    praiseCount: 3,
    history: [
      {
        id: '201',
        type: 'report',
        targetId: '2',
        targetName: 'João "Shadow" Santos',
        targetAvatar: 'https://images.unsplash.com/photo-1686587847397-ab5882b8d34f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
        content: 'Não aceitou hits múltiplos na partida de domingo. Vários jogadores confirmaram tiros certeiros no alvo.',
        date: '13.12.24',
        time: '18:45',
      },
      {
        id: '202',
        type: 'report',
        targetId: '2',
        targetName: 'João "Shadow" Santos',
        targetAvatar: 'https://images.unsplash.com/photo-1686587847397-ab5882b8d34f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
        content: 'Comportamento agressivo após eliminação. Discutiu com árbitro e outros jogadores.',
        date: '11.12.24',
        time: '16:20',
        isRetracted: true,
      },
    ],
  },
  '3': {
    id: '3',
    name: 'Maria Costa Ferreira',
    nickname: 'Maria "Eagle" Costa',
    motto: 'Visão limpa, operação segura.',
    avatar: 'https://images.unsplash.com/photo-1735031896550-aae16d84b711?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    reportCount: 2,
    praiseCount: 15,
    history: [],
  },
  '4': {
    id: '4',
    name: 'Pedro Oliveira Lima',
    nickname: 'Pedro "Ghost" Oliveira',
    motto: 'Silêncio garante vitória.',
    avatar: 'https://images.unsplash.com/photo-1620058689342-80271a734f23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    reportCount: 0,
    praiseCount: 23,
    history: [],
  },
  '5': { id: '5', name: 'Ana Paula Ribeiro', nickname: 'Ana "Viper" Ribeiro', motto: 'Instinto guiando a ação.', reportCount: 5, praiseCount: 8, history: [] },
  '6': { id: '6', name: 'Rafael Souza Mendes', nickname: 'Rafael "Hawk" Souza', motto: 'Olhos no alvo.', reportCount: 8, praiseCount: 10, history: [] },
  '7': { id: '7', name: 'Fernanda Lima Santos', nickname: 'Fernanda "Phoenix" Lima', motto: 'Renascemos no campo.', reportCount: 2, praiseCount: 18, history: [] },
  '8': { id: '8', name: 'Lucas Pereira Costa', nickname: 'Lucas "Wolf" Pereira', motto: 'Matilha sempre pronta.', reportCount: 11, praiseCount: 5, history: [] },
  '9': { id: '9', name: 'Juliana Costa Alves', nickname: 'Juliana "Falcon" Costa', motto: 'Ataque preciso.', reportCount: 3, praiseCount: 14, history: [] },
  '10': { id: '10', name: 'Bruno Santos Rocha', nickname: 'Bruno "Tiger" Santos', motto: 'Foco e velocidade.', reportCount: 9, praiseCount: 7, history: [] },
  '11': { id: '11', name: 'Camila Rodrigues Silva', nickname: 'Camila "Raven" Rodrigues', motto: 'Tática acima de tudo.', reportCount: 0, praiseCount: 25, history: [] },
  '12': { id: '12', name: 'Diego Martins Ferreira', nickname: 'Diego "Snake" Martins', motto: 'Movimento invisível.', reportCount: 18, praiseCount: 2, history: [] },
};

export type MockPlayerStore = Record<string, Player>;
export type MockNotificationRecord = Notification & { playerId: string };

export function createPlayerStore(): MockPlayerStore {
  const store: MockPlayerStore = {};
  Object.values(playersSeed).forEach((p) => {
    const reputation = calculateReputation({ elogios: p.praiseCount, denuncias: p.reportCount });
    store[p.id] = {
      id: p.id,
      name: p.name,
      nickname: p.nickname,
      motto: p.motto ?? null,
      avatar: p.avatar,
      isVip: (p as { isVip?: boolean }).isVip ?? false,
      elogios: p.praiseCount,
      denuncias: p.reportCount,
      praiseCount: p.praiseCount,
      reportCount: p.reportCount,
      reputation,
      history: p.history as FeedEntry[],
    };
  });
  return store;
}

export function createFeedStore(): FeedEntry[] {
  return [...feedSeed];
}

export function createNotificationStore(): MockNotificationRecord[] {
  const now = new Date();
  return [
    {
      id: 'notif-1',
      playerId: '1',
      type: 'praise',
      message: 'Você recebeu um elogio na Partida Treino Tático',
      matchId: 'match-3',
      createdAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
      readAt: null,
    },
    {
      id: 'notif-2',
      playerId: '1',
      type: 'report',
      message: 'Você recebeu uma denúncia na Partida Missão Noturna',
      matchId: 'match-2',
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      readAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-3',
      playerId: '2',
      type: 'report',
      message: 'Você recebeu uma denúncia na Partida Operação Trovão',
      matchId: 'match-1',
      createdAt: new Date(now.getTime() - 22 * 60 * 60 * 1000).toISOString(),
      readAt: null,
    },
  ];
}
