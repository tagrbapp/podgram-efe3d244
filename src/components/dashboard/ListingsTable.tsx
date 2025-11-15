import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, MoreVertical, Trash2, Link as LinkIcon, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  status: string;
  views: number;
  created_at: string;
  images: string[] | null;
  categories: {
    name: string;
  } | null;
}

interface ListingsTableProps {
  listings: Listing[];
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

export const ListingsTable = ({ listings, onDelete, onStatusChange }: ListingsTableProps) => {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "الآن";
    if (seconds < 3600) return `منذ ${Math.floor(seconds / 60)} دقيقة`;
    if (seconds < 86400) return `منذ ${Math.floor(seconds / 3600)} ساعة`;
    return `منذ ${Math.floor(seconds / 86400)} يوم`;
  };

  const copyListingLink = (id: string) => {
    const url = `${window.location.origin}/listing/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("تم نسخ رابط الإعلان");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">نشط</Badge>;
      case "sold":
        return <Badge className="bg-blue-500">مباع</Badge>;
      case "inactive":
        return <Badge variant="secondary">غير نشط</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-xl text-muted-foreground">لا توجد إعلانات</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {listings.map((listing) => (
          <Card key={listing.id} className="p-4 hover:shadow-lg transition-all">
            <div className="flex gap-4">
              {/* صورة الإعلان */}
              <div
                className="w-24 h-24 rounded-lg overflow-hidden bg-muted cursor-pointer flex-shrink-0"
                onClick={() => navigate(`/listing/${listing.id}`)}
              >
                {listing.images && listing.images.length > 0 ? (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover hover:scale-110 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-muted-foreground text-xs">لا توجد صورة</span>
                  </div>
                )}
              </div>

              {/* معلومات الإعلان */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <h3
                      className="font-semibold text-lg mb-1 cursor-pointer hover:text-primary transition-colors line-clamp-1"
                      onClick={() => navigate(`/listing/${listing.id}`)}
                    >
                      {listing.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      <span className="font-medium text-lg text-primary">
                        {listing.price.toLocaleString("ar-SA")} ريال
                      </span>
                      <span>•</span>
                      <span>{listing.location}</span>
                      <span>•</span>
                      <span>{listing.categories?.name || "غير محدد"}</span>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/listing/${listing.id}`)}>
                        <Eye className="ml-2 h-4 w-4" />
                        عرض الإعلان
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyListingLink(listing.id)}>
                        <LinkIcon className="ml-2 h-4 w-4" />
                        نسخ الرابط
                      </DropdownMenuItem>
                      {listing.status === "active" && (
                        <DropdownMenuItem onClick={() => onStatusChange(listing.id, "sold")}>
                          <CheckCircle className="ml-2 h-4 w-4" />
                          تعيين كمباع
                        </DropdownMenuItem>
                      )}
                      {listing.status !== "inactive" && (
                        <DropdownMenuItem onClick={() => onStatusChange(listing.id, "inactive")}>
                          <XCircle className="ml-2 h-4 w-4" />
                          إلغاء التنشيط
                        </DropdownMenuItem>
                      )}
                      {listing.status !== "active" && (
                        <DropdownMenuItem onClick={() => onStatusChange(listing.id, "active")}>
                          <CheckCircle className="ml-2 h-4 w-4" />
                          تفعيل
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteId(listing.id)}
                      >
                        <Trash2 className="ml-2 h-4 w-4" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-4 mt-3">
                  {getStatusBadge(listing.status)}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>{listing.views} مشاهدة</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {getTimeAgo(listing.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف الإعلان نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const Package = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16.5 9.4 7.55 4.24" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.29 7 12 12 20.71 7" />
    <line x1="12" x2="12" y1="22" y2="12" />
  </svg>
);
