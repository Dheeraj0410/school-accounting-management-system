import { useCallback, useEffect, useState } from 'react';
import API from '../api/axios';
import { usePermission } from '../components/context/PermissionContext';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [error, setError] = useState('');
    const [savingUserId, setSavingUserId] = useState(null);
    const [showAddUser, setShowAddUser] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
    const [addingUser, setAddingUser] = useState(false);
    const { hasPermission } = usePermission();

    const fetchData = useCallback(async () => {
        try {
            const requests = [API.get('/users')];
            if (hasPermission('user.role.assign')) requests.push(API.get('/roles'));
            const [usersResponse, rolesResponse] = await Promise.all(requests);
            setUsers(usersResponse.data);
            setRoles(rolesResponse?.data || []);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Could not load users and roles.');
        }
    }, [hasPermission]);

    useEffect(() => {
        void Promise.resolve().then(fetchData);
    }, [fetchData]);

    const assignRole = async (userId, roleId) => {
        setError('');
        setSavingUserId(String(userId));
        try {
            await API.patch(`/users/${userId}/role`, { role_id: roleId || null });
            await fetchData();
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Could not assign the role.');
        } finally {
            setSavingUserId(null);
        }
    };

    const addUser = async (event) => {
        event.preventDefault();
        setError('');
        setAddingUser(true);
        try {
            await API.post('/users', newUser);
            setNewUser({ name: '', email: '', password: '' });
            setShowAddUser(false);
            await fetchData();
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Could not add the user.');
        } finally {
            setAddingUser(false);
        }
    };

    return (
        <section className="p-6">
            <h1 className="mb-2 text-2xl font-extrabold text-gray-900">Users &amp; Roles</h1>
            <p className="mb-6 text-gray-600">Assign a role to each staff account. Permission changes appear for users after they reload the app.</p>
            {hasPermission('user.create') && (
                <div className="mb-4">
                    <button type="button" onClick={() => setShowAddUser((shown) => !shown)} className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
                        {showAddUser ? 'Cancel' : 'Add User'}
                    </button>
                    {showAddUser && (
                        <form onSubmit={addUser} className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4">
                            <label className="flex flex-col gap-1">Name
                                <input required value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} className="rounded border px-3 py-2" />
                            </label>
                            <label className="flex flex-col gap-1">Email
                                <input required type="email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} className="rounded border px-3 py-2" />
                            </label>
                            <label className="flex flex-col gap-1">Password
                                <input required type="password" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} className="rounded border px-3 py-2" />
                            </label>
                            <button type="submit" disabled={addingUser} className="rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50">
                                {addingUser ? 'Adding…' : 'Create User'}
                            </button>
                        </form>
                    )}
                </div>
            )}
            {error && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
            <div className="overflow-x-auto rounded-lg border bg-white shadow">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-slate-100 text-left text-sm text-gray-700">
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-t">
                                <td className="px-4 py-3 font-medium">{user.name}</td>
                                <td className="px-4 py-3">{user.email}</td>
                                <td className="px-4 py-3">
                                    {hasPermission('user.role.assign') ? (
                                        <select
                                            aria-label={`Role for ${user.name}`}
                                            value={user.role_id ? String(user.role_id) : ''}
                                            onChange={(event) => assignRole(user.id, event.target.value)}
                                            disabled={savingUserId === String(user.id)}
                                            className="rounded border px-3 py-2 disabled:opacity-50"
                                        >
                                            <option value="">No role</option>
                                            {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                                        </select>
                                    ) : user.role?.name || 'No role'}
                                </td>
                                
                            </tr>
                        ))}
                        {users.length === 0 && <tr><td colSpan="3" className="p-6 text-center text-slate-500">No users found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
