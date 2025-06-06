export interface SuggestedToMeItem {
    id: string;
    title: string;
    type: string;
    imageUrl?: string;
    year?: string;
    creator?: string;
    description?: string;
    suggestedBy: {
      id: string;
      name: string;
      avatar?: string;
    };
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


  export const suggestedToMe: SuggestedToMeItem[] = [
    {
      id: "1",
      title: "The Shawshank Redemption",
      type: "movie",
      imageUrl:
        "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=300&q=80",
      year: "1994",
      creator: "Frank Darabont",
      description:
        "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
      suggestedBy: {
        id: "1",
        name: "Emma Watson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
      },
      suggestedAt: "2023-06-15T14:30:00Z",
      whereToWatch: ["Netflix", "Amazon Prime", "HBO Max"],
    },
    {
      id: "2",
      title: "To Kill a Mockingbird",
      type: "book",
      imageUrl:
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&q=80",
      year: "1960",
      creator: "Harper Lee",
      description:
        "The story of racial injustice and the loss of innocence in the American South during the Great Depression.",
      suggestedBy: {
        id: "2",
        name: "John Smith",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
      },
      suggestedAt: "2023-06-10T09:15:00Z",
      whereToRead: ["Amazon", "Barnes & Noble", "Local Library"],
    },
    {
      id: "3",
      title: "Attack on Titan",
      type: "anime",
      imageUrl:
        "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&q=80",
      year: "2013",
      creator: "Hajime Isayama",
      description:
        "In a world where humanity lives within cities surrounded by enormous walls due to the Titans, gigantic humanoid creatures who devour humans seemingly without reason.",
      suggestedBy: {
        id: "3",
        name: "Sophia Chen",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sophia",
      },
      suggestedAt: "2023-06-05T16:45:00Z",
      whereToWatch: ["Crunchyroll", "Funimation", "Netflix"],
    },
    {
      id: "4",
      title: "Bohemian Rhapsody",
      type: "song",
      imageUrl:
        "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80",
      year: "1975",
      creator: "Queen",
      description:
        "A six-minute suite, consisting of several sections without a chorus: an intro, a ballad segment, an operatic passage, a hard rock part and a reflective coda.",
      suggestedBy: {
        id: "4",
        name: "Michael Johnson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=michael",
      },
      suggestedAt: "2023-06-01T11:20:00Z",
      whereToListen: ["Spotify", "Apple Music", "YouTube Music"],
    },
  ];