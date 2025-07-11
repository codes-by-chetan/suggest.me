export interface Post {
  id: string;
  imageUrl: string;
  likes: number;
  comments: number;
  caption?: string;
  date: string;
}

export const myPostsArray : Post[] = [
    {
      id: "1",
      imageUrl:
        "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80",
      likes: 124,
      comments: 8,
      caption: "Amazing sunset at the beach today! #sunset #beach #vacation",
      date: "2023-05-15",
    },
    {
      id: "2",
      imageUrl:
        "https://images.unsplash.com/photo-1682685797661-9e0c87f59c60?w=400&q=80",
      likes: 89,
      comments: 5,
      caption: "Coffee and books, perfect morning! #coffee #reading",
      date: "2023-05-10",
    },
    {
      id: "3",
      imageUrl:
        "https://images.unsplash.com/photo-1493612276216-ee3925520721?w=400&q=80",
      likes: 210,
      comments: 15,
      caption: "Hiking trip with friends! #hiking #nature #friends",
      date: "2023-05-05",
    },
    {
      id: "4",
      imageUrl:
        "https://images.unsplash.com/photo-1674574124649-778f9afc0e9c?w=400&q=80",
      likes: 156,
      comments: 12,
      caption: "New recipe I tried today. #cooking #food #homemade",
      date: "2023-04-28",
    },
    {
      id: "5",
      imageUrl:
        "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80",
      likes: 178,
      comments: 9,
      caption:
        "Beautiful mountain view from my trip last weekend. #mountains #travel",
      date: "2023-04-20",
    },
    {
      id: "6",
      imageUrl:
        "https://images.unsplash.com/photo-1560703650-ef3e0f254ae0?w=400&q=80",
      likes: 95,
      comments: 4,
      caption: "Concert night! #music #live #concert",
      date: "2023-04-15",
    },
  ]