import { Search, ChevronLeft, ChevronRight, X, User, Mail, Phone, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import { API_URL } from '../config';
import { getToken } from '../utils/auth';

/* -------------------- Toast -------------------- */
const showToast = (
  title: string,
  message: string,
  icon: 'success' | 'error' | 'warning'
) => {
  Swal.fire({
    title,
    text: message,
    icon,
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
  });
};

/* -------------------- Types -------------------- */
interface Lead {
  _id: string;
  name?: string;
  email: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  leads: Lead[];
}

/* -------------------- Component -------------------- */
export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Pagination (client side)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* -------------------- Helper Functions -------------------- */
  const getSafeDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getFullDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  /* -------------------- Fetch All Leads -------------------- */
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/leads`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data: ApiResponse = await res.json();

      if (data.success && Array.isArray(data.leads)) {
        setLeads(data.leads);
        setFilteredLeads(data.leads);
      } else {
        setLeads([]);
        setFilteredLeads([]);
        showToast('Error', 'Failed to load leads', 'error');
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      showToast('Error', 'Failed to load leads', 'error');
      setLeads([]);
      setFilteredLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Search filter (client side)
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = leads.filter(
      (lead) =>
        (lead.name && lead.name.toLowerCase().includes(query)) ||
        lead.email.toLowerCase().includes(query) ||
        (lead.phoneNumber && lead.phoneNumber.includes(query))
    );
    setFilteredLeads(filtered);
    setCurrentPage(1);
  }, [searchQuery, leads]);

  /* -------------------- View Lead (Modal) -------------------- */
  const handleView = (leadRecord: Record<string, unknown>) => {
    const lead = leadRecord as unknown as Lead;
    setSelectedLead(lead);
    setShowLeadModal(true);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  /* -------------------- Table Columns -------------------- */
  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value: unknown, row: Record<string, unknown>) => {
        const lead = row as unknown as Lead;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User size={14} className="text-gray-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{lead.name || '—'}</p>
              <p className="text-xs text-gray-500">{lead.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'phoneNumber',
      label: 'Phone',
      render: (value: unknown) => {
        const phone = value as string;
        return phone ? <span>{phone}</span> : <span className="text-gray-400">—</span>;
      },
    },
    {
      key: 'createdAt',
      label: 'Date Received',
      render: (value: unknown) => <span>{getSafeDate(value as string)}</span>,
    },
  ];

  /* -------------------- Pagination Component -------------------- */
  const PaginationFooter = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between border-t px-4 py-3 sm:px-6">
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredLeads.length)}
              </span>{' '}
              of <span className="font-medium">{filteredLeads.length}</span> leads
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      currentPage === pageNum
                        ? 'z-10 bg-[#d0a19b] text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d0a19b]'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  /* -------------------- Lead Modal Component -------------------- */
  const LeadModal = () => {
    if (!selectedLead) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Mail className="text-[#d0a19b]" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">Lead Details</h2>
            </div>
            <button
              onClick={() => setShowLeadModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <div className="space-y-5">
              {/* Name */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#d0a19b]/10 rounded-full flex items-center justify-center">
                  <User size={20} className="text-[#d0a19b]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-800">{selectedLead.name || 'Not provided'}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#d0a19b]/10 rounded-full flex items-center justify-center">
                  <Mail size={20} className="text-[#d0a19b]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email Address</p>
                  <p className="font-medium text-gray-800">{selectedLead.email}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#d0a19b]/10 rounded-full flex items-center justify-center">
                  <Phone size={20} className="text-[#d0a19b]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium text-gray-800">{selectedLead.phoneNumber || 'Not provided'}</p>
                </div>
              </div>

              {/* Created At */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#d0a19b]/10 rounded-full flex items-center justify-center">
                  <Calendar size={20} className="text-[#d0a19b]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submitted On</p>
                  <p className="font-medium text-gray-800">{getFullDate(selectedLead.createdAt)}</p>
                </div>
              </div>

              {/* Last Updated (only if different) */}
              {selectedLead.updatedAt && selectedLead.updatedAt !== selectedLead.createdAt && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#d0a19b]/10 rounded-full flex items-center justify-center">
                    <Calendar size={20} className="text-[#d0a19b]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium text-gray-800">{getFullDate(selectedLead.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
            <Button
              onClick={() => setShowLeadModal(false)}
              className="w-full bg-gradient-to-r from-[#d0a19b] to-[#e8c3bd] text-white border-0"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#4B5563]">All Leads</h1>
        <div className="text-sm text-gray-500">Total: {leads.length} leads</div>
      </div>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D0A19B]"
              disabled={loading}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d0a19b] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading leads...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table
                columns={columns}
                data={paginatedLeads as Record<string, unknown>[]}
                onView={handleView}
                // No onDelete prop – admins cannot delete leads
              />
            </div>

            {filteredLeads.length > 0 && <PaginationFooter />}

            {filteredLeads.length === 0 && !loading && (
              <div className="text-center py-10">
                <Mail className="mx-auto w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-500">No leads found</p>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Lead Details Modal */}
      {showLeadModal && <LeadModal />}
    </div>
  );
}