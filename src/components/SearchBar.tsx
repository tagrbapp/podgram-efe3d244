import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

interface Category {
  id: string;
  name: string;
}

const SearchBar = ({ value, onChange, onSearch }: SearchBarProps) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      
      if (data) setCategories(data);
    };
    
    fetchCategories();
  }, []);
  return (
    <div className="relative w-full max-w-2xl">
      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full h-14 overflow-hidden hover:border-qultura-blue transition-smooth">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-full rounded-none border-l border-gray-200 px-6 text-sm text-gray-700 hover:text-qultura-blue hover:bg-transparent"
            >
              جميع الفئات
              <ChevronDown className="h-4 w-4 mr-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {categories.map((category) => (
              <DropdownMenuItem key={category.id}>
                {category.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1 flex items-center px-4">
          <Input
            type="text"
            placeholder="ابحث بين 10,000 منتج"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && onSearch()}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-gray-400"
          />
        </div>

        <Button
          onClick={onSearch}
          size="icon"
          className="h-10 w-10 rounded-full bg-qultura-blue hover:bg-qultura-blue/90 ml-2"
        >
          <Search className="h-4 w-4 text-white" />
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;
