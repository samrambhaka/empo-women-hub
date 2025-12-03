import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RegistrationForm from '@/components/RegistrationForm';

interface Category {
  id: string;
  name_english: string;
  name_malayalam: string;
  description: string;
  actual_fee: number;
  offer_fee: number;
  offer_start_date?: string;
  offer_end_date?: string;
  is_active: boolean;
}

interface Program {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
  sub_category_id: string;
  is_top: boolean;
  priority: number;
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [showProgramDialog, setShowProgramDialog] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const getOfferTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isOfferActive = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return true;
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name_english');
    
    if (data) setCategories(data);
  };

  const handleRegisterClick = (category: Category) => {
    setSelectedCategory(category);
    setSelectedProgram(null);
    setShowRegistrationForm(true);
  };

  const handleSelectJobClick = async (category: Category) => {
    setSelectedCategory(category);
    const { data } = await supabase
      .from('programs')
      .select('*')
      .eq('category_id', category.id)
      .order('is_top', { ascending: false })
      .order('priority', { ascending: false });
    
    if (data) {
      setPrograms(data);
      setShowProgramDialog(true);
    }
  };

  const handleProgramSelect = (program: Program) => {
    setSelectedProgram(program);
    setShowProgramDialog(false);
    setShowRegistrationForm(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">സ്വയം തൊഴിൽ വിഭാഗങ്ങൾ</h1>
          <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
            താങ്കൾക്ക് ആവശ്യമായ സ്വയംതൊഴിൽ മേഖല ഏതാണെന്ന് ഇവിടെനിന്ന് തിരഞ്ഞെടുക്കുക.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((category, index) => {
            const isJobCard = category.name_english.toLowerCase().includes('job card');
            const offerActive = isOfferActive(category.offer_start_date, category.offer_end_date);
            const daysRemaining = category.offer_end_date ? getOfferTimeRemaining(category.offer_end_date) : null;
            const showOfferCountdown = isJobCard && offerActive && daysRemaining !== null && daysRemaining > 0;
            
            const colorClasses = [
              'bg-category-blue border-category-blue-foreground text-category-blue-foreground',
              'bg-category-green border-category-green-foreground text-category-green-foreground', 
              'bg-category-purple border-category-purple-foreground text-category-purple-foreground',
              'bg-category-orange border-category-orange-foreground text-category-orange-foreground',
              'bg-category-pink border-category-pink-foreground text-category-pink-foreground',
              'bg-category-indigo border-category-indigo-foreground text-category-indigo-foreground'
            ];
            const colorClass = colorClasses[index % colorClasses.length];
            
            // If category is inactive, show "Will be active soon" card
            if (!category.is_active) {
              return (
                <Card 
                  key={category.id} 
                  className="border-2 border-muted bg-muted/30 opacity-75"
                >
                  <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                    <CardTitle className="text-base sm:text-lg">
                      <div className="text-muted-foreground">{category.name_english}</div>
                      <div className="text-sm sm:text-base font-normal mt-1 text-muted-foreground/80">
                        {category.name_malayalam}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="flex flex-col items-center justify-center py-8">
                      <p className="text-center text-muted-foreground font-semibold mb-2">
                        Will be active soon
                      </p>
                      <p className="text-center text-sm text-muted-foreground/70">
                        ഉടൻ സജീവമാകും
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            }
            
            return (
                <Card 
                key={category.id} 
                className={`border-2 ${
                  isJobCard 
                    ? 'golden-card text-black border-gold shadow-lg' 
                    : `glass-card category-hover ${colorClass}`
                }`}
              >
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                  <CardTitle className="text-base sm:text-lg">
                    <div className={isJobCard ? 'font-bold text-black' : ''}>{category.name_english}</div>
                    <div className={`text-sm sm:text-base font-normal mt-1 ${isJobCard ? 'text-black/80' : 'opacity-80'}`}>
                      {category.name_malayalam}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  {category.description && (
                    <p className={`mb-4 ${isJobCard ? 'text-black/90' : 'opacity-90'}`}>{category.description}</p>
                  )}
                  
                  {showOfferCountdown && (
                    <div className="mb-3 p-2 bg-red-100 rounded-lg border border-red-300">
                      <p className="text-red-700 font-semibold text-sm text-center">
                        ⏰ Offer ends in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                  
                  {(category.actual_fee > 0 || category.offer_fee > 0) && (
                    <div className="mb-4">
                      {category.actual_fee > 0 && category.offer_fee > 0 && category.offer_fee < category.actual_fee ? (
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${isJobCard ? 'text-black' : 'text-green-600'}`}>₹{category.offer_fee}</span>
                          <span className={`text-sm line-through ${isJobCard ? 'text-black/60' : 'opacity-60'}`}>₹{category.actual_fee}</span>
                        </div>
                      ) : category.actual_fee > 0 ? (
                        <span className={`text-lg font-bold ${isJobCard ? 'text-black' : ''}`}>₹{category.actual_fee}</span>
                      ) : (
                        <span className={`text-lg font-bold ${isJobCard ? 'text-black' : 'text-green-600'}`}>Free</span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      onClick={() => handleSelectJobClick(category)}
                      className={`flex-1 transition-all duration-300 ${
                        isJobCard 
                          ? 'bg-black/80 hover:bg-black text-yellow-300 hover:text-yellow-200 border-black/50 shadow-lg hover:shadow-xl transform hover:scale-105 font-bold' 
                          : 'hover:transform hover:scale-105'
                      }`}
                      size="default"
                      variant={isJobCard ? 'outline' : 'outline'}
                    >
                      Select Job
                    </Button>
                    <Button 
                      onClick={() => handleRegisterClick(category)}
                      className={`flex-1 transition-all duration-300 ${
                        isJobCard 
                          ? 'bg-black/80 hover:bg-black text-yellow-300 hover:text-yellow-200 border-black/50 shadow-lg hover:shadow-xl transform hover:scale-105 font-bold' 
                          : 'hover:transform hover:scale-105'
                      }`}
                      size="default"
                      variant={isJobCard ? 'outline' : 'default'}
                    >
                      രജിസ്റ്റർ ചെയ്യുക
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Program Selection Dialog */}
      <Dialog open={showProgramDialog} onOpenChange={setShowProgramDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Select Job / ജോലി തിരഞ്ഞെടുക്കുക
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {programs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No programs available for this category / ഈ വിഭാഗത്തിന് പ്രോഗ്രാമുകളൊന്നുമില്ല
              </p>
            ) : (
              programs.map((program) => (
                <Card 
                  key={program.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleProgramSelect(program)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{program.name}</h3>
                        {program.description && (
                          <p className="text-sm text-muted-foreground mt-1">{program.description}</p>
                        )}
                        {program.is_top && (
                          <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Registration Form Dialog */}
      <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Registration for {selectedCategory?.name_english}
            </DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <RegistrationForm 
              category={selectedCategory}
              program={selectedProgram}
              onSuccess={() => setShowRegistrationForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;