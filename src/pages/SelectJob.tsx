import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Category {
  id: string;
  name_english: string;
  name_malayalam: string;
  description: string | null;
  actual_fee: number;
  offer_fee: number;
  expiry_days: number;
}

const SelectJob = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .not('name_english', 'in', '("Pennyekart Free Registration","Pennyekart Paid Registration")')
        .order('name_english');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Select Job Category</h1>
            <p className="text-muted-foreground">Browse available job categories and opportunities</p>
          </div>
          
          <Button 
            onClick={() => navigate('/admin/login')}
            variant="outline"
            className="gap-2"
          >
            <UserCircle className="h-5 w-5" />
            Team Member Login
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No job categories available at the moment.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {categories.map((category) => (
              <AccordionItem 
                key={category.id} 
                value={category.id}
                className="border rounded-lg bg-card"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex flex-col items-start text-left">
                    <h3 className="text-lg font-semibold">{category.name_english}</h3>
                    <p className="text-sm text-muted-foreground">{category.name_malayalam}</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="space-y-4">
                    {category.description && (
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Registration Fee</p>
                        <p className="text-xl font-bold">
                          ₹{category.offer_fee > 0 ? category.offer_fee : category.actual_fee}
                        </p>
                        {category.offer_fee > 0 && category.offer_fee < category.actual_fee && (
                          <p className="text-xs text-muted-foreground line-through">
                            ₹{category.actual_fee}
                          </p>
                        )}
                      </div>
                      
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Validity Period</p>
                        <p className="text-xl font-bold">{category.expiry_days} days</p>
                      </div>
                      
                      <div className="flex items-center justify-center">
                        <Button 
                          onClick={() => navigate('/', { state: { selectedCategory: category.id } })}
                          className="w-full"
                        >
                          Apply Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </main>
    </div>
  );
};

export default SelectJob;
