export interface ContentItem {
    id: string;
    contentId?:string;
    title: string;
    type: string;
    imageUrl?: string;
    year?: string;
    creator?: string;
    description?: string;
    suggestedTo: {
      id: string;
      name: string;
      avatar?: string;
    }[];
    suggestedAt: string;
    status?:
      | "watched"
      | "watching"
      | "watchlist"
      | "finished"
      | "reading"
      | "listened"
      | "listening"
      | "readlist"
      | "listenlist"
      | null;
    whereToWatch?: string[];
    whereToRead?: string[];
    whereToListen?: string[];
  }


export const mockMySuggestions: ContentItem[] = [
    {
      id: "1",
      title: "Inception",
      type: "movie",
      imageUrl:
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&q=80",
      year: "2010",
      creator: "Christopher Nolan",
      description:
        "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
      suggestedTo: [
        {
          id: "1",
          name: "Emma Watson",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
        },
        {
          id: "2",
          name: "John Smith",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
        },
      ],
      suggestedAt: "2023-06-15T14:30:00Z",
      status: "watched",
    },
    {
      id: "2",
      title: "1984",
      type: "book",
      imageUrl:
        "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&q=80",
      year: "1949",
      creator: "George Orwell",
      description:
        "A dystopian social science fiction novel and cautionary tale set in a totalitarian state.",
      suggestedTo: [
        {
          id: "3",
          name: "Sophia Chen",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sophia",
        },
      ],
      suggestedAt: "2023-06-10T09:15:00Z",
      status: "finished",
    },
    {
      id: "3",
      title: "Death Note",
      type: "anime",
      imageUrl:
        "https://images.unsplash.com/photo-1601850494422-3cf14624b0b3?w=300&q=80",
      year: "2006",
      creator: "Tsugumi Ohba",
      description:
        "A high school student discovers a supernatural notebook that allows him to kill anyone by writing the victim's name while picturing their face.",
      suggestedTo: [
        {
          id: "4",
          name: "Michael Johnson",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=michael",
        },
        {
          id: "5",
          name: "Olivia Parker",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=olivia",
        },
      ],
      suggestedAt: "2023-06-05T16:45:00Z",
      status: "watching",
    },
    {
      id: "4",
      title: "Imagine",
      type: "song",
      imageUrl:
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&q=80",
      year: "1971",
      creator: "John Lennon",
      description:
        "A song co-produced by John Lennon, Yoko Ono, and Phil Spector, encouraging listeners to imagine a world of peace.",
      suggestedTo: [
        {
          id: "6",
          name: "David Kim",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
        },
      ],
      suggestedAt: "2023-06-01T11:20:00Z",
      status: "listened",
    },
  ];