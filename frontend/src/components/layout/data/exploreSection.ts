/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ExploreContentItem {
  id: string;
  title: string;
  type: string;
  imageUrl?: string;
  year?: string;
  creator?: string;
  description?: string;
  suggestedBy?: {
    id: string;
    name: string;
    avatar?: string;
  };
  suggestedAt: string;
  status?:
    | 'watched'
    | 'watching'
    | 'watchlist'
    | 'finished'
    | 'reading'
    | 'listened'
    | 'listening'
    | 'readlist'
    | 'listenlist'
    | null
  whereToWatch?: string[];
  whereToRead?: string[];
  whereToListen?: string[];
  [key: string]: any
}
export const mockTrending: ExploreContentItem[] = [
    {
      id: "t1",
      title: "Dune: Part Two",
      type: "movie",
      imageUrl:
        "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=300&q=80",
      year: "2024",
      creator: "Denis Villeneuve",
      description:
        "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
      suggestedAt: new Date().toISOString(),
      whereToWatch: ["HBO Max", "Theaters"],
    },
    {
      id: "t2",
      title: "The Three-Body Problem",
      type: "book",
      imageUrl:
        "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&q=80",
      year: "2008",
      creator: "Liu Cixin",
      description:
        "Set against the backdrop of China's Cultural Revolution, a secret military project sends signals into space to establish contact with aliens.",
      suggestedAt: new Date().toISOString(),
      whereToRead: ["Amazon", "Barnes & Noble", "Local Bookstore"],
    },
    {
      id: "t3",
      title: "Oppenheimer",
      type: "movie",
      imageUrl:
        "https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?w=300&q=80",
      year: "2023",
      creator: "Christopher Nolan",
      description:
        "The story of J. Robert Oppenheimer and the creation of the atomic bomb during World War II.",
      suggestedAt: new Date().toISOString(),
      whereToWatch: ["Peacock", "Apple TV+"],
    },
    {
      id: "t4",
      title: "Project Hail Mary",
      type: "book",
      imageUrl:
        "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=300&q=80",
      year: "2021",
      creator: "Andy Weir",
      description:
        "A lone astronaut must save humanity from disaster while piecing together his forgotten mission in deep space.",
      suggestedAt: new Date().toISOString(),
      whereToRead: ["Audible", "Amazon", "Bookshop.org"],
    },
    {
      id: "t5",
      title: "The Bear",
      type: "tv",
      imageUrl:
        "https://images.unsplash.com/photo-1620207418302-439b387441b0?w=300&q=80",
      year: "2022",
      creator: "Christopher Storer",
      description:
        "A young chef from the fine dining world returns home to run his family's sandwich shop in Chicago.",
      suggestedAt: new Date().toISOString(),
      whereToWatch: ["Hulu", "Disney+"],
    },
    {
      id: "t6",
      title: "Sapiens: A Brief History of Humankind",
      type: "book",
      imageUrl:
        "https://images.unsplash.com/photo-1588776814546-bc4bde8f7a5f?w=300&q=80",
      year: "2011",
      creator: "Yuval Noah Harari",
      description:
        "Explores how Homo sapiens became the dominant species and how our history shaped modern society.",
      suggestedAt: new Date().toISOString(),
      whereToRead: ["Kindle", "Amazon", "Libraries"],
    },
  ];

  export const mockFriendActivity: ExploreContentItem[] = [
    {
      id: "f1",
      title: "Jujutsu Kaisen",
      type: "anime",
      imageUrl:
        "https://images.unsplash.com/photo-1541562232579-512a21360020?w=300&q=80",
      year: "2020",
      creator: "Gege Akutami",
      description:
        "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman school to be able to locate the demon's other body parts and thus exorcise himself.",
      suggestedBy: {
        id: "3",
        name: "Sophia Chen",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sophia",
      },
      suggestedAt: new Date().toISOString(),
      status: "watching",
      whereToWatch: ["Crunchyroll", "Netflix"],
    },
  ];

  export const mockRecommended: ExploreContentItem[] = [
    {
      id: "r1",
      title: "Pachinko",
      type: "book",
      imageUrl:
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&q=80",
      year: "2017",
      creator: "Min Jin Lee",
      description:
        "Following a Korean family who eventually migrates to Japan, the novel is a tale of love, sacrifice, ambition, and loyalty.",
      suggestedAt: new Date().toISOString(),
      whereToRead: ["Amazon", "Apple Books", "Local Bookstore"],
    },
    {
      id: "r2",
      title: "Killers of the Flower Moon",
      type: "movie",
      imageUrl:
        "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=300&q=80",
      year: "2023",
      creator: "Martin Scorsese",
      description:
        "Members of the Osage tribe in the United States are murdered under mysterious circumstances in the 1920s, sparking a major F.B.I. investigation.",
      suggestedAt: new Date().toISOString(),
      whereToWatch: ["Apple TV+", "Amazon Prime"],
    },
  ];