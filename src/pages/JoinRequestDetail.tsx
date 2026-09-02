import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Calendar, MapPin, MessageCircle } from 'lucide-react';
import { WithdrawReason, withdrawReasonLabel } from '@uaetrail/shared-types';
import { api, ActivityRequestView } from '../api/services';
import { MobileScreen } from '../components/layout/MobileScreen';
import { GlassCard } from '../components/mobile/GlassCard';
import { AppButton } from '../components/mobile/AppButton';
import { WithdrawRequestModal } from '../components/ui/WithdrawRequestModal';

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-700',
  approved: 'bg-emerald-500/15 text-emerald-700',
  rejected: 'bg-red-500/15 text-red-600',
  cancelled: 'bg-neutral-500/10 text-neutral-500',
  waitlisted: 'bg-blue-500/15 text-blue-700',
};

export const JoinRequestDetail = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<ActivityRequestView | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showWithdraw, setShowWithdraw] = useState(false);

  useEffect(() => {
    if (!requestId) return;
    setLoading(true);
    api
      .getMeRequest(requestId)
      .then((res) => {
        setRequest(res.data);
        setNote(res.data.note ?? '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load request'))
      .finally(() => setLoading(false));
  }, [requestId]);

  const handleSaveNote = async () => {
    if (!request || request.status !== 'pending') return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.updateJoinRequestNote(request.activity.id, request.id, note.trim());
      setMessage('Your message to the organizer was updated.');
      setRequest((r) => (r ? { ...r, note: note.trim() } : r));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update request');
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async (payload: { reason: WithdrawReason; message?: string }) => {
    if (!request) return;
    setSaving(true);
    setError(null);
    try {
      await api.cancelJoinRequest(request.activity.id, request.id, payload);
      navigate('/my-requests', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel request');
      setShowWithdraw(false);
    } finally {
      setSaving(false);
    }
  };

  const askOrganizer = () => {
    if (!request?.activity.organizerUserId) {
      setError('Organizer contact is not available for this trip.');
      return;
    }
    navigate(`/messages?to=${request.activity.organizerUserId}`);
  };

  if (loading) {
    return (
      <MobileScreen title="Request" backTo="/my-requests">
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileScreen>
    );
  }

  if (!request) {
    return (
      <MobileScreen title="Request" backTo="/my-requests">
        <GlassCard padding className="text-center">
          <p className="text-neutral-600 mb-4">{error ?? 'Request not found.'}</p>
          <Link to="/my-requests" className="text-emerald-600 font-semibold text-sm">
            Back to requests
          </Link>
        </GlassCard>
      </MobileScreen>
    );
  }

  const canEdit = request.status === 'pending';
  const canWithdraw = ['pending', 'approved', 'waitlisted'].includes(request.status);
  const withdrawVariant = request.status === 'approved' ? 'trip' : 'request';

  return (
    <MobileScreen title="Join request" backTo="/my-requests" backLabel="Requests">
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {message && <p className="text-sm text-emerald-700 mb-3 font-medium">{message}</p>}

      <GlassCard padding className="mb-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">
              {request.activity.title || request.activity.locationName}
            </h2>
            <p className="text-sm text-neutral-500">{request.activity.locationName}</p>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize shrink-0 ${
              statusBadge[request.status] ?? statusBadge.cancelled
            }`}
          >
            {request.status}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {request.activity.date} · {request.activity.time}
          </span>
        </div>
        {request.activity.organizerName && (
          <p className="text-sm text-neutral-600">Organizer: {request.activity.organizerName}</p>
        )}
        <Link
          to={`/trip/${request.activity.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600"
        >
          <MapPin className="w-4 h-4" />
          View trip details
        </Link>
      </GlassCard>

      {request.status === 'cancelled' && request.cancelReason && (
        <GlassCard padding className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-1">
            Withdrawal reason
          </p>
          <p className="text-sm font-medium text-neutral-800">
            {withdrawReasonLabel(request.cancelReason)}
          </p>
          {request.cancelMessage && (
            <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{request.cancelMessage}</p>
          )}
        </GlassCard>
      )}

      {request.organizerNote && (
        <GlassCard padding className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-1">
            Organizer reply
          </p>
          <p className="text-sm text-neutral-700 leading-relaxed">{request.organizerNote}</p>
        </GlassCard>
      )}

      <GlassCard padding className="mb-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">
          Your note to organizer
        </p>
        <textarea
          className="ios-input text-[15px] min-h-[100px] resize-none"
          placeholder="Questions, dietary needs, group size…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={!canEdit || saving}
        />
        {canEdit && (
          <AppButton onClick={handleSaveNote} disabled={saving} fullWidth>
            {saving ? 'Saving…' : 'Update request note'}
          </AppButton>
        )}
        {!canEdit && request.note && (
          <p className="text-sm text-neutral-600">{request.note}</p>
        )}
      </GlassCard>

      <div className="space-y-3">
        <AppButton variant="tint" fullWidth onClick={askOrganizer} className="gap-2">
          <MessageCircle className="w-4 h-4" />
          Ask organizer a question
        </AppButton>
        {canWithdraw && (
          <button
            type="button"
            onClick={() => setShowWithdraw(true)}
            className="ios-btn w-full glass text-red-500 min-h-[48px] font-semibold"
          >
            {withdrawVariant === 'trip' ? 'Withdraw from trip' : 'Cancel join request'}
          </button>
        )}
      </div>

      <WithdrawRequestModal
        open={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        tripTitle={request.activity.title || request.activity.locationName}
        tripDate={request.activity.date}
        variant={withdrawVariant}
        submitting={saving}
        onConfirm={handleWithdraw}
      />
    </MobileScreen>
  );
};
