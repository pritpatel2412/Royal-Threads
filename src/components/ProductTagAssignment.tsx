
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProductTags, useProductTagAssignments, useAssignTagToProduct, useRemoveTagFromProduct } from '@/hooks/useProductTags';
import { useToast } from '@/hooks/use-toast';
import { Plus, X } from 'lucide-react';

interface ProductTagAssignmentProps {
  productId: string;
  productName: string;
}

const ProductTagAssignment = ({ productId, productName }: ProductTagAssignmentProps) => {
  const { data: allTags = [] } = useProductTags();
  const { data: assignments = [] } = useProductTagAssignments(productId);
  const assignTagMutation = useAssignTagToProduct();
  const removeTagMutation = useRemoveTagFromProduct();
  const { toast } = useToast();

  const assignedTagIds = assignments.map(assignment => assignment.tag_id);
  const availableTags = allTags.filter(tag => !assignedTagIds.includes(tag.id));

  const handleAssignTag = (tagId: string) => {
    assignTagMutation.mutate({ productId, tagId }, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Tag assigned to product",
        });
      },
      onError: (error) => {
        console.error('Error assigning tag:', error);
        toast({
          title: "Error",
          description: "Failed to assign tag",
          variant: "destructive",
        });
      },
    });
  };

  const handleRemoveTag = (tagId: string) => {
    removeTagMutation.mutate({ productId, tagId }, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Tag removed from product",
        });
      },
      onError: (error) => {
        console.error('Error removing tag:', error);
        toast({
          title: "Error",
          description: "Failed to remove tag",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Product Tags</CardTitle>
        <p className="text-sm text-gray-600">Manage tags for {productName}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Tags */}
        <div>
          <h4 className="font-medium mb-2">Current Tags</h4>
          <div className="flex flex-wrap gap-2">
            {assignments.length > 0 ? (
              assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center gap-1">
                  <Badge 
                    style={{ 
                      backgroundColor: assignment.product_tags?.color, 
                      color: assignment.product_tags?.text_color,
                      border: 'none'
                    }}
                  >
                    {assignment.product_tags?.name}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTag(assignment.tag_id)}
                    className="h-6 w-6 p-0 hover:bg-red-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No tags assigned</p>
            )}
          </div>
        </div>

        {/* Available Tags */}
        {availableTags.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Available Tags</h4>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <Button
                  key={tag.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAssignTag(tag.id)}
                  className="h-auto p-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  <Badge 
                    style={{ 
                      backgroundColor: tag.color, 
                      color: tag.text_color,
                      border: 'none'
                    }}
                  >
                    {tag.name}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductTagAssignment;
