import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  ArrowLeft, ArrowRight, FileText, CheckCircle2, XCircle, 
  Truck, Package, AlertTriangle, ClipboardCheck 
} from 'lucide-react';

export default function StockTransferDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, isBranchManager, userBranchId } = useAuth();
  const queryClient = useQueryClient();

  const [challanData, setChallanData] = useState({
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    notes: '',
  });
  const [isChallanDialogOpen, setIsChallanDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [receivedItems, setReceivedItems] = useState<Record<string, { received: number; damaged: number; damageNotes: string }>>({});

  const { data: transfer, isLoading } = useQuery({
    queryKey: ['stock-transfer', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_transfers')
        .select(`
          *,
          from_branch:from_branch_id (id, name, code, phone, address_line1, city),
          to_branch:to_branch_id (id, name, code, phone, address_line1, city)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: items } = useQuery({
    queryKey: ['stock-transfer-items', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_transfer_items')
        .select(`
          *,
          product:product_id (id, name, sku, price)
        `)
        .eq('transfer_id', id);
      if (error) throw error;
      return data;
    },
  });

  const { data: challan } = useQuery({
    queryKey: ['transfer-challan', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transfer_challans')
        .select('*')
        .eq('transfer_id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const isFromBranch = transfer?.from_branch_id === userBranchId;
  const isToBranch = transfer?.to_branch_id === userBranchId;

  const createChallanMutation = useMutation({
    mutationFn: async () => {
      // Create challan
      const { error: challanError } = await supabase
        .from('transfer_challans')
        .insert({
          transfer_id: id,
          created_by: user?.id,
          vehicle_number: challanData.vehicleNumber,
          driver_name: challanData.driverName,
          driver_phone: challanData.driverPhone,
          dispatch_date: new Date().toISOString(),
          notes: challanData.notes,
          challan_number: '', // Will be auto-generated
        });

      if (challanError) throw challanError;

      // Update transfer status
      const { error: updateError } = await supabase
        .from('stock_transfers')
        .update({ 
          status: 'challan_created',
          challan_created_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transfer', id] });
      queryClient.invalidateQueries({ queryKey: ['transfer-challan', id] });
      setIsChallanDialogOpen(false);
      toast.success('Transfer challan created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create challan: ' + error.message);
    },
  });

  const approveChallanMutation = useMutation({
    mutationFn: async () => {
      // Update challan
      const { error: challanError } = await supabase
        .from('transfer_challans')
        .update({
          signed_by: user?.id,
          is_signed: true,
          signed_at: new Date().toISOString(),
        })
        .eq('transfer_id', id);

      if (challanError) throw challanError;

      // Update transfer status and sent quantities
      const { error: updateError } = await supabase
        .from('stock_transfers')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Update sent quantities to match requested
      for (const item of items || []) {
        await supabase
          .from('stock_transfer_items')
          .update({ sent_quantity: item.requested_quantity })
          .eq('id', item.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transfer', id] });
      queryClient.invalidateQueries({ queryKey: ['transfer-challan', id] });
      toast.success('Challan approved and signed');
    },
    onError: (error) => {
      toast.error('Failed to approve challan: ' + error.message);
    },
  });

  const markInTransitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('stock_transfers')
        .update({
          status: 'in_transit',
          shipped_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transfer', id] });
      toast.success('Transfer marked as in transit');
    },
  });

  const receiveStockMutation = useMutation({
    mutationFn: async () => {
      // Update each item with received and damaged quantities
      for (const item of items || []) {
        const receiveData = receivedItems[item.id] || { received: item.sent_quantity || 0, damaged: 0, damageNotes: '' };
        
        await supabase
          .from('stock_transfer_items')
          .update({
            received_quantity: receiveData.received,
            damaged_quantity: receiveData.damaged,
          })
          .eq('id', item.id);

        // If there's damaged stock, record it
        if (receiveData.damaged > 0) {
          await supabase
            .from('damaged_stock')
            .insert({
              transfer_item_id: item.id,
              product_id: item.product_id,
              branch_id: transfer?.to_branch_id,
              from_branch_id: transfer?.from_branch_id,
              quantity: receiveData.damaged,
              damage_notes: receiveData.damageNotes,
              recorded_by: user?.id,
            });

          // Reduce stock from the product (damaged items shouldn't be added to inventory)
          const { data: product } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', item.product_id)
            .single();

          if (product) {
            await supabase
              .from('products')
              .update({ stock_quantity: Math.max(0, (product.stock_quantity || 0) - receiveData.damaged) })
              .eq('id', item.product_id);
          }
        }

        // Add received (non-damaged) stock to receiving branch's inventory
        // This would need product duplication or stock tracking per branch
      }

      // Update transfer status
      const { error } = await supabase
        .from('stock_transfers')
        .update({
          status: 'received',
          received_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transfer', id] });
      queryClient.invalidateQueries({ queryKey: ['stock-transfer-items', id] });
      setIsReceiveDialogOpen(false);
      toast.success('Stock received and recorded');
    },
    onError: (error) => {
      toast.error('Failed to receive stock: ' + error.message);
    },
  });

  const completeTransferMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('stock_transfers')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transfer', id] });
      toast.success('Transfer completed');
    },
  });

  const rejectTransferMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('stock_transfers')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transfer', id] });
      toast.success('Transfer request rejected');
    },
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      requested: 'bg-blue-500',
      challan_created: 'bg-purple-500',
      approved: 'bg-emerald-500',
      in_transit: 'bg-amber-500',
      received: 'bg-cyan-500',
      completed: 'bg-green-600',
      rejected: 'bg-destructive',
    };
    return (
      <Badge className={styles[status] || 'bg-gray-500'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!transfer) {
    return <div>Transfer not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/stock-transfers')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{transfer.transfer_number}</h1>
          <p className="text-muted-foreground">Stock Transfer Details</p>
        </div>
        <div className="ml-auto">{getStatusBadge(transfer.status)}</div>
      </div>

      {/* Transfer Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">From Branch</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{(transfer.from_branch as any)?.name}</p>
            <p className="text-sm text-muted-foreground">{(transfer.from_branch as any)?.address_line1}</p>
            <p className="text-sm text-muted-foreground">{(transfer.from_branch as any)?.city}</p>
          </CardContent>
        </Card>

        <Card className="flex items-center justify-center">
          <div className="text-center">
            <Truck className="h-8 w-8 mx-auto text-muted-foreground" />
            <ArrowRight className="h-6 w-6 mx-auto my-2" />
            <p className="text-sm text-muted-foreground">
              {transfer.status === 'in_transit' ? 'In Transit' : 'Transfer'}
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">To Branch</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{(transfer.to_branch as any)?.name}</p>
            <p className="text-sm text-muted-foreground">{(transfer.to_branch as any)?.address_line1}</p>
            <p className="text-sm text-muted-foreground">{(transfer.to_branch as any)?.city}</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <TimelineStep 
              label="Requested" 
              date={transfer.requested_at} 
              completed={true}
            />
            <TimelineStep 
              label="Challan Created" 
              date={transfer.challan_created_at} 
              completed={!!transfer.challan_created_at}
            />
            <TimelineStep 
              label="Approved" 
              date={transfer.approved_at} 
              completed={!!transfer.approved_at}
            />
            <TimelineStep 
              label="Shipped" 
              date={transfer.shipped_at} 
              completed={!!transfer.shipped_at}
            />
            <TimelineStep 
              label="Received" 
              date={transfer.received_at} 
              completed={!!transfer.received_at}
            />
            <TimelineStep 
              label="Completed" 
              date={transfer.completed_at} 
              completed={!!transfer.completed_at}
              isLast
            />
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Transfer Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Requested</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Damaged</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{(item.product as any)?.name}</TableCell>
                  <TableCell className="text-muted-foreground">{(item.product as any)?.sku || '-'}</TableCell>
                  <TableCell className="text-right">{item.requested_quantity}</TableCell>
                  <TableCell className="text-right">{item.sent_quantity ?? '-'}</TableCell>
                  <TableCell className="text-right">{item.received_quantity ?? '-'}</TableCell>
                  <TableCell className="text-right">
                    {item.damaged_quantity ? (
                      <span className="text-destructive font-medium">{item.damaged_quantity}</span>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Challan Details */}
      {challan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transfer Challan - {challan.challan_number}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Vehicle Number</p>
                <p className="font-medium">{challan.vehicle_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Driver Name</p>
                <p className="font-medium">{challan.driver_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Driver Phone</p>
                <p className="font-medium">{challan.driver_phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">
                  {challan.is_signed ? (
                    <Badge className="bg-emerald-500">Signed</Badge>
                  ) : (
                    <Badge variant="outline">Pending Signature</Badge>
                  )}
                </p>
              </div>
            </div>
            {challan.notes && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p>{challan.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {/* From Branch Actions */}
          {isFromBranch && transfer.status === 'requested' && (
            <>
              <Dialog open={isChallanDialogOpen} onOpenChange={setIsChallanDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Create Challan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Transfer Challan</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Vehicle Number</Label>
                      <Input
                        value={challanData.vehicleNumber}
                        onChange={(e) => setChallanData({ ...challanData, vehicleNumber: e.target.value })}
                        placeholder="e.g., TN 01 AB 1234"
                      />
                    </div>
                    <div>
                      <Label>Driver Name</Label>
                      <Input
                        value={challanData.driverName}
                        onChange={(e) => setChallanData({ ...challanData, driverName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Driver Phone</Label>
                      <Input
                        value={challanData.driverPhone}
                        onChange={(e) => setChallanData({ ...challanData, driverPhone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={challanData.notes}
                        onChange={(e) => setChallanData({ ...challanData, notes: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => createChallanMutation.mutate()} disabled={createChallanMutation.isPending}>
                      Create Challan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="destructive" onClick={() => rejectTransferMutation.mutate()}>
                <XCircle className="h-4 w-4 mr-2" />
                Reject Request
              </Button>
            </>
          )}

          {isFromBranch && transfer.status === 'challan_created' && !challan?.is_signed && (
            <Button onClick={() => approveChallanMutation.mutate()}>
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Sign & Approve Challan
            </Button>
          )}

          {isFromBranch && transfer.status === 'approved' && (
            <Button onClick={() => markInTransitMutation.mutate()}>
              <Truck className="h-4 w-4 mr-2" />
              Mark as Shipped
            </Button>
          )}

          {/* To Branch Actions */}
          {isToBranch && transfer.status === 'in_transit' && (
            <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Package className="h-4 w-4 mr-2" />
                  Receive Stock
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Receive Stock</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {items?.map((item) => {
                    const itemData = receivedItems[item.id] || { 
                      received: item.sent_quantity || 0, 
                      damaged: 0, 
                      damageNotes: '' 
                    };
                    return (
                      <Card key={item.id}>
                        <CardContent className="pt-4">
                          <p className="font-medium mb-3">{(item.product as any)?.name}</p>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label>Sent</Label>
                              <Input value={item.sent_quantity || 0} disabled />
                            </div>
                            <div>
                              <Label>Received (Good)</Label>
                              <Input
                                type="number"
                                value={itemData.received}
                                onChange={(e) => setReceivedItems({
                                  ...receivedItems,
                                  [item.id]: { ...itemData, received: parseInt(e.target.value) || 0 }
                                })}
                                max={item.sent_quantity || 0}
                              />
                            </div>
                            <div>
                              <Label>Damaged</Label>
                              <Input
                                type="number"
                                value={itemData.damaged}
                                onChange={(e) => setReceivedItems({
                                  ...receivedItems,
                                  [item.id]: { ...itemData, damaged: parseInt(e.target.value) || 0 }
                                })}
                              />
                            </div>
                          </div>
                          {itemData.damaged > 0 && (
                            <div className="mt-3">
                              <Label>Damage Notes</Label>
                              <Textarea
                                value={itemData.damageNotes}
                                onChange={(e) => setReceivedItems({
                                  ...receivedItems,
                                  [item.id]: { ...itemData, damageNotes: e.target.value }
                                })}
                                placeholder="Describe the damage..."
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <DialogFooter>
                  <Button onClick={() => receiveStockMutation.mutate()} disabled={receiveStockMutation.isPending}>
                    Confirm Receipt
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {(isAdmin || isToBranch) && transfer.status === 'received' && (
            <Button onClick={() => completeTransferMutation.mutate()} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Transfer
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineStep({ label, date, completed, isLast }: { label: string; date?: string | null; completed: boolean; isLast?: boolean }) {
  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${completed ? 'bg-emerald-500 text-white' : 'bg-muted'}`}>
          {completed ? <CheckCircle2 className="h-4 w-4" /> : <div className="w-2 h-2 rounded-full bg-muted-foreground" />}
        </div>
        <p className="text-xs mt-1 font-medium">{label}</p>
        {date && (
          <p className="text-xs text-muted-foreground">
            {format(new Date(date), 'dd MMM')}
          </p>
        )}
      </div>
      {!isLast && (
        <div className={`w-16 h-0.5 ${completed ? 'bg-emerald-500' : 'bg-muted'}`} />
      )}
    </div>
  );
}
