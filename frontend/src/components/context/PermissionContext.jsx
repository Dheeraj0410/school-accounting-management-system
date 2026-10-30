import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import API from '../../api/axios';

const PermissionContext = createContext({
    hasPermission: () => false,
    setUserPermissions: () => {},
    permissionsLoading: false,
    permissionsError: '',
});

export const PermissionProvider = ({ children }) => {
    const [userPermissions, setUserPermissionsState] = useState([]);
    const [permissionsLoading, setPermissionsLoading] = useState(() => Boolean(localStorage.getItem('token')));
    const [permissionsError, setPermissionsError] = useState('');

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            return undefined;
        }

        let isCurrent = true;
        API.get('/auth/me')
            .then(({ data }) => {
                if (!isCurrent) return;
                localStorage.setItem('user', JSON.stringify(data.user));
                setUserPermissionsState(Array.isArray(data.user.permissions) ? data.user.permissions : []);
                setPermissionsError('');
            })
            .catch((error) => {
                if (!isCurrent) return;
                setUserPermissionsState([]);
                setPermissionsError(error.response?.data?.message || 'Could not refresh permissions.');
            })
            .finally(() => {
                if (isCurrent) setPermissionsLoading(false);
            });

        return () => {
            isCurrent = false;
        };
    }, []);

    const setUserPermissions = useCallback((permissions) => {
        setUserPermissionsState(permissions);
        setPermissionsError('');
        setPermissionsLoading(false);
    }, []);

    const value = useMemo(() => ({
        hasPermission: (slug) => userPermissions.includes(slug),
        setUserPermissions,
        permissionsLoading,
        permissionsError,
    }), [userPermissions, setUserPermissions, permissionsLoading, permissionsError]);

    return (
        <PermissionContext.Provider value={value}>
            {children}
        </PermissionContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePermission = () => useContext(PermissionContext);

// Equivalent to @permission('slug') ... @endpermission
export const Can = ({ permission, children }) => {
    const { hasPermission } = usePermission();
    return hasPermission(permission) ? <>{children}</> : null;
};