import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowRight, RefreshCw } from 'lucide-react';
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
  category_id: string;
  program_id: string | null;
  categories: {
    name_english: string;
    name_malayalam: string;
  } | null;
  programs: {
    name: string;
    description: string | null;
  } | null;
}

interface JobTransferRequestProps {
  registration: Registration;
  onTransferRequested: () => void;
}

const JobTransferRequest = ({ registration, onTransferRequested }: JobTransferRequestProps) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [checkingRequest, setCheckingRequest] = useState(true);

  useEffect(() => {
    fetchPrograms();
    checkExistingRequest();
  }, []);

  const checkExistingRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('job_transfer_requests')
        .select('*')
        .eq('registration_id', registration.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (error) {
        console.error('Error checking existing request:', error);
      } else {
        setExistingRequest(data);
      }
    } catch (error) {
      console.error('Error checking existing request:', error);
    } finally {
      setCheckingRequest(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      // Check if it's a Job Card category (show all programs)
      const isJobCard = registration.categories?.name_english.toLowerCase().includes('job card');
      
      let query = supabase
        .from('programs')
        .select('id, name, description');

      // If not Job Card category, filter by category_id
      if (!isJobCard) {
        query = query.eq('category_id', registration.category_id);
      }

      // Exclude current program
      if (registration.program_id) {
        query = query.neq('id', registration.program_id);
      }

      const { data, error } = await query.order('priority', { ascending: false });

      if (error) {
        toast.error('Error fetching programs');
      } else {
        setPrograms(data || []);
      }
    } catch (error) {
      toast.error('Error fetching programs');
    }
  };

  const handleSubmitTransferRequest = async () => {
    if (!selectedProgramId) {
      toast.error('Please select a job to transfer to');
      return;
    }
    if (!registration.program_id) {
      toast.error('No current job selected');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('job_transfer_requests').insert({
        registration_id: registration.id,
        from_program_id: registration.program_id,
        to_program_id: selectedProgramId,
        mobile_number: registration.mobile_number,
        customer_id: registration.customer_id,
        full_name: registration.full_name,
        reason: reason || null,
        status: 'pending'
      });

      if (error) {
        toast.error('Error submitting transfer request');
      } else {
        toast.success('Job transfer request submitted successfully. It will be reviewed by admin.');
        setShowForm(false);
        setSelectedProgramId('');
        setReason('');
        checkExistingRequest();
        onTransferRequested();
      }
    } catch (error) {
      toast.error('Error submitting transfer request');
    } finally {
      setLoading(false);
    }
  };

  const selectedProgram = programs.find(p => p.id === selectedProgramId);

  if (checkingRequest) {
    return (
      <div className="mt-4">
        <div className="text-center py-2">
          <p className="text-muted-foreground text-sm">Checking transfer request status...</p>
        </div>
      </div>
    );
  }

  if (existingRequest) {
    return (
      <div className="mt-4">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 font-medium text-sm mb-1">
            Job Transfer Request Pending
          </p>
          <p className="text-blue-700 text-xs">
            You have already requested a job transfer. Your request is being reviewed.
          </p>
          <div className="mt-2 text-xs text-blue-600">
            <p>Submitted: {new Date(existingRequest.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="mt-3">
        <Button 
          onClick={() => setShowForm(true)} 
          variant="outline" 
          size="sm"
          className="w-full bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Transfer Job / ജോലി മാറ്റാൻ
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <Card className="border-2 border-purple-200">
        <CardHeader className="py-3">
          <CardTitle className="text-base text-purple-800">Job Transfer Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 bg-purple-50">
          <div className="p-3 bg-white rounded-lg">
            <Label className="text-xs font-medium text-muted-foreground">Current Job</Label>
            <p className="font-semibold">{registration.programs?.name}</p>
            {registration.programs?.description && (
              <p className="text-sm text-muted-foreground">{registration.programs.description}</p>
            )}
          </div>

          <div className="flex justify-center">
            <ArrowRight className="w-6 h-6 text-purple-600" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-job">Select New Job</Label>
            <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a job to transfer to" />
              </SelectTrigger>
              <SelectContent>
                {programs.map(program => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProgram && (
            <div className="p-3 bg-purple-100 rounded-lg">
              <Label className="text-xs font-medium text-muted-foreground">Transfer To</Label>
              <p className="font-semibold text-purple-800">{selectedProgram.name}</p>
              {selectedProgram.description && (
                <p className="text-sm text-purple-600">{selectedProgram.description}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Transfer (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for the job transfer request..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="min-h-16"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmitTransferRequest}
              disabled={loading || !selectedProgramId}
              className="flex-1"
              size="sm"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
            <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1" size="sm">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobTransferRequest;
