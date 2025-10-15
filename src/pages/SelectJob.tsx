import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  description: string | null;
}

const SelectJob = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchPrograms();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name_english, name_malayalam, description')
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

  const fetchPrograms = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('programs')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const getProgramsForCategory = (categoryId: string) => {
    return programs.filter(p => p.category_id === categoryId);
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
                  <div className="space-y-3">
                    {getProgramsForCategory(category.id).length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">No programs available for this category.</p>
                    ) : (
                      getProgramsForCategory(category.id).map((program) => (
                        <div key={program.id} className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-semibold">{program.name_english}</h4>
                          <p className="text-sm text-muted-foreground">{program.name_malayalam}</p>
                          {program.description && (
                            <p className="text-sm mt-2">{program.description}</p>
                          )}
                        </div>
                      ))
                    )}
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
