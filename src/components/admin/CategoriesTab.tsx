import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const categoryColors = [
  'blue', 'green', 'purple', 'orange', 'pink', 'indigo'
];

const getCategoryColor = (index: number) => {
  return categoryColors[index % categoryColors.length];
};

interface Category {
  id: string;
  name_english: string;
  name_malayalam: string;
  description: string;
  actual_fee: number;
  offer_fee: number;
  expiry_days: number;
  is_active: boolean;
  qr_code_url?: string;
  offer_start_date?: string;
  offer_end_date?: string;
}

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  created_at?: string;
}

interface Program {
  id: string;
  category_id: string;
  sub_category_id: string;
  name: string;
  description?: string;
  is_top: boolean;
  priority: number;
  created_at?: string;
}

const CategoriesTab = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name_english: '',
    name_malayalam: '',
    description: '',
    actual_fee: 0,
    offer_fee: 0,
    expiry_days: 30,
    offer_start_date: '',
    offer_end_date: ''
  });
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  
  // Subcategory state
  const [subcategories, setSubcategories] = useState<Record<string, Subcategory[]>>({});
  const [showSubcategoryDialog, setShowSubcategoryDialog] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [subcategoryFormData, setSubcategoryFormData] = useState({
    name: ''
  });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({});

  // Program state
  const [programs, setPrograms] = useState<Record<string, Program[]>>({});
  const [showProgramDialog, setShowProgramDialog] = useState(false);
  const [currentSubcategoryId, setCurrentSubcategoryId] = useState<string | null>(null);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [programFormData, setProgramFormData] = useState({
    name: '',
    description: '',
    is_top: false,
    priority: 0
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('sub_categories')
        .select('*')
        .eq('category_id', categoryId)
        .order('name', { ascending: true });

      if (error) throw error;
      
      setSubcategories(prev => ({
        ...prev,
        [categoryId]: data || []
      }));
    } catch (error) {
      toast.error('Error fetching subcategories');
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
    
    if (!expandedCategories[categoryId] && !subcategories[categoryId]) {
      fetchSubcategories(categoryId);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Error fetching categories');
      } else {
        setCategories(data || []);
      }
    } catch (error) {
      toast.error('Error fetching categories');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name_english: '',
      name_malayalam: '',
      description: '',
      actual_fee: 0,
      offer_fee: 0,
      expiry_days: 30,
      offer_start_date: '',
      offer_end_date: ''
    });
    setEditingCategory(null);
    setQrFile(null);
    setQrPreview(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowDialog(true);
  };

  const handleEdit = async (category: Category) => {
    setFormData({
      name_english: category.name_english,
      name_malayalam: category.name_malayalam,
      description: category.description || '',
      actual_fee: category.actual_fee,
      offer_fee: category.offer_fee,
      expiry_days: category.expiry_days,
      offer_start_date: category.offer_start_date || '',
      offer_end_date: category.offer_end_date || ''
    });
    setEditingCategory(category);
    setQrFile(null);
    
    // Load existing QR image if it exists
    if (category.qr_code_url) {
      setQrPreview(category.qr_code_url);
    } else {
      setQrPreview(null);
    }
    
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name_english || !formData.name_malayalam) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const bucket = 'category-qr';

      if (editingCategory) {
        // Update category basic fields
        const { error } = await supabase
          .from('categories')
          .update({
            name_english: formData.name_english,
            name_malayalam: formData.name_malayalam,
            description: formData.description,
            actual_fee: formData.actual_fee,
            offer_fee: formData.offer_fee,
            expiry_days: formData.expiry_days,
            offer_start_date: formData.offer_start_date || null,
            offer_end_date: formData.offer_end_date || null,
          })
          .eq('id', editingCategory.id);

        if (error) {
          toast.error('Error updating category');
          return;
        }

        // Upload QR if a file is selected
        if (qrFile) {
          const path = `${editingCategory.id}/payment-qr.png`;
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(path, qrFile, { upsert: true });

          if (uploadError) {
            toast.error('Failed to upload QR image');
          } else {
            // Get the public URL and update the database
            const { data: urlData } = supabase.storage
              .from(bucket)
              .getPublicUrl(path);
            
            const { error: updateError } = await supabase
              .from('categories')
              .update({ qr_code_url: urlData.publicUrl })
              .eq('id', editingCategory.id);
              
            if (updateError) {
              toast.error('Failed to save QR URL to database');
            } else {
              toast.success('QR image saved for this category');
            }
          }
        }

        toast.success('Category updated successfully');
        setShowDialog(false);
        fetchCategories();
        resetForm();
      } else {
        // Create category first to get an ID
        const { data: created, error } = await supabase
          .from('categories')
          .insert({
            name_english: formData.name_english,
            name_malayalam: formData.name_malayalam,
            description: formData.description,
            actual_fee: formData.actual_fee,
            offer_fee: formData.offer_fee,
            expiry_days: formData.expiry_days,
            offer_start_date: formData.offer_start_date || null,
            offer_end_date: formData.offer_end_date || null,
          })
          .select('id')
          .single();

        if (error) {
          toast.error('Error creating category');
          return;
        }

        // If a QR file was selected during creation, upload it now
        if (qrFile && created?.id) {
          const path = `${created.id}/payment-qr.png`;
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(path, qrFile, { upsert: true });

          if (uploadError) {
            toast.error('Failed to upload QR image');
          } else {
            // Get the public URL and update the database
            const { data: urlData } = supabase.storage
              .from(bucket)
              .getPublicUrl(path);
            
            const { error: updateError } = await supabase
              .from('categories')
              .update({ qr_code_url: urlData.publicUrl })
              .eq('id', created.id);
              
            if (updateError) {
              toast.error('Failed to save QR URL to database');
            }
          }
        }

        toast.success('Category created successfully');
        setShowDialog(false);
        fetchCategories();
        resetForm();
      }
    } catch (error) {
      toast.error('Error saving category');
    }
  };

  const toggleCategoryStatus = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      if (error) {
        toast.error('Error updating category status');
      } else {
        toast.success('Category status updated');
        fetchCategories();
      }
    } catch (error) {
      toast.error('Error updating category status');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Error deleting category');
      } else {
        toast.success('Category deleted successfully');
        fetchCategories();
      }
    } catch (error) {
      toast.error('Error deleting category');
    }
  };

  // Subcategory functions
  const handleAddSubcategory = (categoryId: string) => {
    setCurrentCategoryId(categoryId);
    setEditingSubcategory(null);
    setSubcategoryFormData({
      name: ''
    });
    setShowSubcategoryDialog(true);
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setCurrentCategoryId(subcategory.category_id);
    setEditingSubcategory(subcategory);
    setSubcategoryFormData({
      name: subcategory.name
    });
    setShowSubcategoryDialog(true);
  };

  const handleSubmitSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subcategoryFormData.name || !currentCategoryId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingSubcategory) {
        const { error } = await (supabase as any)
          .from('sub_categories')
          .update({
            name: subcategoryFormData.name
          })
          .eq('id', editingSubcategory.id);

        if (error) throw error;
        toast.success('Subcategory updated successfully');
      } else {
        const { error } = await (supabase as any)
          .from('sub_categories')
          .insert({
            category_id: currentCategoryId,
            name: subcategoryFormData.name
          });

        if (error) throw error;
        toast.success('Subcategory created successfully');
      }

      setShowSubcategoryDialog(false);
      if (currentCategoryId) {
        fetchSubcategories(currentCategoryId);
      }
    } catch (error) {
      toast.error('Error saving subcategory');
    }
  };


  const deleteSubcategory = async (subcategory: Subcategory) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) return;

    try {
      const { error } = await (supabase as any)
        .from('sub_categories')
        .delete()
        .eq('id', subcategory.id);

      if (error) throw error;
      toast.success('Subcategory deleted successfully');
      fetchSubcategories(subcategory.category_id);
    } catch (error) {
      toast.error('Error deleting subcategory');
    }
  };

  // Program functions
  const fetchPrograms = async (subcategoryId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('programs')
        .select('*')
        .eq('sub_category_id', subcategoryId)
        .order('priority', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      
      setPrograms(prev => ({
        ...prev,
        [subcategoryId]: data || []
      }));
    } catch (error) {
      toast.error('Error fetching programs');
    }
  };

  const toggleSubcategory = (subcategoryId: string) => {
    setExpandedSubcategories(prev => ({
      ...prev,
      [subcategoryId]: !prev[subcategoryId]
    }));
    
    if (!expandedSubcategories[subcategoryId] && !programs[subcategoryId]) {
      fetchPrograms(subcategoryId);
    }
  };

  const handleAddProgram = (subcategoryId: string, categoryId: string) => {
    setCurrentSubcategoryId(subcategoryId);
    setCurrentCategoryId(categoryId);
    setEditingProgram(null);
    setProgramFormData({
      name: '',
      description: '',
      is_top: false,
      priority: 0
    });
    setShowProgramDialog(true);
  };

  const handleEditProgram = (program: Program) => {
    setCurrentSubcategoryId(program.sub_category_id);
    setCurrentCategoryId(program.category_id);
    setEditingProgram(program);
    setProgramFormData({
      name: program.name,
      description: program.description || '',
      is_top: program.is_top,
      priority: program.priority
    });
    setShowProgramDialog(true);
  };

  const handleSubmitProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!programFormData.name || !currentSubcategoryId || !currentCategoryId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingProgram) {
        const { error } = await (supabase as any)
          .from('programs')
          .update({
            name: programFormData.name,
            description: programFormData.description || null,
            is_top: programFormData.is_top,
            priority: programFormData.priority
          })
          .eq('id', editingProgram.id);

        if (error) throw error;
        toast.success('Program updated successfully');
      } else {
        const { error } = await (supabase as any)
          .from('programs')
          .insert({
            category_id: currentCategoryId,
            sub_category_id: currentSubcategoryId,
            name: programFormData.name,
            description: programFormData.description || null,
            is_top: programFormData.is_top,
            priority: programFormData.priority
          });

        if (error) throw error;
        toast.success('Program created successfully');
      }

      setShowProgramDialog(false);
      if (currentSubcategoryId) {
        fetchPrograms(currentSubcategoryId);
      }
    } catch (error) {
      toast.error('Error saving program');
    }
  };

  const deleteProgram = async (program: Program) => {
    if (!confirm('Are you sure you want to delete this program?')) return;

    try {
      const { error } = await (supabase as any)
        .from('programs')
        .delete()
        .eq('id', program.id);

      if (error) throw error;
      toast.success('Program deleted successfully');
      fetchPrograms(program.sub_category_id);
    } catch (error) {
      toast.error('Error deleting program');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Categories Management</CardTitle>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh]">
              <DialogHeader className="pb-4 border-b">
                <DialogTitle className="text-lg font-semibold">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="overflow-y-auto max-h-[calc(85vh-8rem)] pr-2">
                <form onSubmit={handleSubmit} className="space-y-8 py-2">
                  {/* Basic Information Section */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">1</span>
                      </div>
                      <h4 className="text-base font-medium text-foreground">Basic Information</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-3">
                        <Label htmlFor="name_english" className="text-sm font-medium">English Name *</Label>
                        <Input
                          id="name_english"
                          value={formData.name_english}
                          onChange={(e) => setFormData({ ...formData, name_english: e.target.value })}
                          required
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="name_malayalam" className="text-sm font-medium">Malayalam Name *</Label>
                        <Input
                          id="name_malayalam"
                          value={formData.name_malayalam}
                          onChange={(e) => setFormData({ ...formData, name_malayalam: e.target.value })}
                          required
                          className="font-malayalam h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="min-h-[100px] resize-none"
                        placeholder="Enter category description..."
                      />
                    </div>
                  </div>

                  {/* Pricing & Expiry Section */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">2</span>
                      </div>
                      <h4 className="text-base font-medium text-foreground">Pricing & Expiry</h4>
                    </div>
                    
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                       <div className="space-y-3">
                         <Label htmlFor="actual_fee" className="text-sm font-medium">Actual Fee (₹)</Label>
                         <Input
                           id="actual_fee"
                           type="number"
                           min="0"
                           step="0.01"
                           value={formData.actual_fee}
                           onChange={(e) => setFormData({ ...formData, actual_fee: parseFloat(e.target.value) || 0 })}
                           className="h-11"
                         />
                       </div>

                       <div className="space-y-3">
                         <Label htmlFor="offer_fee" className="text-sm font-medium">Offer Fee (₹)</Label>
                         <Input
                           id="offer_fee"
                           type="number"
                           min="0"
                           step="0.01"
                           value={formData.offer_fee}
                           onChange={(e) => setFormData({ ...formData, offer_fee: parseFloat(e.target.value) || 0 })}
                           className="h-11"
                         />
                       </div>

                       <div className="space-y-3">
                         <Label htmlFor="expiry_days" className="text-sm font-medium">Expiry (Days)</Label>
                         <Input
                           id="expiry_days"
                           type="number"
                           min="1"
                           value={formData.expiry_days}
                           onChange={(e) => setFormData({ ...formData, expiry_days: parseInt(e.target.value) || 30 })}
                           className="h-11"
                         />
                       </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-3">
                         <Label htmlFor="offer_start_date" className="text-sm font-medium">Offer Start Date</Label>
                         <Input
                           id="offer_start_date"
                           type="date"
                           value={formData.offer_start_date}
                           onChange={(e) => setFormData({ ...formData, offer_start_date: e.target.value })}
                           className="h-11"
                         />
                       </div>

                       <div className="space-y-3">
                         <Label htmlFor="offer_end_date" className="text-sm font-medium">Offer End Date</Label>
                         <Input
                           id="offer_end_date"
                           type="date"
                           value={formData.offer_end_date}
                           onChange={(e) => setFormData({ ...formData, offer_end_date: e.target.value })}
                           className="h-11"
                         />
                       </div>
                     </div>
                  </div>

                  {/* Payment QR Section */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">3</span>
                      </div>
                      <h4 className="text-base font-medium text-foreground">Payment QR Code</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label htmlFor="payment_qr" className="text-sm font-medium">Upload QR Image</Label>
                        <Input
                          id="payment_qr"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setQrFile(file);
                            if (file) {
                              setQrPreview(URL.createObjectURL(file));
                            }
                          }}
                          className="h-11"
                        />
                        <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md">
                          💡 This QR code will be displayed to users during the payment process for this category.
                        </p>
                      </div>
                      
                      {qrPreview && (
                        <div className="flex justify-center py-4">
                          <div className="border-2 border-dashed border-border rounded-xl p-6 bg-muted/20">
                            <img 
                              src={qrPreview} 
                              alt="QR Code Preview" 
                              className="h-40 w-40 object-contain mx-auto rounded-lg"
                            />
                            <p className="text-xs text-center text-muted-foreground mt-3 font-medium">QR Code Preview</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              {/* Fixed Action Buttons */}
              <div className="flex gap-3 pt-6 border-t bg-background">
                <Button 
                  type="submit" 
                  className="flex-1 h-11"
                  onClick={handleSubmit}
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowDialog(false)}
                  className="h-11 px-8"
                >
                  Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <p>Loading categories...</p>
        ) : (
          <div className="space-y-4">
            {categories.map((category, index) => (
              <Card key={category.id} className="border-l-4" style={{ borderLeftColor: `var(--${getCategoryColor(index)})` }}>
                <CardContent className="p-4">
                  <Collapsible 
                    open={expandedCategories[category.id]} 
                    onOpenChange={() => toggleCategory(category.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-0 h-auto">
                              {expandedCategories[category.id] ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <h3 className="text-lg font-semibold">{category.name_english}</h3>
                          <p className="text-lg font-malayalam text-muted-foreground">{category.name_malayalam}</p>
                          <Badge variant={category.is_active ? "default" : "secondary"}>
                            {category.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground mb-2 ml-9">{category.description}</p>
                        )}
                        <div className="flex gap-4 text-sm ml-9">
                          <span>Actual Fee: ₹{category.actual_fee}</span>
                          <span>Offer Fee: ₹{category.offer_fee}</span>
                          <span>Expiry: {category.expiry_days} days</span>
                        </div>
                        {category.offer_start_date && category.offer_end_date && (
                          <div className="text-sm text-muted-foreground mt-1 ml-9">
                            Offer Period: {new Date(category.offer_start_date).toLocaleDateString()} - {new Date(category.offer_end_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={category.is_active}
                          onCheckedChange={() => toggleCategoryStatus(category)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCategory(category.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <CollapsibleContent className="mt-4 ml-9">
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-semibold text-muted-foreground">Subcategories</h4>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAddSubcategory(category.id)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Subcategory
                          </Button>
                        </div>
                        
                        {subcategories[category.id] && subcategories[category.id].length > 0 ? (
                          <div className="space-y-2">
                            {subcategories[category.id].map((sub) => (
                              <Collapsible
                                key={sub.id}
                                open={expandedSubcategories[sub.id]}
                                onOpenChange={() => toggleSubcategory(sub.id)}
                              >
                                <div className="p-3 bg-muted/30 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 flex-1">
                                      <CollapsibleTrigger asChild>
                                        <Button variant="ghost" size="sm" className="p-0 h-auto">
                                          {expandedSubcategories[sub.id] ? (
                                            <ChevronUp className="w-4 h-4" />
                                          ) : (
                                            <ChevronDown className="w-4 h-4" />
                                          )}
                                        </Button>
                                      </CollapsibleTrigger>
                                      <span className="font-medium text-sm">{sub.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleEditSubcategory(sub)}
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => deleteSubcategory(sub)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  <CollapsibleContent className="mt-3">
                                    <div className="border-t pt-3 ml-6">
                                      <div className="flex justify-between items-center mb-2">
                                        <h5 className="text-xs font-semibold text-muted-foreground">Programs</h5>
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          className="h-7 text-xs"
                                          onClick={() => handleAddProgram(sub.id, category.id)}
                                        >
                                          <Plus className="w-3 h-3 mr-1" />
                                          Add Program
                                        </Button>
                                      </div>
                                      
                                      {programs[sub.id] && programs[sub.id].length > 0 ? (
                                        <div className="space-y-2">
                                          {programs[sub.id].map((program) => (
                                            <div key={program.id} className="flex justify-between items-start p-2 bg-background/50 rounded border">
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-medium text-xs">{program.name}</span>
                                                  {program.is_top && (
                                                    <Badge variant="secondary" className="text-xs px-1 py-0">Top</Badge>
                                                  )}
                                                  <Badge variant="outline" className="text-xs px-1 py-0">P: {program.priority}</Badge>
                                                </div>
                                                {program.description && (
                                                  <p className="text-xs text-muted-foreground mt-1">{program.description}</p>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-1 ml-2">
                                                <Button 
                                                  variant="ghost" 
                                                  size="icon"
                                                  className="h-6 w-6"
                                                  onClick={() => handleEditProgram(program)}
                                                >
                                                  <Edit className="w-3 h-3" />
                                                </Button>
                                                <Button 
                                                  variant="ghost" 
                                                  size="icon"
                                                  className="h-6 w-6"
                                                  onClick={() => deleteProgram(program)}
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </Button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-muted-foreground text-center py-3">No programs yet</p>
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </div>
                              </Collapsible>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">No subcategories yet</p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Subcategory Dialog */}
      <Dialog open={showSubcategoryDialog} onOpenChange={setShowSubcategoryDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSubcategory ? 'Edit Subcategory' : 'Add New Subcategory'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitSubcategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sub_name">Subcategory Name *</Label>
              <Input
                id="sub_name"
                value={subcategoryFormData.name}
                onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, name: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowSubcategoryDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingSubcategory ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Program Dialog */}
      <Dialog open={showProgramDialog} onOpenChange={setShowProgramDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProgram ? 'Edit Program' : 'Add New Program'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitProgram} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="program_name">Program Name *</Label>
              <Input
                id="program_name"
                value={programFormData.name}
                onChange={(e) => setProgramFormData({ ...programFormData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="program_description">Description</Label>
              <Textarea
                id="program_description"
                value={programFormData.description}
                onChange={(e) => setProgramFormData({ ...programFormData, description: e.target.value })}
                placeholder="Enter program description..."
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="program_priority">Priority</Label>
                <Input
                  id="program_priority"
                  type="number"
                  min="0"
                  value={programFormData.priority}
                  onChange={(e) => setProgramFormData({ ...programFormData, priority: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="program_is_top" className="flex items-center gap-2">
                  <span>Mark as Top Program</span>
                </Label>
                <div className="flex items-center h-10">
                  <Switch
                    id="program_is_top"
                    checked={programFormData.is_top}
                    onCheckedChange={(checked) => setProgramFormData({ ...programFormData, is_top: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowProgramDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingProgram ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CategoriesTab;