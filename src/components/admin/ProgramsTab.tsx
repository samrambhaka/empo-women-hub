import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Program {
  id: string;
  category_id: string;
  name_english: string;
  name_malayalam: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
}

interface Category {
  id: string;
  name_english: string;
  name_malayalam: string;
}

const ProgramsTab = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [formData, setFormData] = useState({
    category_id: '',
    name_english: '',
    name_malayalam: '',
    description: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchCategories();
    fetchPrograms();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('categories')
        .select('id, name_english, name_malayalam')
        .eq('is_active', true)
        .order('name_english');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchPrograms = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('programs')
        .select('*')
        .order('category_id')
        .order('display_order');

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error('Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      name_english: '',
      name_malayalam: '',
      description: '',
      display_order: 0,
      is_active: true,
    });
    setEditingProgram(null);
  };

  const handleAddNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setFormData({
      category_id: program.category_id,
      name_english: program.name_english,
      name_malayalam: program.name_malayalam,
      description: program.description || '',
      display_order: program.display_order,
      is_active: program.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category_id || !formData.name_english || !formData.name_malayalam) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingProgram) {
        const { error } = await (supabase as any)
          .from('programs')
          .update(formData)
          .eq('id', editingProgram.id);

        if (error) throw error;
        toast.success('Program updated successfully');
      } else {
        const { error } = await (supabase as any)
          .from('programs')
          .insert([formData]);

        if (error) throw error;
        toast.success('Program created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchPrograms();
    } catch (error) {
      console.error('Error saving program:', error);
      toast.error('Failed to save program');
    }
  };

  const toggleProgramStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('programs')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success('Program status updated');
      fetchPrograms();
    } catch (error) {
      console.error('Error updating program status:', error);
      toast.error('Failed to update program status');
    }
  };

  const deleteProgram = async (id: string) => {
    if (!confirm('Are you sure you want to delete this program?')) return;

    try {
      const { error } = await (supabase as any)
        .from('programs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Program deleted successfully');
      fetchPrograms();
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error('Failed to delete program');
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name_english || 'Unknown Category';
  };

  const groupedPrograms = programs.reduce((acc, program) => {
    const categoryId = program.category_id;
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(program);
    return acc;
  }, {} as Record<string, Program[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Programs & Sub-Categories</CardTitle>
              <CardDescription>Manage programs and sub-categories for job categories</CardDescription>
            </div>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Program
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading programs...</p>
          ) : Object.keys(groupedPrograms).length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No programs added yet.</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedPrograms).map(([categoryId, categoryPrograms]) => (
                <div key={categoryId} className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">{getCategoryName(categoryId)}</h3>
                  <div className="space-y-2">
                    {categoryPrograms.map((program) => (
                      <div
                        key={program.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{program.name_english}</p>
                          <p className="text-sm text-muted-foreground">{program.name_malayalam}</p>
                          {program.description && (
                            <p className="text-xs text-muted-foreground mt-1">{program.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={program.is_active}
                            onCheckedChange={() => toggleProgramStatus(program.id, program.is_active)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(program)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => deleteProgram(program.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProgram ? 'Edit Program' : 'Add New Program'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name_english}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name_english">English Name *</Label>
              <Input
                id="name_english"
                value={formData.name_english}
                onChange={(e) => setFormData({ ...formData, name_english: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="name_malayalam">Malayalam Name *</Label>
              <Input
                id="name_malayalam"
                value={formData.name_malayalam}
                onChange={(e) => setFormData({ ...formData, name_malayalam: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingProgram ? 'Update' : 'Create'} Program
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProgramsTab;
