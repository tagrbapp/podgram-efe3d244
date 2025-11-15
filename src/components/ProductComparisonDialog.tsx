import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, MapPin, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  title: string;
  price: number;
  location: string;
  views: number;
  images: string[];
  description: string;
  category: {
    name: string;
  };
}

interface ProductComparisonDialogProps {
  products: Product[];
  open: boolean;
  onClose: () => void;
  onRemove: (id: string) => void;
}

const ProductComparisonDialog = ({ products, open, onClose, onRemove }: ProductComparisonDialogProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">مقارنة المنتجات</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {products.map((product) => (
            <div key={product.id} className="relative bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Remove Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(product.id)}
                className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white rounded-full h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Image */}
              <div className="aspect-square bg-gray-50">
                <img
                  src={product.images?.[0] || "/placeholder.svg"}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Category */}
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-qultura-blue/10 text-qultura-blue rounded-full">
                    {product.category.name}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-base line-clamp-2">{product.title}</h3>

                {/* Price */}
                <p className="text-2xl font-bold text-qultura-blue">
                  {product.price.toLocaleString('ar-SA')} ريال
                </p>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-qultura-blue" />
                  <span>{product.location}</span>
                </div>

                {/* Views */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4 text-qultura-blue" />
                  <span>{product.views} مشاهدة</span>
                </div>

                {/* Description Preview */}
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {product.description || "لا يوجد وصف"}
                </p>

                {/* View Button */}
                <Button
                  onClick={() => {
                    navigate(`/listing/${product.id}`);
                    onClose();
                  }}
                  className="w-full bg-qultura-blue hover:bg-qultura-blue/90"
                >
                  عرض التفاصيل
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductComparisonDialog;
