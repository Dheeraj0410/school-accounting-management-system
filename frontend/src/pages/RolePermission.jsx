import { useCallback, useEffect, useState } from 'react';
import API from '../api/axios';
import { Can, usePermission } from '../components/context/PermissionContext';

export default function RolePermissionPage() {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [selectedPermIds, setSelectedPermIds] = useState([]);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { hasPermission } = usePermission();

    const fetchData = useCallback(async () => {
        try {
            const [rolesResponse, permissionsResponse] = await Promise.all([
                API.get('/roles'),
                API.get('/permissions'),
            ]);
            setRoles(rolesResponse.data);
            setPermissions(permissionsResponse.data);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Could not load roles and permissions.');
        }
    }, []);

    useEffect(() => {
        void Promise.resolve().then(fetchData);
    }, [fetchData]);

    const handleCheckboxChange = (permissionId) => {
        const id = String(permissionId);
        setSelectedPermIds((previous) => previous.includes(id)
            ? previous.filter((selectedId) => selectedId !== id)
            : [...previous, id]);
    };

    const selectRole = (roleId) => {
        setSelectedRoleId(String(roleId));
        const role = roles.find((item) => String(item.id) === String(roleId));
        setSelectedPermIds(role?.permissions?.map((permission) => String(permission.permission_id ?? permission.id)) || []);
    };

    const openModal = (role = null) => {
        setError('');
        setEditing(Boolean(role));
        setSelectedRoleId(role ? String(role.id) : '');
        setSelectedPermIds(role?.permissions?.map((permission) => String(permission.permission_id ?? permission.id)) || []);
        setIsModalOpen(true);
    };

    const handleAssignSubmit = async (event) => {
        event.preventDefault();
        if (!selectedRoleId) {
            setError('Please select a role.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const request = { role_id: selectedRoleId, permission_ids: selectedPermIds };
            if (editing && hasPermission('rolepermission.edit')) {
                await API.put('/role-permissions', request);
            } else {
                await API.post('/role-permissions', request);
            }
            setIsModalOpen(false);
            await fetchData();
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Could not save role permissions.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-1">Role Permissions</h1>
                    <p className="text-base text-gray-600">Choose which active permissions each role receives.</p>
                </div>
                <Can permission="rolepermission.store">
                    <button onClick={() => openModal()} className="bg-blue-600 text-white px-5 py-2.5 rounded-md shadow hover:bg-blue-700 font-medium">
                        + Assign Permissions
                    </button>
                </Can>
            </div>

            {error && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-slate-100 text-gray-700 text-sm">
                            <th className="py-3 px-4 text-left">#</th>
                            <th className="py-3 px-4 text-left">Role</th>
                            <th className="py-3 px-4 text-left">Permissions</th>
                            {(hasPermission('rolepermission.edit') || hasPermission('rolepermission.store')) && <th className="py-3 px-4 text-left">Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map((role, index) => (
                            <tr key={role.id} className="border-t hover:bg-slate-50">
                                <td className="py-2 px-4">{index + 1}</td>
                                <td className="py-2 px-4 font-medium">{role.name}</td>
                                <td className="py-2 px-4">
                                    {role.permissions?.length
                                        ? role.permissions.map((permission) => permission.name).join(', ')
                                        : <span className="text-gray-400 text-sm">No permissions assigned</span>}
                                </td>
                                {(hasPermission('rolepermission.edit') || hasPermission('rolepermission.store')) && (
                                    <td className="py-2 px-4">
                                        <Can permission={hasPermission('rolepermission.edit') ? 'rolepermission.edit' : 'rolepermission.store'}>
                                            <button onClick={() => openModal(role)} className="text-blue-600 hover:underline text-sm">Edit</button>
                                        </Can>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="relative w-full max-w-2xl rounded-lg bg-white p-8 shadow-md">
                        <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-3 text-2xl font-bold text-gray-400" aria-label="Close">&times;</button>
                        <h2 className="mb-6 text-2xl font-semibold text-blue-700">{editing ? 'Edit Role Permissions' : 'Assign Permissions to a Role'}</h2>
                        {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
                        <form onSubmit={handleAssignSubmit}>
                            <label className="mb-5 block text-sm font-medium">Select Role
                                <select value={selectedRoleId} onChange={(event) => selectRole(event.target.value)} className="mt-2 w-full rounded border px-3 py-2" required disabled={editing}>
                                    <option value="">-- Select Role --</option>
                                    {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                                </select>
                            </label>
                            <fieldset className="mb-5">
                                <legend className="mb-2 text-sm font-medium">Select permissions (leave all unchecked to revoke all)</legend>
                                <div className="grid max-h-56 grid-cols-1 gap-3 overflow-y-auto rounded border bg-slate-50 p-3 sm:grid-cols-2">
                                    {permissions.map((permission) => (
                                        <label key={permission.id} className="flex items-center gap-2">
                                            <input type="checkbox" checked={selectedPermIds.includes(String(permission.id))} onChange={() => handleCheckboxChange(permission.id)} />
                                            <span>{permission.name} <span className="text-xs text-slate-500">({permission.status})</span></span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                            <div className="flex justify-end">
                                <button type="submit" disabled={loading} className="rounded bg-blue-600 px-7 py-2.5 font-semibold text-white disabled:opacity-50">{loading ? 'Saving...' : 'Save Permissions'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
