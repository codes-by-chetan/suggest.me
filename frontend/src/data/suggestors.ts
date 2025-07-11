export interface Suggestor {
    id: string;
    name: string;
    avatar?: string;
    suggestionCount: number;
    [key: string] : any
  }
  
export const suggestorsArray : Suggestor[] = [
    {
        id: "1",
        name: "Emma Watson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
        suggestionCount: 12,
        email: "emma.watson@example.com",
        location: "London, UK",
        joinDate: "2023-01-15",
        bio: "Actor and activist passionate about education and equality.",
        friendsCount: 230,
        postsCount: 45,
        followingCount: 180
    },
    {
        id: "2",
        name: "John Smith",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
        suggestionCount: 8,
        email: "john.smith@example.com",
        location: "New York, USA",
        joinDate: "2022-11-20",
        bio: "Software developer with a love for open-source projects.",
        friendsCount: 150,
        postsCount: 30,
        followingCount: 120
    },
    {
        id: "3",
        name: "Sophia Chen",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sophia",
        suggestionCount: 15,
        email: "sophia.chen@example.com",
        location: "Shanghai, China",
        joinDate: "2023-03-10",
        bio: "Graphic designer and illustrator inspired by nature.",
        friendsCount: 300,
        postsCount: 60,
        followingCount: 250
    },
    {
        id: "4",
        name: "Michael Johnson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=michael",
        suggestionCount: 6,
        email: "michael.johnson@example.com",
        location: "Sydney, Australia",
        joinDate: "2022-09-05",
        bio: "Fitness enthusiast and personal trainer.",
        friendsCount: 100,
        postsCount: 20,
        followingCount: 80
    },
    {
        id: "5",
        name: "Olivia Parker",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=olivia",
        suggestionCount: 10,
        email: "olivia.parker@example.com",
        location: "Toronto, Canada",
        joinDate: "2023-02-25",
        bio: "Travel blogger exploring the world one city at a time.",
        friendsCount: 200,
        postsCount: 50,
        followingCount: 170
    },
    {
        id: "6",
        name: "David Kim",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
        suggestionCount: 9,
        email: "david.kim@example.com",
        location: "Seoul, South Korea",
        joinDate: "2022-12-30",
        bio: "Music producer and DJ with a passion for electronic beats.",
        friendsCount: 180,
        postsCount: 35,
        followingCount: 140
    }
]