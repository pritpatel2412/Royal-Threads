
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Palette } from 'lucide-react';
import { useProductTags, useCreateProductTag, useUpdateProductTag, useDeleteProductTag } from '@/hooks/useProductTags';
import { Tables } from '@/integrations/supabase/types';

type ProductTag = Tables<'product_tags'>;

const AdminProductTagManagement = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<ProductTag | null>(null);
  const { toast } = useToast();

  const { data: tags = [], isLoading } = useProductTags();
  const createTagMutation = useCreateProductTag();
  const updateTagMutation = useUpdateProductTag();
  const deleteTagMutation = useDeleteProductTag();

  const TagForm = ({ tag, onSubmit }: { tag?: ProductTag; onSubmit: (data: any) => void }) => {
    const [formData, setFormData] = useState({
      name: tag?.name || '',
      color: tag?.color || '#3b82f6',
      text_color: tag?.text_color || '#ffffff',
      sort_order: tag?.sort_order || 0,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Tag Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Demanding, New Arrival"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="color">Background Color</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-16 h-10 p-1 border rounded"
              />
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="text_color">Text Color</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="text_color"
                type="color"
                value={formData.text_color}
                onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                className="w-16 h-10 p-1 border rounded"
              />
              <Input
                value={formData.text_color}
                onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                placeholder="#ffffff"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="sort_order">Sort Order</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
            min="0"
          />
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <Label>Preview</Label>
          <div className="mt-2">
            <Badge 
              style={{ 
                backgroundColor: formData.color, 
                color: formData.text_color,
                border: 'none'
              }}
            >
              {formData.name || 'Tag Name'}
            </Badge>
          </div>
        </div>

        <Button type="submit" className="w-full">
          {tag ? 'Update Tag' : 'Create Tag'}
        </Button>
      </form>
    );
  };

  const handleCreateTag = (data: any) => {
    createTagMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Tag created successfully",
        });
        setIsCreateDialogOpen(false);
      },
      onError: (error) => {
        console.error('Error creating tag:', error);
        toast({
          title: "Error",
          description: "Failed to create tag",
          variant: "destructive",
        });
      },
    });
  };

  const handleUpdateTag = (data: any) => {
    if (!editingTag) return;
    
    updateTagMutation.mutate({ id: editingTag.id, ...data }, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Tag updated successfully",
        });
        setEditingTag(null);
      },
      onError: (error) => {
        console.error('Error updating tag:', error);
        toast({
          title: "Error",
          description: "Failed to update tag",
          variant: "destructive",
        });
      },
    });
  };

  const handleDeleteTag = (id: string) => {
    if (confirm('Are you sure you want to delete this tag? This will remove it from all products.')) {
      deleteTagMutation.mutate(id, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Tag deleted successfully",
          });
        },
        onError: (error) => {
          console.error('Error deleting tag:', error);
          toast({
            title: "Error",
            description: "Failed to delete tag",
            variant: "destructive",
          });
        },
      });
    }
  };

  if (isLoading) {
    return <div>Loading tags...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">Product Tag Management</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
            </DialogHeader>
            <TagForm onSubmit={handleCreateTag} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Available Tags ({tags.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Colors</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <Badge 
                      style={{ 
                        backgroundColor: tag.color, 
                        color: tag.text_color,
                        border: 'none'
                      }}
                    >
                      {tag.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 items-center">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: tag.color }}
                        title={`Background: ${tag.color}`}
                      />
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: tag.text_color }}
                        title={`Text: ${tag.text_color}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell>{tag.sort_order}</TableCell>
                  <TableCell>
                    <Badge variant={tag.is_active ? 'default' : 'secondary'}>
                      {tag.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTag(tag)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTag(tag.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingTag} onOpenChange={() => setEditingTag(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          {editingTag && (
            <TagForm tag={editingTag} onSubmit={handleUpdateTag} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProductTagManagement;
