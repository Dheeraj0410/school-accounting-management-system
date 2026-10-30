import { useCallback, useEffect, useState } from 'react';
import API from '../api/axios';
import { Can, usePermission } from '../components/context/PermissionContext';

const emptyForm = { name: '', slug: '' };

export default function RolesPage() {
    const [roles, setRoles] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { hasPermission } = usePermission();

    const fetchRoles = useCallback(async () => {
        try {
            const { data } = await API.get('/roles');
            setRoles(data);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Could not load roles.');
        }
    }, []);

    useEffect(() => {
        void Promise.resolve().then(fetchRoles);
    }, [fetchRoles]);

    const openModal = (role = null) => {
        setEditingId(role?.id ?? null);
        setFormData(role ? { name: role.name, slug: role.slug } : emptyForm);
        setError('');
        setIsModalOpen(true);
    };

    const handleNameChange = (event) => {
        const name = event.target.value;
        const slug = name.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '.')
            .replace(/^-+|-+$/g, '');
        setFormData((current) => ({ ...current, name, slug }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (editingId) {
                await API.put(`/roles/${editingId}`, formData);
            } else {
                await API.post('/roles', formData);
            }
            setIsModalOpen(false);
            await fetchRoles();
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Could not save role.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (role) => {
        if (!window.confirm(`Delete the ${role.name} role? Users assigned to it will become unassigned.`)) return;
        setError('');
        try {
            await API.delete(`/roles/${role.id}`);
            await fetchRoles();
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Could not delete role.');
        }
    };

    return (
        <div className="p-6 mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-1">Roles</h1>
                    <p className="text-base text-gray-600">Create roles and manage their permission assignments.</p>
                </div>
                <Can permission="role.store">
                    <button onClick={() => openModal()} className="bg-blue-600 text-white px-5 py-2.5 rounded-md shadow hover:bg-blue-700 font-medium">
                        + New Role
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
                            <th className="py-3 px-4 text-left">Slug</th>
                            <th className="py-3 px-4 text-left">Permissions</th>
                            {(hasPermission('role.edit') || hasPermission('role.delete')) && <th className="py-3 px-4 text-left">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map((role, index) => (
                            <tr key={role.id} className="border-t hover:bg-slate-50">
                                <td className="py-2 px-4">{index + 1}</td>
                                <td className="py-2 px-4 font-medium">{role.name}</td>
                                <td className="py-2 px-4">{role.slug}</td>
                                <td className="py-2 px-4">{role.permissions?.length || 0}</td>
                                {(hasPermission('role.edit') || hasPermission('role.delete')) && (
                                    <td className="py-2 px-4">
                                        <div className="flex gap-3">
                                            <Can permission="role.edit">
                                                <button onClick={() => openModal(role)} className="text-blue-600 hover:underline text-sm">Edit</button>
                                            </Can>
                                            <Can permission="role.delete">
                                                <button onClick={() => handleDelete(role)} className="text-rose-600 hover:underline text-sm">Delete</button>
                                            </Can>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {roles.length === 0 && <tr><td className="p-6 text-center text-slate-500" colSpan="5">No roles found.</td></tr>}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="relative w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
                        <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-3 text-2xl text-slate-400" aria-label="Close">&times;</button>
                        <h2 className="mb-5 text-xl font-semibold">{editingId ? 'Edit Role' : 'Create Role'}</h2>
                        {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <label className="block text-sm font-medium">Role name
                                <input className="mt-1 w-full rounded border px-3 py-2" value={formData.name} onChange={handleNameChange} maxLength={255} required />
                            </label>
                            <label className="block text-sm font-medium">Slug
                                <input className="mt-1 w-full rounded border px-3 py-2" value={formData.slug} onChange={(event) => setFormData({ ...formData, slug: event.target.value })} maxLength={255} required />
                            </label>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded bg-slate-200 px-4 py-2">Cancel</button>
                                <button disabled={loading} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{loading ? 'Saving...' : 'Save Role'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
