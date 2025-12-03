import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TransferRequest {
  id: string;
  registration_id: string;
  from_program_id: string;
  to_program_id: string;
  mobile_number: string;
  customer_id: string;
  full_name: string;
  status: string;
  reason: string | null;
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
  from_program: {
    name: string;
    description: string | null;
  } | null;
  to_program: {
    name: string;
    description: string | null;
  } | null;
}

const JobTransferTab = () => {
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTransferRequests();
  }, []);

  const fetchTransferRequests = async () => {
    try {
      const { data: requests, error: requestsError } = await supabase
        .from('job_transfer_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (requestsError) {
        toast.error('Error fetching job transfer requests');
        return;
      }

      // Enrich with program details
      const enrichedRequests = await Promise.all(
        (requests || []).map(async (request) => {
          const [fromProgram, toProgram] = await Promise.all([
            supabase.from('programs').select('name, description').eq('id', request.from_program_id).single(),
            supabase.from('programs').select('name, description').eq('id', request.to_program_id).single()
          ]);

          return {
            ...request,
            from_program: fromProgram.data,
            to_program: toProgram.data
          };
        })
      );

      setTransferRequests(enrichedRequests);
    } catch (error) {
      toast.error('Error fetching job transfer requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTransfer = async (request: TransferRequest) => {
    setProcessingId(request.id);
    try {
      // Update registration with new program
      const { error: registrationError } = await supabase
        .from('registrations')
        .update({ 
          program_id: request.to_program_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.registration_id);

      if (registrationError) {
        toast.error('Error updating registration');
        return;
      }

      const { error: transferError } = await supabase
        .from('job_transfer_requests')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString(),
          processed_by: 'admin'
        })
        .eq('id', request.id);

      if (transferError) {
        toast.error('Error updating transfer request');
        return;
      }

      toast.success('Job transfer request approved successfully');
      fetchTransferRequests();
    } catch (error) {
      toast.error('Error processing transfer request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectTransfer = async (request: TransferRequest) => {
    setProcessingId(request.id);
    try {
      const { error } = await supabase
        .from('job_transfer_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: 'admin'
        })
        .eq('id', request.id);

      if (error) {
        toast.error('Error rejecting transfer request');
      } else {
        toast.success('Job transfer request rejected');
        fetchTransferRequests();
      }
    } catch (error) {
      toast.error('Error processing transfer request');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const pendingRequests = transferRequests.filter(req => req.status === 'pending');
  const processedRequests = transferRequests.filter(req => req.status !== 'pending');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Job Transfer Requests</h2>
        </div>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Job Transfer Requests</h2>
        <Button onClick={fetchTransferRequests} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Requests ({pendingRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No pending job transfer requests</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Details</TableHead>
                  <TableHead>Job Transfer</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{request.full_name}</p>
                        <p className="text-sm text-muted-foreground">{request.customer_id}</p>
                        <p className="text-sm text-muted-foreground">{request.mobile_number}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="text-sm">
                          <p className="font-medium">{request.from_program?.name}</p>
                          {request.from_program?.description && (
                            <p className="text-muted-foreground text-xs truncate max-w-[120px]">{request.from_program.description}</p>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-purple-800">{request.to_program?.name}</p>
                          {request.to_program?.description && (
                            <p className="text-purple-600 text-xs truncate max-w-[120px]">{request.to_program.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm max-w-xs truncate">
                        {request.reason || 'No reason provided'}
                      </p>
                    </TableCell>
                    <TableCell>
                      {new Date(request.requested_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              <Check className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Approve Job Transfer</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to approve this job transfer? 
                                This will change the selected job from "{request.from_program?.name}" to "{request.to_program?.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleApproveTransfer(request)}
                                disabled={processingId === request.id}
                              >
                                {processingId === request.id ? 'Processing...' : 'Approve'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <X className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reject Job Transfer</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to reject this job transfer request? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleRejectTransfer(request)}
                                disabled={processingId === request.id}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {processingId === request.id ? 'Processing...' : 'Reject'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Processed Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Processed Requests ({processedRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {processedRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No processed job transfer requests</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Details</TableHead>
                  <TableHead>Job Transfer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processed Date</TableHead>
                  <TableHead>Processed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{request.full_name}</p>
                        <p className="text-sm text-muted-foreground">{request.customer_id}</p>
                        <p className="text-sm text-muted-foreground">{request.mobile_number}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="text-sm">
                          <p className="font-medium">{request.from_program?.name}</p>
                        </div>
                        <ArrowRight className="w-4 h-4" />
                        <div className="text-sm">
                          <p className="font-medium">{request.to_program?.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {request.processed_at ? new Date(request.processed_at).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>{request.processed_by || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JobTransferTab;
