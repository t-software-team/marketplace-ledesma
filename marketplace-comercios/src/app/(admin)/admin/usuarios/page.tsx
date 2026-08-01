import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { EmptyBoxIllustration } from '@/components/shared/empty-illustrations'
import { getUsersDirectory } from '@/lib/admin/queries'
import { UsersTable } from './users-table'

const ROLE_LABELS = {
  client: 'Clientes',
  shop_admin: 'Comerciantes',
  superadmin: 'Superadmins',
} as const

export default async function AdminUsersPage() {
  const users = await getUsersDirectory()

  const groups: Record<'all' | keyof typeof ROLE_LABELS, typeof users> = {
    all: users,
    client: users.filter((user) => user.role === 'client'),
    shop_admin: users.filter((user) => user.role === 'shop_admin'),
    superadmin: users.filter((user) => user.role === 'superadmin'),
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading">Usuarios</h1>
        <p className="text-sm text-muted-foreground">Directorio de usuarios registrados</p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos ({groups.all.length})</TabsTrigger>
          <TabsTrigger value="client">{ROLE_LABELS.client} ({groups.client.length})</TabsTrigger>
          <TabsTrigger value="shop_admin">{ROLE_LABELS.shop_admin} ({groups.shop_admin.length})</TabsTrigger>
          <TabsTrigger value="superadmin">{ROLE_LABELS.superadmin} ({groups.superadmin.length})</TabsTrigger>
        </TabsList>

        {(Object.keys(groups) as Array<keyof typeof groups>).map((key) => (
          <TabsContent key={key} value={key} className="space-y-3 pt-3">
            {groups[key].length === 0 ? (
              <EmptyState
                illustration={<EmptyBoxIllustration />}
                message="No hay usuarios en esta categoría."
              />
            ) : (
              <UsersTable users={groups[key]} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
