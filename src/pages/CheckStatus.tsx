import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import CategoryTransferRequest from '@/components/CategoryTransferRequest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Share2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
interface Program {
  id: string;
  name: string;
  description: string | null;
}
interface Registration {
  id: string;
  customer_id: string;
  full_name: string;
  mobile_number: string;
  status: string;
  created_at: string;
  expiry_date: string;
  fee: number | null;
  category_id: string;
  ward: string;
  panchayath_id: string;
  program_id: string | null;
  categories: {
    name_english: string;
    name_malayalam: string;
    qr_code_url?: string;
  } | null;
  panchayaths: {
    name: string;
  } | null;
  programs: {
    name: string;
    description: string | null;
  } | null;
}
const CheckStatus = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(false);
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectingJob, setSelectingJob] = useState(false);
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter mobile number or customer ID');
      return;
    }
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('registrations').select(`
          *,
          categories!registrations_category_id_fkey (
            name_english,
            name_malayalam,
            qr_code_url
          ),
          panchayaths (
            name
          ),
          programs (
            name,
            description
          )
        `).or(`mobile_number.eq.${searchQuery},customer_id.eq.${searchQuery}`).maybeSingle();
      if (error) {
        toast.error('Error searching for registration');
        setRegistration(null);
      } else if (!data) {
        toast.error('No registration found with this mobile number or customer ID');
        setRegistration(null);
      } else {
        const reg = data as unknown as Registration;
        setRegistration(reg);
      }
    } catch (error) {
      toast.error('Error searching for registration');
      setRegistration(null);
    } finally {
      setLoading(false);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved / അംഗീകരിച്ചു';
      case 'rejected':
        return 'Rejected / നിരസിച്ചു';
      default:
        return 'Pending / കാത്തിരിക്കുന്നു';
    }
  };
  const handleSelectJob = async () => {
    if (!registration) return;
    setSelectingJob(true);
    try {
      // Check if it's a Job Card category (show all programs)
      const isJobCard = registration.categories?.name_english.toLowerCase().includes('job card');
      let query = supabase.from('programs').select('id, name, description');

      // If not Job Card category, filter by category_id
      if (!isJobCard) {
        query = query.eq('category_id', registration.category_id);
      }
      const {
        data,
        error
      } = await query.order('priority', {
        ascending: false
      });
      if (error) {
        toast.error('Error loading programs');
        return;
      }
      setPrograms(data || []);
      setShowJobDialog(true);
    } catch (error) {
      toast.error('Error loading programs');
    } finally {
      setSelectingJob(false);
    }
  };
  const handleProgramSelect = async (programId: string) => {
    if (!registration) return;
    try {
      const {
        error
      } = await supabase.from('registrations').update({
        program_id: programId
      } as any).eq('id', registration.id);
      if (error) {
        toast.error('Error selecting job');
        return;
      }
      toast.success('Job selected successfully');
      setShowJobDialog(false);

      // Refresh registration data
      handleSearch();
    } catch (error) {
      toast.error('Error selecting job');
    }
  };
  const handleShareToWhatsApp = () => {
    if (!registration) return;
    const whatsappNumber = '7025715877';
    const message = `*Payment Required - Registration Details*
    
👤 *Name:* ${registration.full_name}
📱 *Mobile:* ${registration.mobile_number}
🆔 *Customer ID:* ${registration.customer_id}
📋 *Category:* ${registration.categories?.name_english || 'N/A'}
💰 *Amount:* ₹${registration.fee}
📅 *Registration Date:* ${new Date(registration.created_at).toLocaleDateString()}
⏰ *Expiry Date:* ${new Date(registration.expiry_date).toLocaleDateString()}

*ഞാൻ എന്റെ പയ്മെന്റ്റ് അടച്ചിട്ടുണ്ട് അതിന്റെ സ്ക്രീൻ ഷോട്ട് ഇതിന്റെ കൂടെ അയക്കുന്നുണ്ട്*, 
*ദയവു ചെയ്തു എന്റെ രജിസ്‌ട്രേഷൻ അംഗീകരിക്കു.. .*`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp to share payment details');
  };
  return <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Check Registration Status</h1>
          <p className="text-xl text-muted-foreground">താഴെ കാണുന്ന കോളത്തിൽ നിങ്ങളുടെ രജിസ്റ്റർ ചെയ്ത മൊബൈൽ നമ്പർ ചെക്ക് ചെയ്യുക ഫ്രീ രജിസ്‌ട്രേഷൻ ആണെങ്കിൽ മൂന്ന് ദിവസത്തിനുള്ളിൽ സ്വയം അപ്പ്രൂവ് ആകും മറ്റേതെങ്കിലും ആണെങ്കിൽ പണം അടച്ചാൽ അപ്പ്രൂവ് ആകും.</p>
        </div>

        <div className="max-w-md mx-auto mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Search Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Mobile Number or Customer ID</Label>
                <Input id="search" placeholder="Enter mobile number or customer ID" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSearch()} />
              </div>
              <Button onClick={handleSearch} disabled={loading} className="w-full">
                <Search className="w-4 h-4 mr-2" />
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {registration && <div className="max-w-2xl mx-auto">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Registration Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Customer ID</Label>
                    <p className="text-lg font-semibold">{registration.customer_id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p className="text-lg font-semibold">{registration.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Mobile Number</Label>
                    <p className="text-lg font-semibold">{registration.mobile_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Panchayath</Label>
                    <p className="text-lg font-semibold">{registration.panchayaths?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Ward</Label>
                    <p className="text-lg font-semibold">{registration.ward || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                    <p className="text-lg font-semibold">
                      {registration.categories?.name_english || 'N/A'}
                      <br />
                      <span className="text-base text-muted-foreground">
                        {registration.categories?.name_malayalam || 'N/A'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Selected Job / തിരഞ്ഞെടുത്ത ജോലി</Label>
                    {registration.programs ? <div className="border border-primary/20 rounded-lg p-3 mt-1 bg-cyan-300">
                        <p className="text-lg font-semibold">{registration.programs.name}</p>
                        {registration.programs.description && <p className="text-sm text-muted-foreground mt-1">{registration.programs.description}</p>}
                      </div> : <div className="mt-2">
                        <Button onClick={handleSelectJob} disabled={selectingJob} variant="outline" size="sm" className="w-full">
                          <Briefcase className="w-4 h-4 mr-2" />
                          {selectingJob ? 'Loading...' : 'Select Job'}
                        </Button>
                      </div>}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Registration Date</Label>
                    <p className="text-lg font-semibold">
                      {new Date(registration.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Expiry Date</Label>
                    <p className="text-lg font-semibold">
                      {new Date(registration.expiry_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className={`inline-block px-6 py-3 rounded-lg border-2 font-bold text-lg mt-2 ${getStatusColor(registration.status)}`}>
                    {getStatusText(registration.status)}
                  </div>
                </div>

                {registration.status === 'pending' && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-blue-800">
                      Your registration is currently under review. You will be notified once it's processed.
                    </p>
                  </div>}

                {registration.status === 'approved' && <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-green-800 font-semibold">
                      Congratulations! Your registration has been approved.
                    </p>
                  </div>}

                {registration.status === 'rejected' && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-red-800">
                      Your registration has been rejected. Please contact our support team for more information.
                    </p>
                  </div>}
                {registration.status === 'pending' && (registration.fee ?? 0) > 0 && <div className="mt-4 p-4 border rounded-lg bg-muted">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold">Complete Payment</p>
                      <Button onClick={handleShareToWhatsApp} variant="outline" size="sm" className="bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share to WhatsApp
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Scan the QR code below to pay the registration fee of ₹{registration.fee}. After payment, your application will be processed.
                      <br />
                      <span className="text-green-600 font-medium">പണം അടച്ചതിനു ശേഷവും പെന്റിങ് കാണിക്കുകയാണെങ്കിൽ മുകളിൽ കാണുന്ന വാട്ട്സ് ആപ്പ് ബട്ടൺ (പച്ച ബട്ടൺ) അമർത്തിയാൽ നിങ്ങളുടെ പണമടച്ച സ്ക്രീൻ ഷോട്ട് അയക്കാവുന്നതാണ് </span>
                    </p>
                    {registration.categories?.qr_code_url ? <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-lg border shadow-sm">
                          <img src={registration.categories.qr_code_url} alt="Payment QR code" className="w-48 h-48 object-contain" />
                          <p className="text-xs text-center text-muted-foreground mt-2">
                            Payment QR Code for {registration.categories.name_english}
                          </p>
                        </div>
                      </div> : <div className="flex justify-center">
                        <div className="w-48 h-48 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                          <p className="text-sm text-gray-500 text-center">
                            QR Code not available<br />
                            Please contact support
                          </p>
                        </div>
                      </div>}
                    <div className="mt-4 text-center">
                      <p className="text-xs text-muted-foreground">
                        Having trouble with payment? Click the WhatsApp button above for instant support.
                      </p>
                    </div>
                  </div>}

                {(registration.status === 'approved' || registration.status === 'pending') && <CategoryTransferRequest registration={registration} onTransferRequested={() => {
              toast.success('Transfer request submitted successfully');
            }} />}

              </CardContent>
            </Card>
          </div>}
      </div>

      <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Job / ജോലി തിരഞ്ഞെടുക്കുക</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {programs.length === 0 ? <p className="text-center text-muted-foreground py-8">
                No programs available for this category
              </p> : programs.map(program => <Card key={program.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleProgramSelect(program.id)}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{program.name}</h3>
                    {program.description && <p className="text-sm text-muted-foreground">{program.description}</p>}
                  </CardContent>
                </Card>)}
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default CheckStatus;