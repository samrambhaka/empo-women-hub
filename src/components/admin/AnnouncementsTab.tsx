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
import { Plus, Edit, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  image_url?: string;
}

const AnnouncementsTab = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Error fetching announcements');
      } else {
        setAnnouncements(data || []);
      }
    } catch (error) {
      toast.error('Error fetching announcements');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: ''
    });
    setEditingAnnouncement(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowDialog(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content
    });
    setEditingAnnouncement(announcement);
    setImagePreview(announcement.image_url || null);
    setShowDialog(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (announcementId: string): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      setUploading(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${announcementId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('announcement-images')
        .upload(filePath, imageFile, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('announcement-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error uploading image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingAnnouncement) {
        let imageUrl = editingAnnouncement.image_url;
        
        if (imageFile) {
          const uploadedUrl = await uploadImage(editingAnnouncement.id);
          if (uploadedUrl) imageUrl = uploadedUrl;
        }

        const { error } = await supabase
          .from('announcements')
          .update({ ...formData, image_url: imageUrl })
          .eq('id', editingAnnouncement.id);

        if (error) {
          toast.error('Error updating announcement');
        } else {
          toast.success('Announcement updated successfully');
          setShowDialog(false);
          fetchAnnouncements();
          resetForm();
        }
      } else {
        const { data: newAnnouncement, error } = await supabase
          .from('announcements')
          .insert(formData)
          .select()
          .single();

        if (error) {
          toast.error('Error creating announcement');
        } else {
          let imageUrl = null;
          if (imageFile && newAnnouncement) {
            imageUrl = await uploadImage(newAnnouncement.id);
            if (imageUrl) {
              await supabase
                .from('announcements')
                .update({ image_url: imageUrl })
                .eq('id', newAnnouncement.id);
            }
          }
          
          toast.success('Announcement created successfully');
          setShowDialog(false);
          fetchAnnouncements();
          resetForm();
        }
      }
    } catch (error) {
      toast.error('Error saving announcement');
    }
  };

  const toggleAnnouncementStatus = async (announcement: Announcement) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !announcement.is_active })
        .eq('id', announcement.id);

      if (error) {
        toast.error('Error updating announcement status');
      } else {
        toast.success('Announcement status updated');
        fetchAnnouncements();
      }
    } catch (error) {
      toast.error('Error updating announcement status');
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Error deleting announcement');
      } else {
        toast.success('Announcement deleted successfully');
        fetchAnnouncements();
      }
    } catch (error) {
      toast.error('Error deleting announcement');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Announcements Management</CardTitle>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" aria-describedby="announcement-form-description">
              <DialogHeader>
                <DialogTitle>
                  {editingAnnouncement ? 'Edit Announcement' : 'Add New Announcement'}
                </DialogTitle>
              </DialogHeader>
              <div id="announcement-form-description" className="sr-only">
                Form to {editingAnnouncement ? 'edit an existing' : 'add a new'} announcement with title and content.
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Announcement Image</Label>
                  <div className="space-y-2">
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="max-w-full h-40 object-cover rounded-md border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1"
                          onClick={removeImage}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="flex-1"
                        />
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Max size: 5MB. Supported formats: JPG, PNG, GIF, WebP
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={uploading}>
                    {uploading ? 'Uploading...' : editingAnnouncement ? 'Update' : 'Create'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell>
                      {announcement.image_url ? (
                        <img 
                          src={announcement.image_url} 
                          alt={announcement.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{announcement.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{announcement.content}</TableCell>
                    <TableCell>
                      <Badge 
                        className={announcement.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        onClick={() => toggleAnnouncementStatus(announcement)}
                        style={{ cursor: 'pointer' }}
                      >
                        {announcement.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(announcement.created_at), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(announcement)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteAnnouncement(announcement.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnnouncementsTab;