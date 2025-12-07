import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImagePlus, X, Upload, Loader2, Home, FileImage, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminAuctionImageUploadProps {
  auctionId: string;
  existingImages: string[];
  homepageImage: string | null;
  onImagesUpdated: () => void;
}

export const AdminAuctionImageUpload = ({
  auctionId,
  existingImages,
  homepageImage,
  onImagesUpdated,
}: AdminAuctionImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploadType, setUploadType] = useState<"both" | "homepage" | "detail">("both");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

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

      // Prepare update based on upload type
      const updateData: Record<string, any> = {};

      if (uploadType === "both") {
        // Add to detail images
        updateData.images = [...existingImages, ...uploadedUrls];
        // Set first as homepage if no homepage image exists
        if (!homepageImage) {
          updateData.homepage_image = uploadedUrls[0];
        }
      } else if (uploadType === "homepage") {
        // Only update homepage image (use first uploaded)
        updateData.homepage_image = uploadedUrls[0];
      } else if (uploadType === "detail") {
        // Only add to detail images
        updateData.images = [...existingImages, ...uploadedUrls];
      }

      const { error: updateError } = await supabase
        .from("auctions")
        .update(updateData)
        .eq("id", auctionId);

      if (updateError) throw updateError;

      toast.success(`تم رفع ${uploadedUrls.length} صورة بنجاح`);
      
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

  const setAsHomepageImage = async (imageUrl: string) => {
    try {
      const { error } = await supabase
        .from("auctions")
        .update({ homepage_image: imageUrl })
        .eq("id", auctionId);

      if (error) throw error;

      toast.success("تم تعيين الصورة كصورة رئيسية");
      onImagesUpdated();
    } catch (error) {
      console.error("Error setting homepage image:", error);
      toast.error("فشل تعيين الصورة الرئيسية");
    }
  };

  const removeExistingImage = async (imageUrl: string) => {
    if (existingImages.length <= 1 && !homepageImage) {
      toast.error("لا يمكن حذف آخر صورة");
      return;
    }

    try {
      const newImages = existingImages.filter((img) => img !== imageUrl);
      const updateData: Record<string, any> = { images: newImages };
      
      // If removing the homepage image, clear it
      if (homepageImage === imageUrl) {
        updateData.homepage_image = newImages[0] || null;
      }

      const { error } = await supabase
        .from("auctions")
        .update(updateData)
        .eq("id", auctionId);

      if (error) throw error;

      toast.success("تم حذف الصورة بنجاح");
      onImagesUpdated();
    } catch (error) {
      console.error("Error removing image:", error);
      toast.error("فشل حذف الصورة");
    }
  };

  const removeHomepageImage = async () => {
    try {
      const { error } = await supabase
        .from("auctions")
        .update({ homepage_image: null })
        .eq("id", auctionId);

      if (error) throw error;

      toast.success("تم إزالة الصورة الرئيسية");
      onImagesUpdated();
    } catch (error) {
      console.error("Error removing homepage image:", error);
      toast.error("فشل إزالة الصورة الرئيسية");
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

        {/* Homepage Image Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">صورة الرئيسية (الكارد):</p>
          </div>
          {homepageImage ? (
            <div className="relative group w-32">
              <img
                src={homepageImage}
                alt="صورة الرئيسية"
                className="w-full h-20 object-cover rounded-lg border-2 border-primary"
              />
              <Badge className="absolute top-1 right-1 text-xs" variant="default">
                <Star className="h-3 w-3 ml-1" />
                رئيسية
              </Badge>
              <button
                onClick={removeHomepageImage}
                className="absolute -top-2 -left-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">لم يتم تعيين صورة رئيسية - سيتم استخدام أول صورة من صفحة العرض</p>
          )}
        </div>

        {/* Detail Images Section */}
        {existingImages.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileImage className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">صور صفحة العرض:</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {existingImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`صورة ${index + 1}`}
                    className={`w-full h-20 object-cover rounded-lg ${homepageImage === image ? 'border-2 border-primary' : ''}`}
                  />
                  {homepageImage === image && (
                    <Badge className="absolute top-1 right-1 text-xs" variant="default">
                      <Star className="h-3 w-3" />
                    </Badge>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                    <button
                      onClick={() => setAsHomepageImage(image)}
                      className="bg-primary text-primary-foreground rounded-full p-1.5 hover:bg-primary/80"
                      title="تعيين كصورة رئيسية"
                    >
                      <Home className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeExistingImage(image)}
                      className="bg-destructive text-destructive-foreground rounded-full p-1.5 hover:bg-destructive/80"
                      title="حذف"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
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
                    className="w-full h-20 object-cover rounded-lg border-2 border-dashed border-primary/50"
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

        {/* Upload Type Selection */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={uploadType === "both" ? "default" : "outline"}
            size="sm"
            onClick={() => setUploadType("both")}
          >
            <Home className="h-4 w-4 ml-1" />
            <FileImage className="h-4 w-4 ml-2" />
            الكل
          </Button>
          <Button
            variant={uploadType === "homepage" ? "default" : "outline"}
            size="sm"
            onClick={() => setUploadType("homepage")}
          >
            <Home className="h-4 w-4 ml-2" />
            للرئيسية فقط
          </Button>
          <Button
            variant={uploadType === "detail" ? "default" : "outline"}
            size="sm"
            onClick={() => setUploadType("detail")}
          >
            <FileImage className="h-4 w-4 ml-2" />
            للعرض فقط
          </Button>
        </div>

        {/* Upload Controls */}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={uploadType !== "homepage"}
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

        <p className="text-xs text-muted-foreground">
          💡 في حال رفع صورة واحدة فقط، ستُستخدم للرئيسية وصفحة العرض معاً
        </p>
      </div>
    </Card>
  );
};
