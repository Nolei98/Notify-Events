export interface ROEvent {
  id: string;
  name: string;
  description: string;
  prizes: string[];
  times: string[]; // HH:mm format
  category: 'MvP' | 'PvP' | 'Minigame' | 'Special';
}

export const RAGNAROK_EVENTS: ROEvent[] = [
  {
    id: 'homem-macaco',
    name: 'Homem Macaco',
    description: 'Ser o último sobrevivente contra o MvP Homem Macaco.',
    prizes: ['1x Cartão Visual', '1x Goma de Mascar', '2x Caixas de Galhos Sangrentos [5]'],
    times: ['10:00', '13:00', '16:00', '19:00', '04:00'],
    category: 'MvP'
  },
  {
    id: 'boss-mundo',
    name: 'Boss Mundo',
    description: 'Eliminar o maior MvP de todos os tempos. Dropa Armadura de Aurum (ID:2322).',
    prizes: ['2x Caixas de Galhos Sangrentos [5]', '1x Caixa de Visuais Presos', '1x Caixa Divina de Atreus', '5x Cartões Visuais', '5x Moedas de Ouro'],
    times: ['20:00'],
    category: 'MvP'
  },
  {
    id: 'arena-caça',
    name: 'Arena de Caça',
    description: 'Eliminar todos os mobs e acumular pontos.',
    prizes: ['Itens Exclusivos'],
    times: ['11:00', '14:00', '17:00', '23:00', '02:00'],
    category: 'Special'
  },
  {
    id: 'taro',
    name: 'Tarô',
    description: 'Ser o último sobrevivente contra o [GM]Poring. Cuidado com a carta A Morte!',
    prizes: ['2x Caixas de Galhos Sangrentos [5]', '2x Bênção do Ferreiro', '3x Moedas de Ouro'],
    times: ['11:30', '14:30', '17:30', '23:15', '02:30'],
    category: 'Minigame'
  },
  {
    id: 'invasao-mvp',
    name: 'Invasão MvP',
    description: 'Eliminar todos os MvPs durante o evento.',
    prizes: ['Drops de MvP'],
    times: ['12:00', '00:00'],
    category: 'MvP'
  },
  {
    id: 'sortudo',
    name: 'Sortudo',
    description: 'Ser o último sobrevivente na Arena PvP. Baús surgem após 3 min.',
    prizes: ['2x Caixas de Galhos Sangrentos[5]', '2x Bênção do Ferreiro', '50x Emblemas de Guerra'],
    times: ['09:45', '14:45', '18:45', '22:45', '01:45'],
    category: 'PvP'
  },
  {
    id: 'torre-ilusoes',
    name: 'Torre das Ilusões',
    description: 'Passagem Secreta de 3 fases. Dropa Manteau e Botas de Aurum.',
    prizes: ['2x Caixas de Galhos Sangrentos [5]', '1x Caixa de Visuais Presos', '1x Caixa Divina de Atreus', '5x Cartões Visuais', '5x Moedas de Ouro'],
    times: ['18:00'],
    category: 'Special'
  },
  {
    id: 'bg-royale',
    name: 'BG Royale',
    description: 'Ser o último sobrevivente no Battleground Royale.',
    prizes: ['2x Caixas de Galhos Sangrentos[5]', '2x Bênção do Ferreiro', '50x Emblemas de Guerra'],
    times: ['09:30', '12:30', '15:30', '18:30'],
    category: 'PvP'
  },
  {
    id: 'mineracao',
    name: 'Mineração',
    description: 'Destruir os cristais enriquecidos.',
    prizes: ['Bênção do Ferreiro', 'Oridecon Enriquecido', 'Elunium Enriquecido'],
    times: ['11:45', '17:45', '23:45', '02:45'],
    category: 'Special'
  },
  {
    id: 'poring-race',
    name: 'Poring Race',
    description: 'Apostar no poring campeão.',
    prizes: ['1x Caixa de Galhos Sangrentos [5]', '1x Arca Ancestral de Svartalfheim', '2x Bênção do Ferreiro', '5x Moedas de Ouro'],
    times: ['22:30'],
    category: 'Minigame'
  },
  {
    id: 'wot',
    name: 'WoT',
    description: 'Clãs eliminam adversários. Baú após 3 min.',
    prizes: ['1x Cartão Visual', '5x Galhos Sangrentos', '10x ROPs Eletrônicos'],
    times: ['20:45'],
    category: 'PvP'
  },
  {
    id: 'zeny-room',
    name: 'Zeny Room',
    description: 'Eliminar Ratos-Coelhos para ganhar Zeny.',
    prizes: ['1x Fragmento da Fortuna'],
    times: ['22:15'],
    category: 'Special'
  },
  {
    id: 'portal-dimensional',
    name: 'Portal Dimensional',
    description: 'Eliminar Admin SAO na 100ª rodada. Provação Divina dropa do Boss.',
    prizes: ['1x Caixa de Galhos Sangrentos [5]', 'Caixa de Visuais Presos', 'Caixa Divina de Atreus'],
    times: ['23:30'],
    category: 'Special'
  },
  {
    id: 'devil-square',
    name: 'Devil Square',
    description: 'Eliminar monstros durante 3 rodadas de dificuldade crescente.',
    prizes: ['10x Caixas de Pandora', '2x Caixas de Galhos Sangrentos [5]', '5x Caixas de Frutos de Yggdrasil', '15.000.000z'],
    times: ['10:30', '13:30', '16:30', '19:30', '03:30'],
    category: 'Special'
  },
  {
    id: 'mausoleu',
    name: 'Mausoleu',
    description: 'Derrotar diversos Chefes e o último MvP.',
    prizes: ['1x Caixa de Galhos Sangrentos [5]', '1x Arca Ancestral de Svartalfheim', '2x Bênção do Ferreiro', '5x Moedas de Ouro'],
    times: ['20:30'],
    category: 'MvP'
  }
];
