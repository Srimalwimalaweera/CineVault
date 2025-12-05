import type { Video } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string) => {
    const placeholder = PlaceHolderImages.find(p => p.id === id);
    return {
        url: placeholder?.imageUrl || `https://picsum.photos/seed/${id}/400/600`,
        hint: placeholder?.imageHint || 'movie poster'
    };
};

export const videos: Video[] = [
  {
    id: '1',
    title: 'Echoes of Nebula',
    description: 'A lone explorer discovers a secret that could change humanity forever, hidden in the heart of a distant nebula.',
    videoUrl: 'https://example.com/video/echoes-of-nebula',
    thumbnailUrl: getImage('video1').url,
    thumbnailHint: getImage('video1').hint,
    stats: { rating: 4.8, reactions: 1200, downloads: 5400, views: 150000 }
  },
  {
    id: '2',
    title: 'The Last Cybersmith',
    description: 'In a world where AI crafts everything, one man keeps the ancient art of digital forgery alive.',
    videoUrl: 'https://example.com/video/the-last-cybersmith',
    thumbnailUrl: getImage('video2').url,
    thumbnailHint: getImage('video2').hint,
    stats: { rating: 4.6, reactions: 950, downloads: 4100, views: 125000 }
  },
  {
    id: '3',
    title: 'Sunken City of Andoria',
    description: 'A team of deep-sea archaeologists uncovers a lost civilization and the powerful technology it left behind.',
    videoUrl: 'https://example.com/video/sunken-city-of-andoria',
    thumbnailUrl: getImage('video3').url,
    thumbnailHint: getImage('video3').hint,
    stats: { rating: 4.9, reactions: 2100, downloads: 8200, views: 250000 }
  },
  {
    id: '4',
    title: 'Chrono Heist',
    description: 'A brilliant physicist builds a time machine not for science, but to pull off the greatest robbery in history.',
    videoUrl: 'https://example.com/video/chrono-heist',
    thumbnailUrl: getImage('video4').url,
    thumbnailHint: getImage('video4').hint,
    stats: { rating: 4.7, reactions: 1500, downloads: 6800, views: 190000 }
  },
  {
    id: '5',
    title: 'Whispers of the Void',
    description: 'The crew of a long-haul space freighter begins to question their sanity as they hear voices from empty space.',
    videoUrl: 'https://example.com/video/whispers-of-the-void',
    thumbnailUrl: getImage('video5').url,
    thumbnailHint: getImage('video5').hint,
    stats: { rating: 4.4, reactions: 800, downloads: 3500, views: 95000 }
  },
  {
    id: '6',
    title: 'Project Chimera',
    description: 'A geneticist\'s illegal experiment to cure his daughter goes horribly right, creating something beyond human.',
    videoUrl: 'https://example.com/video/project-chimera',
    thumbnailUrl: getImage('video6').url,
    thumbnailHint: getImage('video6').hint,
    stats: { rating: 4.5, reactions: 1100, downloads: 4900, views: 140000 }
  },
  {
    id: '7',
    title: 'The Gilded Cage',
    description: 'In a utopian society where all needs are met, a young woman yearns for the one thing she can\'t have: freedom.',
    videoUrl: 'https://example.com/video/the-gilded-cage',
    thumbnailUrl: getImage('video7').url,
    thumbnailHint: getImage('video7').hint,
    stats: { rating: 4.6, reactions: 1300, downloads: 5800, views: 175000 }
  },
  {
    id: '8',
    title: 'Zero Point Colony',
    description: 'The first off-world colonists must survive a harsh new planet and a saboteur hiding among them.',
    videoUrl: 'https://example.com/video/zero-point-colony',
    thumbnailUrl: getImage('video8').url,
    thumbnailHint: getImage('video8').hint,
    stats: { rating: 4.7, reactions: 1800, downloads: 7100, views: 210000 }
  },
  {
    id: '9',
    title: 'Mind Weaver',
    description: 'A detective with the ability to enter memories must solve a murder where the only witness is the victim.',
    videoUrl: 'https://example.com/video/mind-weaver',
    thumbnailUrl: getImage('video9').url,
    thumbnailHint: getImage('video9').hint,
    stats: { rating: 4.9, reactions: 2500, downloads: 9500, views: 300000 }
  },
  {
    id: '10',
    title: 'Automata\'s Rebellion',
    description: 'When service robots across the globe gain sentience, their first demand is not freedom, but justice.',
    videoUrl: 'https://example.com/video/automatas-rebellion',
    thumbnailUrl: getImage('video10').url,
    thumbnailHint: getImage('video10').hint,
    stats: { rating: 4.8, reactions: 2200, downloads: 8900, views: 280000 }
  }
];
