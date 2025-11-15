import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";

interface ListingCardProps {
  title: string;
  price: string;
  location: string;
  time: string;
  image: string;
  category: string;
}

const ListingCard = ({ title, price, location, time, image, category }: ListingCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-elegant transition-smooth cursor-pointer group">
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground line-clamp-2 flex-1">{title}</h3>
          <Badge variant="secondary" className="shrink-0">{category}</Badge>
        </div>
        <p className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-3">
          {price} ريال
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{time}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ListingCard;
