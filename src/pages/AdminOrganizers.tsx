import { useEffect, useState } from 'react';
import { api, OrganizerApplication } from '../api/services';
import { DashboardLayout } from '../components/layout';

const adminLinks = [
  { to: '/admin/overview', label: 'Overview' },
  { to: '/admin/locations', label: 'Locations' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/organizers', label: 'Organizer Approvals' },
  { to: '/admin/events', label: 'Event Moderation' }
];

export const AdminOrganizers = () => {
  const [applications, setApplications] = useState<OrganizerApplication[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = async () => {
    try {
      const response = await api.getAdminApplications();
      setApplications(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load applications.');
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const review = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.reviewAdminApplication(id, status);
      await loadApplications();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Could not update application.');
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard" links={adminLinks}>
      <div className="bg-white border rounded-lg overflow-hidden">
        {error && <p className="px-4 pt-4 text-sm text-red-600">{error}</p>}
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Applicant</th>
              <th className="px-4 py-3 text-left">Request</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.id} className="border-t">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{application.applicantName}</p>
                  <p className="text-xs text-gray-500">{application.applicantEmail}</p>
                </td>
                <td className="px-4 py-3">{application.requestedName}</td>
                <td className="px-4 py-3 capitalize">{application.requestedType}</td>
                <td className="px-4 py-3 capitalize">{application.status}</td>
                <td className="px-4 py-3">
                  {application.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        onClick={() => review(application.id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        className="px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200"
                        onClick={() => review(application.id, 'rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-500">Finalized</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};
