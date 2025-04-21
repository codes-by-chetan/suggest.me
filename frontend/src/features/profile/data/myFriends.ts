export interface Friend {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  mutualFriends?: number;
}


export const myFriendsArray : Friend[] = [
    {
      id: "1",
      name: "Emma Watson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
      email: "emma@example.com",
      mutualFriends: 5,
    },
    {
      id: "2",
      name: "John Smith",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
      email: "john@example.com",
      mutualFriends: 3,
    },
    {
      id: "3",
      name: "Sophia Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sophia",
      email: "sophia@example.com",
      mutualFriends: 7,
    },
    {
      id: "4",
      name: "Michael Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=michael",
      email: "michael@example.com",
      mutualFriends: 2,
    },
  ]