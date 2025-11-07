import React, { useEffect, useMemo, useState } from 'react';
import { FiX, FiSearch, FiRefreshCw, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const ClientPickerModal = ({
  isOpen,
  onClose,
  clients = [],
  onSelect,
  initialSelectedId,
  onRefresh, // optional: function to reload clients
}) => {
  const [query, setQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setCurrentPage(1);
      if (typeof onRefresh === 'function') {
        try { onRefresh(); } catch (e) { /* noop */ }
      }
    }
  }, [isOpen, onRefresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const name = (c?.name || '').toLowerCase();
      const company = (c?.company || '').toLowerCase();
      const email = (c?.email || '').toLowerCase();
      return name.includes(q) || company.includes(q) || email.includes(q);
    });
  }, [clients, query]);

  const totalPages = Math.max(1, Math.ceil((filtered?.length || 0) / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(pageStart, pageStart + pageSize);

  const handleSelect = (client) => {
    if (!client || !client.id) return;
    try { onSelect?.(client); } finally { onClose?.(); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Choose Client</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 pt-4 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by name, company, or email"
              />
            </div>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="px-2 py-2 border border-gray-300 rounded-md focus:outline-none"
              aria-label="Page size"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <button
              type="button"
              onClick={onRefresh}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              title="Refresh clients"
            >
              <FiRefreshCw className="inline mr-1" /> Refresh
            </button>
          </div>

          {/* List */}
          <div className="border rounded-md overflow-hidden">
            <div className="grid grid-cols-12 bg-gray-50 text-gray-700 text-sm px-4 py-2">
              <div className="col-span-5">Name</div>
              <div className="col-span-4">Company</div>
              <div className="col-span-3">Email</div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {pageItems.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No clients found</div>
              ) : (
                pageItems.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className={`w-full grid grid-cols-12 items-center px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 ${
                      (initialSelectedId && String(initialSelectedId) === String(c.id)) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="col-span-5">
                      <div className="font-medium text-gray-900">{c?.name || '—'}</div>
                      {c?.phone && (
                        <div className="text-xs text-gray-500 mt-0.5">{c.phone}</div>
                      )}
                    </div>
                    <div className="col-span-4 text-gray-700">{c?.company || '—'}</div>
                    <div className="col-span-3 text-gray-700 truncate">{c?.email || '—'}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-gray-600">
              Showing {pageItems.length} of {filtered.length} clients
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="px-3 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <FiChevronLeft className="inline" /> Prev
              </button>
              <span className="text-sm text-gray-700">Page {currentPage} / {totalPages}</span>
              <button
                className="px-3 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Next <FiChevronRight className="inline" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientPickerModal;