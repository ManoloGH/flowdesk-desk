'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import { Clock, AlertTriangle, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Comment { id: string; content: string; is_internal: boolean; created_at: string; slot: { id: string; name: string; avatar_url: string | null; type: string } }
interface History { id: string; action: string; from_value: string | null; to_value: string | null; notes: string | null; created_at: string; slot: { name: string; avatar_url: string | null } | null }
interface Approval { id: string; step: number; status: string; notes: string | null; decided_at: string | null; approver: { id: string; name: string; avatar_url: string | null } }
interface SocRequest {
  id: string; request_number: string; title: string; description: string | null;
  status: string; priority: string; form_data: Record<string, any> | null;
  due_date: string | null; sla_breached: boolean; created_at: string;
  sla_hours: number | null; resolution_hours: number | null;
  service: { name: string; icon: string | null; color: string | null; form_schema: any[] | null; requires_approval: boolean; department: { name: string; color: string } };
  requester: { id: string; name: string; avatar_url: string | null };
  assigned_to: { id: string; name: string } | null;
  comments: Comment[];
  history: History[];
  approvals: Approval[];
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Borrador', PENDING: 'Pendiente', APPROVED: 'Aprobado', IN_PROGRESS: 'En proceso',
  WAITING_INFO: 'Esperando info', IN_REVIEW: 'En revisión', ACCEPTED: 'Aceptado',
  CLOSED: 'Cerrado', REJECTED: 'Rechazado', CANCELLED: 'Cancelado',
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'text-amber-400 bg-amber-500/10', APPROVED: 'text-blue-400 bg-blue-500/10',
  IN_PROGRESS: 'text-indigo-400 bg-indigo-500/10', WAITING_INFO: 'text-orange-400 bg-orange-500/10',
  IN_REVIEW: 'text-purple-400 bg-purple-500/10', ACCEPTED: 'text-emerald-400 bg-emerald-500/10',
  CLOSED: 'text-gray-400 bg-gray-800', REJECTED: 'text-red-400 bg-red-500/10', CANCELLED: 'text-gray-500 bg-gray-800',
};
const HISTORY_LABEL: Record<string, string> = {
  created: 'Solicitud creada', status_changed: 'Estado actualizado', assigned: 'Asignada a',
  approved: 'Aprobada', rejected: 'Rechazada', comment_added: 'Comentario agregado',
};

// Transiciones que el usuario puede hacer desde la vista
const REQUESTER_TRANSITIONS: Record<string, string[]> = {
  IN_REVIEW: ['ACCEPTED'], ACCEPTED: ['CLOSED'], PENDING: ['CANCELLED'], APPROVED: ['CANCELLED'],
};
const PROVIDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['IN_PROGRESS', 'WAITING_INFO', 'REJECTED'],
  APPROVED: ['IN_PROGRESS', 'WAITING_INFO'],
  IN_PROGRESS: ['IN_REVIEW', 'WAITING_INFO'],
  WAITING_INFO: ['IN_PROGRESS'],
};

function formatDate(d: string) {
  return new Date(d).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function RequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [request, setRequest] = useState<SocRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => { load(); }, [requestId]);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<SocRequest>(`/soc/requests/${requestId}`);
      setRequest(data);
    } finally {
      setLoading(false);
    }
  }

  async function transition(status: string) {
    if (!request) return;
    setTransitioning(true);
    try {
      await api.patch(`/soc/requests/${request.id}/status`, { status });
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setTransitioning(false);
    }
  }

  async function sendComment() {
    if (!comment.trim() || !request) return;
    setSubmitting(true);
    try {
      await api.post(`/soc/requests/${request.id}/comments`, { content: comment, is_internal: isInternal });
      setComment('');
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Solicitud no encontrada
      </div>
    );
  }

  const isRequester = request.requester.id === user?.slot_id;
  const reqTransitions = isRequester ? (REQUESTER_TRANSITIONS[request.status] ?? []) : [];
  const provTransitions = !isRequester ? (PROVIDER_TRANSITIONS[request.status] ?? []) : [];
  const allTransitions = [...reqTransitions, ...provTransitions];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="text-xs text-gray-500 hover:text-gray-300 mb-4 block"
      >
        ← Volver
      </button>

      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-base flex-shrink-0"
              style={{ background: `${request.service.color ?? '#6366F1'}20` }}
            >
              {request.service.icon ?? '📋'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-500 font-mono">{request.request_number}</span>
                <span className="text-xs text-gray-500">{request.service.department.name} · {request.service.name}</span>
              </div>
              <h1 className="text-lg font-bold text-white">{request.title}</h1>
              {request.description && (
                <p className="text-sm text-gray-400 mt-1">{request.description}</p>
              )}
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_COLOR[request.status] ?? 'text-gray-400 bg-gray-800'}`}>
            {STATUS_LABEL[request.status]}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 flex-wrap">
          <span>Solicitó: <strong className="text-gray-300">{request.requester.name}</strong></span>
          {request.assigned_to && (
            <span>Asignado: <strong className="text-gray-300">{request.assigned_to.name}</strong></span>
          )}
          <span>{formatDate(request.created_at)}</span>
          {request.due_date && (
            <span className={`flex items-center gap-1 ${request.sla_breached ? 'text-red-400' : ''}`}>
              {request.sla_breached ? <AlertTriangle size={11} /> : <Clock size={11} />}
              {request.sla_breached ? 'SLA vencido' : `Vence ${formatDate(request.due_date)}`}
            </span>
          )}
        </div>

        {/* Acciones de transición */}
        {allTransitions.length > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {allTransitions.map(s => (
              <button
                key={s}
                onClick={() => transition(s)}
                disabled={transitioning}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                  ['REJECTED','CANCELLED'].includes(s)
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    : s === 'ACCEPTED' || s === 'APPROVED'
                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'
                }`}
              >
                {transitioning ? <Loader2 size={12} className="animate-spin" /> : null}
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Datos del formulario */}
        <div className="lg:col-span-2 space-y-4">
          {request.form_data && request.service.form_schema && request.service.form_schema.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="font-semibold text-white mb-4 text-sm">Información de la solicitud</h2>
              <div className="space-y-3">
                {request.service.form_schema.map((field: any) => (
                  <div key={field.id}>
                    <p className="text-xs text-gray-500 mb-0.5">{field.label}</p>
                    <p className="text-sm text-white">{String(request.form_data?.[field.id] ?? '—')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comentarios */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-4 text-sm">Conversación</h2>
            <div className="space-y-3 mb-4">
              {request.comments.length === 0 ? (
                <p className="text-xs text-gray-500">Sin comentarios aún</p>
              ) : (
                request.comments.map(c => (
                  <div key={c.id} className={`flex gap-2.5 ${c.is_internal ? 'opacity-70' : ''}`}>
                    <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {c.slot.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-gray-300">{c.slot.name}</span>
                        {c.is_internal && (
                          <span className="text-xs bg-gray-800 text-gray-500 px-1.5 rounded">Nota interna</span>
                        )}
                        <span className="text-xs text-gray-600">{formatDate(c.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-200">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Input */}
            <div className="flex gap-2 mt-2">
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Escribe un comentario..."
                rows={2}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
              <div className="flex flex-col gap-1">
                <button
                  onClick={sendComment}
                  disabled={submitting || !comment.trim()}
                  className="flex items-center justify-center w-9 h-9 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin text-white" /> : <Send size={14} className="text-white" />}
                </button>
                <button
                  onClick={() => setIsInternal(v => !v)}
                  title={isInternal ? 'Nota interna' : 'Visible para todos'}
                  className={`flex items-center justify-center w-9 h-9 rounded-lg text-xs transition-colors ${isInternal ? 'bg-gray-700 text-amber-400' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}
                >
                  🔒
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Línea de tiempo */}
        <div className="space-y-4">
          {/* Aprobaciones */}
          {request.service.requires_approval && request.approvals.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Aprobaciones</h3>
              <div className="space-y-2">
                {request.approvals.map(a => (
                  <div key={a.id} className="flex items-center gap-2">
                    {a.status === 'approved' && <CheckCircle size={14} className="text-emerald-400" />}
                    {a.status === 'rejected' && <XCircle size={14} className="text-red-400" />}
                    {a.status === 'pending' && <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-600" />}
                    <span className="text-xs text-gray-300">Paso {a.step}: {a.approver.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historial */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Historial</h3>
            <div className="space-y-3">
              {request.history.map((h, i) => (
                <div key={h.id} className="flex gap-2.5">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-0.5" />
                    {i < request.history.length - 1 && <div className="w-px flex-1 bg-gray-800 mt-1" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-xs text-gray-300">
                      {HISTORY_LABEL[h.action] ?? h.action}
                      {h.to_value && h.action === 'status_changed' && (
                        <span className="text-indigo-400"> → {STATUS_LABEL[h.to_value] ?? h.to_value}</span>
                      )}
                    </p>
                    {h.notes && <p className="text-xs text-gray-500 mt-0.5">{h.notes}</p>}
                    <p className="text-xs text-gray-600 mt-0.5">{formatDate(h.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
