import { useCallback, useEffect, useState } from 'react';
import API from '../api/axios';
import { Can, usePermission } from '../components/context/PermissionContext';

const emptyForm = { name: '', slug: '', status: 'inactive' };

export default function PermissionsPage() {
    const [permissions, setPermissions] = useState([]);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { hasPermission } = usePermission();

    const fetchPermissions = useCallback(async () => {
        try {
            const { data } = await API.get('/permissions');
            setPermissions(data);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Could not load permissions.');
        }
    }, []);

    useEffect(() => {
        void Promise.resolve().then(fetchPermissions);
    }, [fetchPermissions]);

    const openModal = (permission = null) => {
        setEditingId(permission?.id ?? null);
        setFormData(permission
            ? { name: permission.name, slug: permission.slug, status: permission.status }
            : emptyForm);
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
                await API.put(`/permissions/${editingId}`, formData);
            } else {
                await API.post('/permissions', formData);
            }
            setIsModalOpen(false);
            await fetchPermissions();
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Could not save permission.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this permission?')) return;
        setError('');
        try {
            await API.delete(`/permissions/${id}`);
            await fetchPermissions();
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Could not delete permission.');
        }
    };

    const normalizedSearch = search.toLowerCase();
    const filteredPermissions = permissions.filter((permission) =>
        permission.name.toLowerCase().includes(normalizedSearch) ||
        permission.slug.toLowerCase().includes(normalizedSearch)
    );

    return (
        <div className="p-6 mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-1">Permissions Management</h1>
                    <p className="text-base text-gray-600">Manage permission records used to control access.</p>
                </div>
                <Can permission="permission.store">
                    <button onClick={() => openModal()} className="bg-blue-600 text-white px-5 py-2.5 rounded-md shadow hover:bg-blue-700 transition font-medium">
                        + New Permission
                    </button>
                </Can>
            </div>

            {error && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}

            <Can permission="permission.read">
                <div className="mb-6 flex justify-end">
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search permissions by name or slug..."
                        className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                </div>
            </Can>

            {filteredPermissions.length > 0 ? (
                <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-slate-100 text-gray-700 text-sm">
                                <th className="py-3 px-4 text-left">#</th>
                                <th className="py-3 px-4 text-left">Name</th>
                                <th className="py-3 px-4 text-left">Slug</th>
                                <th className="py-3 px-4 text-left">Status</th>
                                <th className="py-3 px-4 text-left">Created At</th>
                                {(hasPermission('permission.edit') || hasPermission('permission.delete')) && (
                                    <th className="py-3 px-4 text-left">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPermissions.map((permission, index) => (
                                <tr key={permission.id} className="border-t hover:bg-slate-50">
                                    <td className="py-2 px-4">{index + 1}</td>
                                    <td className="py-2 px-4 font-medium">{permission.name}</td>
                                    <td className="py-2 px-4 text-slate-700">{permission.slug}</td>
                                    <td className="py-2 px-4">
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                            permission.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
                                        }`}>
                                            {permission.status}
                                        </span>
                                    </td>
                                    <td className="py-2 px-4 text-slate-500 text-sm">
                                        {permission.created_at ? new Date(permission.created_at).toLocaleDateString() : '—'}
                                    </td>
                                    {(hasPermission('permission.edit') || hasPermission('permission.delete')) && (
                                        <td className="py-2 px-4">
                                            <div className="flex gap-2">
                                                <Can permission="permission.edit">
                                                    <button onClick={() => openModal(permission)} className="text-blue-600 hover:underline text-sm">Edit</button>
                                                </Can>
                                                <Can permission="permission.delete">
                                                    <button onClick={() => handleDelete(permission.id)} className="text-rose-600 hover:underline text-sm">Delete</button>
                                                </Can>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="py-8 text-gray-500 text-lg text-center">No permissions found.</div>
            )}

            {isModalOpen && (
                <div className="fixed z-50 inset-0 flex items-center justify-center bg-black/30 px-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8 relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl" aria-label="Close">&times;</button>
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">{editingId ? 'Edit Permission' : 'Create New Permission'}</h3>
                        {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block font-medium mb-1 text-gray-700">Permission Name</label>
                                <input type="text" value={formData.name} onChange={handleNameChange} className="w-full border border-slate-300 rounded px-3 py-2" required maxLength={255} />
                            </div>
                            <div>
                                <label className="block font-medium mb-1 text-gray-700">Permission Slug</label>
                                <input type="text" value={formData.slug} onChange={(event) => setFormData({ ...formData, slug: event.target.value })} className="w-full border border-slate-300 rounded px-3 py-2" required maxLength={255} />
                            </div>
                            <div>
                                <label className="block font-medium mb-1 text-gray-700">Status</label>
                                <select value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value })} className="w-full border border-slate-300 rounded px-3 py-2">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="flex justify-end">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded mr-2">Cancel</button>
                                <button type="submit" disabled={loading} className="bg-blue-600 text-white px-5 py-2 rounded disabled:opacity-50">
                                    {loading ? 'Saving...' : editingId ? 'Save Changes' : 'Add Permission'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
