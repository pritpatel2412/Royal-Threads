
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ImageUploadProps {
  productId?: string;
  onImagesUploaded?: (imageUrls: Array<{ url: string; filename: string }>) => void;
  maxImages?: number;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  productId,
  onImagesUploaded,
  maxImages = 5,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; filename: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadImage = async (file: File): Promise<{ url: string; filename: string } | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = productId ? `${productId}/${fileName}` : `temp/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return {
        url: data.publicUrl,
        filename: fileName
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    if (uploadedImages.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `You can only upload up to ${maxImages} images.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = files.map(uploadImage);
      const results = await Promise.all(uploadPromises);
      
      const successfulUploads = results.filter(result => result !== null) as Array<{ url: string; filename: string }>;
      
      if (successfulUploads.length > 0) {
        const newImages = [...uploadedImages, ...successfulUploads];
        setUploadedImages(newImages);
        onImagesUploaded?.(newImages);
        
        toast({
          title: "Success",
          description: `${successfulUploads.length} image(s) uploaded successfully.`,
        });
      }

      if (successfulUploads.length < files.length) {
        toast({
          title: "Partial upload",
          description: `${files.length - successfulUploads.length} image(s) failed to upload.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = async (index: number) => {
    const imageToRemove = uploadedImages[index];
    
    try {
      // Extract the file path from the URL
      const urlParts = imageToRemove.url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'product-images');
      if (bucketIndex !== -1) {
        const filePath = urlParts.slice(bucketIndex + 1).join('/');
        
        await supabase.storage
          .from('product-images')
          .remove([filePath]);
      }

      const newImages = uploadedImages.filter((_, i) => i !== index);
      setUploadedImages(newImages);
      onImagesUploaded?.(newImages);
      
      toast({
        title: "Image removed",
        description: "Image has been successfully removed.",
      });
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: "Error",
        description: "Failed to remove image. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <Label htmlFor="image-upload">Product Images</Label>
        <div className="mt-2">
          <Input
            ref={fileInputRef}
            id="image-upload"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading || uploadedImages.length >= maxImages}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || uploadedImages.length >= maxImages}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : `Upload Images (${uploadedImages.length}/${maxImages})`}
          </Button>
        </div>
      </div>

      {/* Image Preview Grid */}
      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {uploadedImages.map((image, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-2">
                <div className="aspect-square relative overflow-hidden rounded-md">
                  <img
                    src={image.url}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 truncate">
                  {image.filename}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {uploadedImages.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">
              No images uploaded yet.<br />
              Click the button above to add product images.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImageUpload;
