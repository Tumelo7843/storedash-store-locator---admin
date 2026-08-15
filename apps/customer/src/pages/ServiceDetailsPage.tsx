import { formatZAR } from '@storedash/shared';
import { ArrowLeft, ChevronRight, Clock, Store as StoreIcon } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState, ErrorState, Spinner } from '../components/ui/States';
import { fetchService, fetchStore } from '../lib/api';
import { useAsync } from '../lib/useAsync';

export function ServiceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const serviceId = Number(id);
  const navigate = useNavigate();

  const serviceQuery = useAsync(() => fetchService(serviceId), [serviceId]);
  const service = serviceQuery.data;
  const storeQuery = useAsync(() => (service ? fetchStore(service.storeId) : Promise.resolve(null)), [service?.storeId]);

  if (serviceQuery.loading) return <Spinner label="Loading service…" />;
  if (serviceQuery.error) return <ErrorState message={serviceQuery.error} onRetry={serviceQuery.reload} />;
  if (!service) return <EmptyState title="Service not found" description="This service may have been removed or is no longer available." />;

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 w-fit"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      <div className="relative aspect-4/3 sm:aspect-16/9 bg-gray-100 rounded-2xl overflow-hidden">
        {service.imageUrl ? (
          <img src={service.imageUrl} alt={service.name} className="size-full object-cover" />
        ) : (
          <div className="size-full flex items-center justify-center text-gray-400">
            <StoreIcon className="size-10" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wide">{service.category}</span>
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${service.isActive ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'}`}>
            {service.isActive ? 'Available' : 'Currently unavailable'}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{service.name}</h1>
        <div className="flex items-center gap-3">
          <span className="text-xl font-extrabold text-primary">{formatZAR(service.price)}</span>
          {service.durationMinutes && (
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="size-3.5" /> {service.durationMinutes} min
            </span>
          )}
        </div>
      </div>

      {service.description && <p className="text-sm text-gray-600 leading-relaxed">{service.description}</p>}

      {storeQuery.data && (
        <Link
          to={`/stores/${storeQuery.data.id}`}
          className="flex items-center gap-3 bg-surface border border-gray-200 rounded-2xl p-4 hover:border-accent/40 transition-colors"
        >
          <div className="size-11 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
            {storeQuery.data.imageUrl ? (
              <img src={storeQuery.data.imageUrl} alt="" className="size-full object-cover" />
            ) : (
              <StoreIcon className="size-5 text-gray-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900 truncate">{storeQuery.data.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {storeQuery.data.address}, {storeQuery.data.city}
            </p>
          </div>
          <ChevronRight className="size-4 text-gray-400 shrink-0" />
        </Link>
      )}
    </div>
  );
}
