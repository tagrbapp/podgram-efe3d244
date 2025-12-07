import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImagePlus, X, Upload, Loader2 } from "lucide-react";

interface AdminAuctionImageUploadProps {
  auctionId: string;
  existingImages: string[];
  onImagesUpdated: () => void;
}

export const AdminAuctionImageUpload = ({
  auctionId,
  existingImages,
  onImagesUpdated,
}: AdminAuctionImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Create preview URLs
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages((prev) => [...prev, ...newPreviews]);
    setFilesToUpload((prev) => [...prev, ...files]);
  };

  const removePreviewImage = (index: number) => {
    URL.revokeObjectURL(previewImages[index]);
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    setFilesToUpload((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (filesToUpload.length === 0) {
      toast.error("يرجى اختيار صور للرفع");
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of filesToUpload) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${auctionId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from("auction-images")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("auction-images")
          .getPublicUrl(data.path);

        uploadedUrls.push(urlData.publicUrl);
      }

      // Update auction with new images
      const newImages = [...existingImages, ...uploadedUrls];
      const { error: updateError } = await supabase
        .from("auctions")
        .update({ images: newImages })
        .eq("id", auctionId);

      if (updateError) throw updateError;

      toast.success(`تم رفع ${uploadedUrls.length} صورة بنجاح`);
      
      // Cleanup
      previewImages.forEach((url) => URL.revokeObjectURL(url));
      setPreviewImages([]);
      setFilesToUpload([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      onImagesUpdated();
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("فشل رفع الصور");
    } finally {
      setIsUploading(false);
    }
  };

  const removeExistingImage = async (imageUrl: string) => {
    if (existingImages.length <= 1) {
      toast.error("لا يمكن حذف آخر صورة");
      return;
    }

    try {
      const newImages = existingImages.filter((img) => img !== imageUrl);
      const { error } = await supabase
        .from("auctions")
        .update({ images: newImages })
        .eq("id", auctionId);

      if (error) throw error;

      toast.success("تم حذف الصورة بنجاح");
      onImagesUpdated();
    } catch (error) {
      console.error("Error removing image:", error);
      toast.error("فشل حذف الصورة");
    }
  };

  return (
    <Card className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <ImagePlus className="h-5 w-5" />
            إدارة صور المزاد
          </h3>
        </div>

        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">الصور الحالية:</p>
            <div className="grid grid-cols-4 gap-2">
              {existingImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`صورة ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeExistingImage(image)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview Images */}
        {previewImages.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">صور جديدة للرفع:</p>
            <div className="grid grid-cols-4 gap-2">
              {previewImages.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`معاينة ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg border-2 border-primary/50"
                  />
                  <button
                    onClick={() => removePreviewImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Controls */}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1"
          >
            <ImagePlus className="h-4 w-4 ml-2" />
            اختيار صور
          </Button>
          {filesToUpload.length > 0 && (
            <Button
              onClick={uploadImages}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الرفع...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 ml-2" />
                  رفع ({filesToUpload.length})
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
