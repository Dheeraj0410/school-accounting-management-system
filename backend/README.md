# Backend setup and RBAC

The API uses Sequelize with the existing MySQL database. The RBAC models use the same table names and columns as the Laravel migrations: `roles`, `permissions`, and `rolepermissions`. Users have a nullable `role_id`.

## Required environment

Set these values in `backend/.env` before starting the API:

```env
DB_HOST=localhost
DB_NAME=school_accounting
DB_USER=root
DB_PASS=
JWT_SECRET=replace-with-a-long-random-secret
```

Back up an existing database before first startup because the current server synchronizes Sequelize models with `alter: true`. The API creates the default `admin` and `accountant` roles and the RBAC-management permissions if they do not exist. Registrations are assigned the least-privileged `accountant` role; the client cannot choose a role.

To bootstrap the first administrator, register the intended administrator account and then assign its role directly in MySQL as the database owner:

```sql
UPDATE `Users`
SET `role_id` = (SELECT `id` FROM `roles` WHERE `slug` = 'admin')
WHERE `email` = 'admin@school.edu';
```

The Sequelize user table in this project is `Users`. Run this once only for a trusted account. This avoids granting administrator access based only on an unverified email supplied during public registration.

Permission records must have `status = 'active'` to authorize an API request. Assign permissions to roles through the **Role Permissions** page, then assign roles to users through **Users & Roles**. The API checks the current database assignments on each protected request; users should sign in again to refresh the permissions used by frontend navigation.

## RBAC API

- `GET/POST /api/permissions`; `PUT/DELETE /api/permissions/:id`
- `GET/POST /api/roles`; `PUT/DELETE /api/roles/:id`
- `POST/PUT /api/role-permissions` to sync a role's permission IDs (an empty array revokes all)
- `GET /api/users`; `PATCH /api/users/:id/role` with `{ "role_id": 1 }` or `{ "role_id": null }`

All RBAC endpoints require a valid bearer token and the corresponding active permission. The initial administrator role is seeded with the permissions needed to manage these endpoints.
