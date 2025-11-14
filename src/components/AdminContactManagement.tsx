
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, Mail, Phone, User, MessageSquare, CheckCircle, X } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { Tables } from '@/integrations/supabase/types';

type ContactSubmission = Tables<'contact_submissions'>;

const AdminContactManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [readFilter, setReadFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch contact submissions
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['contact-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ContactSubmission[];
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-submissions'] });
      toast({
        title: "Marked as read",
        description: "Submission has been marked as read.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update submission.",
        variant: "destructive",
      });
    },
  });

  // Mark as unread mutation
  const markAsUnreadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ is_read: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-submissions'] });
      toast({
        title: "Marked as unread",
        description: "Submission has been marked as unread.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update submission.",
        variant: "destructive",
      });
    },
  });

  // Delete submission mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-submissions'] });
      toast({
        title: "Deleted",
        description: "Submission has been deleted.",
      });
      setSelectedSubmission(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete submission.",
        variant: "destructive",
      });
    },
  });

  // Filter submissions
  const filteredSubmissions = submissions?.filter((submission) => {
    const matchesSearch = 
      submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesReadFilter = 
      readFilter === 'all' || 
      (readFilter === 'read' && submission.is_read) ||
      (readFilter === 'unread' && !submission.is_read);
    
    return matchesSearch && matchesReadFilter;
  }) || [];

  const unreadCount = submissions?.filter(s => !s.is_read).length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">Loading contact submissions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contact Submissions</h2>
          <p className="text-gray-600">
            Manage customer inquiries and messages
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-sm px-3 py-1">
              {unreadCount} Unread
            </Badge>
          )}
          <span className="text-sm text-gray-600">
            {filteredSubmissions.length} of {submissions?.length || 0} submissions
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, phone, or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={readFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setReadFilter('all')}
              >
                All
              </Button>
              <Button
                variant={readFilter === 'unread' ? 'default' : 'outline'}
                onClick={() => setReadFilter('unread')}
              >
                Unread
              </Button>
              <Button
                variant={readFilter === 'read' ? 'default' : 'outline'}
                onClick={() => setReadFilter('read')}
              >
                Read
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No contact submissions found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Message Preview</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => (
                  <TableRow 
                    key={submission.id}
                    className={!submission.is_read ? 'bg-blue-50' : ''}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {submission.name}
                        {!submission.is_read && (
                          <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {submission.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{submission.email}</span>
                          </div>
                        )}
                        {submission.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{submission.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {submission.message}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={submission.is_read ? 'secondary' : 'default'}>
                        {submission.is_read ? 'Read' : 'Unread'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {formatDistance(new Date(submission.created_at), new Date(), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Contact Submission Details
                              </DialogTitle>
                            </DialogHeader>
                            {submission && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Name</label>
                                    <p className="text-base font-semibold">{submission.name}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Date</label>
                                    <p className="text-base">
                                      {new Date(submission.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                  {submission.email && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-500">Email</label>
                                      <p className="text-base">{submission.email}</p>
                                    </div>
                                  )}
                                  {submission.phone && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-500">Phone</label>
                                      <p className="text-base">{submission.phone}</p>
                                    </div>
                                  )}
                                </div>
                                {submission.subject && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Subject</label>
                                    <p className="text-base">{submission.subject}</p>
                                  </div>
                                )}
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Message</label>
                                  <p className="text-base whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                                    {submission.message}
                                  </p>
                                </div>
                                <div className="flex gap-2 pt-4 border-t">
                                  {submission.is_read ? (
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        markAsUnreadMutation.mutate(submission.id);
                                        setSelectedSubmission(null);
                                      }}
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Mark as Unread
                                    </Button>
                                  ) : (
                                    <Button
                                      onClick={() => {
                                        markAsReadMutation.mutate(submission.id);
                                        setSelectedSubmission(null);
                                      }}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Mark as Read
                                    </Button>
                                  )}
                                  <Button
                                    variant="destructive"
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete this submission?')) {
                                        deleteMutation.mutate(submission.id);
                                      }
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
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

export default AdminContactManagement;

