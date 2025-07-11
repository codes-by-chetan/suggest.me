export interface SavedItem {
  id: string;
  title: string;
  type: string;
  imageUrl: string;
  creator?: string;
  year?: string;
  savedAt: string;
}

export const savedItemsArray : SavedItem[] = [
    {
      id: "s1",
      title: "Interstellar",
      type: "movie",
      imageUrl:
        "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=400&q=80",
      creator: "Christopher Nolan",
      year: "2014",
      savedAt: "2023-06-10",
    },
    {
      id: "s2",
      title: "The Great Gatsby",
      type: "book",
      imageUrl:
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80",
      creator: "F. Scott Fitzgerald",
      year: "1925",
      savedAt: "2023-06-05",
    },
    {
      id: "s3",
      title: "Demon Slayer",
      type: "anime",
      imageUrl:
        "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
      creator: "Koyoharu Gotouge",
      year: "2019",
      savedAt: "2023-05-28",
    },
    {
      id: "s4",
      title: "Bohemian Rhapsody",
      type: "song",
      imageUrl:
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80",
      creator: "Queen",
      year: "1975",
      savedAt: "2023-05-20",
    },
  ]