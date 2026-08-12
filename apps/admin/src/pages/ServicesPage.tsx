import type { Service } from '@storedash/shared';
import { formatZAR } from '@storedash/shared';
import { Edit2, Search, Sparkles, Trash2, Plus } from 'lucide-react';
import { useState } from 'react';
import { ApprovalBadge } from '../components/ApprovalBadge';
import { ServiceModal } from '../components/ServiceModal';
import { EmptyState, ErrorState, Spinner } from '../components/ui/States';
import { useStore } from '../context/StoreContext';
import { createService, deleteService, fetchMyServices, updateService } from '../lib/api';
import { useAsync } from '../lib/useAsync';

export function ServicesPage() {
  const { currentStore } = useStore();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const query = useAsync(
    () => (currentStore ? fetchMyServices({ storeId: currentStore.id, search: search || undefined, limit: 100 }) : Promise.reject(new Error('no store'))),
    [currentStore?.id, search],
  );

  if (!currentStore) return <EmptyState title="No store selected" description="Select or create a store first." />;

  const handleSave = async (data: Partial<Service>) => {
    if (editing) {
      await updateService(editing.id, data);
    } else {
      await createService({ ...data, storeId: currentStore.id });
    }
    query.reload();
  };

  const handleDelete = async (service: Service) => {
    if (!confirm(`Delete "${service.name}"? This cannot be undone.`)) return;
    await deleteService(service.id);
    query.reload();
  };

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-1">{currentStore.name}</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold"
        >
          <Plus className="size-4" /> Add Service
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search services…"
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {query.loading && <Spinner />}
      {query.error && <ErrorState message={query.error} onRetry={query.reload} />}

      {!query.loading && !query.error && (
        query.data?.items.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {query.data.items.map((service) => (
              <div key={service.id} className={`bg-surface border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 ${!service.isActive ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{service.category}</span>
                    <h3 className="text-sm font-bold text-gray-900">{service.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditing(service);
                        setModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/10"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button onClick={() => handleDelete(service)} className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                {service.description && <p className="text-xs text-gray-500 line-clamp-2">{service.description}</p>}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100 flex-wrap">
                  <span className="text-sm font-extrabold text-gray-900">{formatZAR(service.price)}</span>
                  {service.durationMinutes && <span className="text-xs text-gray-400">{service.durationMinutes} min</span>}
                  {!service.isActive && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>}
                  <ApprovalBadge status={service.approvalStatus} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Sparkles} title="No services yet" description="Add your first service to start taking bookings." />
        )
      )}

      <ServiceModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} editingService={editing} />
    </div>
  );
}
