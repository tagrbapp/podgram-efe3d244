import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface ActionCardProps {
  title: string;
  image: string;
  bgColor: string;
}

const ActionCard = ({ title, image, bgColor }: ActionCardProps) => {
  return (
    <Card
      className={`${bgColor} relative overflow-hidden rounded-2xl border-0 cursor-pointer group transition-smooth hover:scale-105 aspect-[3/4]`}
    >
      <div className="absolute inset-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover opacity-60 group-hover:opacity-50 transition-smooth"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      
      <div className="absolute top-4 left-4">
        <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 text-white" />
        </div>
      </div>

      <div className="absolute bottom-6 right-6 left-6">
        <h3 className="text-white text-xl font-bold">{title}</h3>
      </div>
    </Card>
  );
};

export default ActionCard;
