import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const mockData: Record<string, ContentItem[]> = {
  movie: [
    {
      id: "m1",
      title: "The Shawshank Redemption",
      type: "movie",
      imageUrl:
        "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=300&q=80",
      year: "1994",
      creator: "Frank Darabont",
      description:
        "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    },
    {
      id: "m2",
      title: "The Godfather",
      type: "movie",
      imageUrl:
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&q=80",
      year: "1972",
      creator: "Francis Ford Coppola",
      description:
        "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
    },
    {
      id: "m3",
      title: "The Dark Knight",
      type: "movie",
      imageUrl:
        "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=300&q=80",
      year: "2008",
      creator: "Christopher Nolan",
      description:
        "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    },
  ],
  book: [
    {
      id: "b1",
      title: "To Kill a Mockingbird",
      type: "book",
      imageUrl:
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&q=80",
      year: "1960",
      creator: "Harper Lee",
      description:
        "The story of racial injustice and the loss of innocence in the American South during the Great Depression.",
    },
    {
      id: "b2",
      title: "1984",
      type: "book",
      imageUrl:
        "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&q=80",
      year: "1949",
      creator: "George Orwell",
      description:
        "A dystopian social science fiction novel and cautionary tale set in a totalitarian state.",
    },
  ],
  anime: [
    {
      id: "a1",
      title: "Attack on Titan",
      type: "anime",
      imageUrl:
        "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&q=80",
      year: "2013",
      creator: "Hajime Isayama",
      description:
        "In a world where humanity lives within cities surrounded by enormous walls due to the Titans, gigantic humanoid creatures who devour humans seemingly without reason.",
    },
    {
      id: "a2",
      title: "Death Note",
      type: "anime",
      imageUrl:
        "https://images.unsplash.com/photo-1601850494422-3cf14624b0b3?w=300&q=80",
      year: "2006",
      creator: "Tsugumi Ohba",
      description:
        "A high school student discovers a supernatural notebook that allows him to kill anyone by writing the victim's name while picturing their face.",
    },
  ],
  song: [
    {
      id: "s1",
      title: "Bohemian Rhapsody",
      type: "song",
      imageUrl:
        "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80",
      year: "1975",
      creator: "Queen",
      description:
        "A six-minute suite, consisting of several sections without a chorus: an intro, a ballad segment, an operatic passage, a hard rock part and a reflective coda.",
    },
    {
      id: "s2",
      title: "Imagine",
      type: "song",
      imageUrl:
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&q=80",
      year: "1971",
      creator: "John Lennon",
      description:
        "A song co-produced by John Lennon, Yoko Ono, and Phil Spector, encouraging listeners to imagine a world of peace.",
    },
  ],
};


interface ContentSearchProps {
  contentType?: string;
  onSelect?: (content: ContentItem) => void;
}

interface ContentItem {
  id: string;
  title: string;
  type: string;
  imageUrl?: string;
  year?: string;
  creator?: string;
  description?: string;
}

const ContentSearch = ({
  contentType = "movie",
  onSelect = () => {},
}: ContentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for different content types
  

  useEffect(() => {
    // Simulate API call with mock data
    if (searchQuery.length > 2) {
      setIsLoading(true);

      // Simulate network delay
      const timer = setTimeout(() => {
        const filteredResults =
          mockData[contentType]?.filter((item) =>{
            return item.title.toLowerCase().includes(searchQuery.toLowerCase())
      }) || [];
        setSearchResults(filteredResults);
        setIsLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, contentType]);

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSelectContent = (content: ContentItem) => {
    onSelect(content);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="w-full bg-white dark:bg-muted p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Search for {contentType}</h2>

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search for ${contentType}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="mt-2 text-sm text-muted-foreground">Searching...</div>
        )}

        {searchResults.length > 0 && (
          <div className="mt-2 border rounded-md max-h-[300px] overflow-y-auto">
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="flex items-start p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b last:border-b-0"
                onClick={() => handleSelectContent(result)}
              >
                {result.imageUrl && (
                  <div className="flex-shrink-0 mr-3">
                    <img
                      src={result.imageUrl}
                      alt={result.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{result.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {result.creator} • {result.year}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {result.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {searchQuery.length > 2 && searchResults.length === 0 && !isLoading && (
          <div className="mt-2 p-3 text-sm text-muted-foreground border rounded-md">
            No {contentType}s found matching "{searchQuery}".
            <Button variant="link" className="px-1 h-auto" onClick={() => {}}>
              Add new {contentType}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>Search for existing {contentType}s or add a new one if not found.</p>
      </div>
    </div>
  );
};

export default ContentSearch;
