'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit2, Trash2, Plus, Search, Loader2, UploadCloud } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface Addon {
  name: string;
  price: number;
}

interface MenuItem {
  id: number;
  name: string;
  desc: string;
  price: number;
  rating: number;
  badge: string | null;
  image: string;
  addons: Addon[] | null;
}

interface MenuItemFormData {
  name: string;
  desc: string;
  price: number;
  rating: number;
  badge: string;
  image: string;
  addons: Addon[];
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<MenuItemFormData>({
    name: '',
    desc: '',
    price: 0,
    rating: 5.0,
    badge: '',
    image: '',
    addons: [],
  });

  const { toast } = useToast();

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/menu-items');
      const data = await res.json();
      setItems(data || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch menu items.', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = () => {
    setEditingItem(null);
    setImageFile(null);
    setFormData({
      name: '',
      desc: '',
      price: 0,
      rating: 5.0,
      badge: '',
      image: '',
      addons: [],
    });
    setDialogOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setImageFile(null);
    setFormData({
      name: item.name,
      desc: item.desc || '',
      price: item.price,
      rating: item.rating,
      badge: item.badge || '',
      image: item.image || '',
      addons: Array.isArray(item.addons) ? item.addons : [],
    });
    setDialogOpen(true);
  };

  const handleAddAddon = () => {
    setFormData((prev) => ({ ...prev, addons: [...prev.addons, { name: '', price: 0 }] }));
  };

  const handleAddonChange = (index: number, field: keyof Addon, value: string) => {
    setFormData((prev) => ({
      ...prev,
      addons: prev.addons.map((addon, i) =>
        i === index
          ? { ...addon, [field]: field === 'price' ? Number(value) : value }
          : addon,
      ),
    }));
  };

  const handleRemoveAddon = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      addons: prev.addons.filter((_, i) => i !== index),
    }));
  };

  // No storage backend — encode the image as a data URL so it can be saved
  // and previewed without any network round trip.
  const uploadImage = async (file: File): Promise<string | null> => {
    setUploadingImage(true);
    try {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    } catch {
      toast({ title: 'Upload Failed', description: 'Could not read the selected image.', variant: 'destructive' });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveItem = async () => {
    setIsSaving(true);
    
    let imageUrl = formData.image;
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        setIsSaving(false);
        return; // Stop if upload failed
      }
    }

    // Keep only complete extras (a name and a non-negative price).
    const cleanAddons = formData.addons
      .map((a) => ({ name: a.name.trim(), price: Number(a.price) || 0 }))
      .filter((a) => a.name.length > 0);

    const itemToSave = {
      name: formData.name,
      desc: formData.desc,
      price: formData.price,
      rating: formData.rating,
      badge: formData.badge || null,
      image: imageUrl,
      addons: cleanAddons,
    };

    if (editingItem) {
      const res = await fetch(`/api/menu-items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemToSave),
      });

      if (!res.ok) {
        toast({ title: 'Error', description: 'Failed to update item.', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Item updated successfully.' });
        fetchItems();
        setDialogOpen(false);
      }
    } else {
      const res = await fetch('/api/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemToSave),
      });

      if (!res.ok) {
        toast({ title: 'Error', description: 'Failed to create item.', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Item created successfully.' });
        fetchItems();
        setDialogOpen(false);
      }
    }
    setIsSaving(false);
  };

  const handleDeleteItem = async (id: number) => {
    const res = await fetch(`/api/menu-items/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast({ title: 'Error', description: 'Failed to delete item.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Item deleted.' });
      fetchItems();
    }
  };


  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Menu Items</CardTitle>
              <CardDescription>Manage your menu items and inventory</CardDescription>
            </div>
            <Button onClick={handleAddItem} className="gap-2 bg-gradient-to-r from-orange-500 to-red-500">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search menu items..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="py-20 text-center flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="md:hidden space-y-3">
                {filteredItems.map(item => (
                  <div key={item.id} className="p-3 border border-slate-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-900">{item.name}</h3>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditItem(item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Item?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{item.desc}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-slate-500">Price</p>
                        <p className="font-bold">₦{Number(item.price).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                           {item.image && (item.image.startsWith('http') || item.image.startsWith('data:')) ? (
                             <Image src={item.image} alt={item.name} width={40} height={40} className="rounded-md object-cover h-10 w-10" />
                           ) : (
                             <div className="h-10 w-10 bg-slate-100 flex items-center justify-center rounded-md text-xs text-slate-400">No Img</div>
                           )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{item.name}</p>
                            <p className="text-sm text-slate-500">{item.desc}</p>
                            {Array.isArray(item.addons) && item.addons.length > 0 && (
                              <p className="text-xs text-orange-600 font-medium mt-0.5">
                                {item.addons.length} extra{item.addons.length > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">₦{Number(item.price).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditItem(item)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Item?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Deleting "{item.name}" cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                          No menu items found. Add one!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit/Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md md:max-w-lg overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the menu item details' : 'Create a new menu item'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="image">Item Image</Label>
              <div className="mt-2 flex items-center gap-4">
                {(imageFile || formData.image) && (
                  <div className="relative h-16 w-16 rounded-md overflow-hidden bg-slate-100">
                    {imageFile ? (
                      <Image src={URL.createObjectURL(imageFile)} alt="Preview" fill className="object-cover" />
                    ) : (formData.image.startsWith('http') || formData.image.startsWith('data:')) ? (
                      <Image src={formData.image} alt="Preview" fill className="object-cover" />
                    ) : null}
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                      }
                    }}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Upload a JPG or PNG from your device.</p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Grilled Croaker Fish"
              />
            </div>

            <div>
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={formData.desc}
                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                placeholder="Item description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (₦)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  placeholder="15000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="badge">Badge (Optional)</Label>
                <Input
                  id="badge"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="e.g. Best Seller"
                />
              </div>
              <div>
                <Label htmlFor="rating">Rating</Label>
                <Input
                  id="rating"
                  type="number"
                  step="0.1"
                  max="5"
                  min="0"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold">Extras / Add-ons (optional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Optional items customers can add, e.g. Extra Beef ₦1,000.
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={handleAddAddon} className="gap-1 shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>

              {formData.addons.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No extras added yet.</p>
              ) : (
                <div className="space-y-2">
                  {formData.addons.map((addon, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={addon.name}
                        onChange={(e) => handleAddonChange(index, 'name', e.target.value)}
                        placeholder="e.g. Extra Beef"
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={addon.price}
                        onChange={(e) => handleAddonChange(index, 'price', e.target.value)}
                        placeholder="Price"
                        className="w-24"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveAddon(index)}
                        className="text-destructive shrink-0 h-9 w-9"
                        aria-label="Remove extra"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveItem}
                disabled={isSaving || uploadingImage}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingItem ? 'Update Item' : 'Add Item'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
