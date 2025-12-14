<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { LogOut, Mail } from "@lucide/svelte";

  let { user }: { user: { username: string; email: string } } = $props();
</script>

<Card>
  <CardHeader>
    <CardTitle class="flex items-center justify-between">
      <span>Welcome, {user.username}! 👋</span>
      <Badge variant="secondary">Active</Badge>
    </CardTitle>
  </CardHeader>
  
  <CardContent class="space-y-4">
    <div class="flex items-center gap-2 text-muted-foreground">
      <Mail class="size-4" />
      <span class="text-sm">{user.email}</span>
    </div>
    
    <form method="POST" action="/signout">
      <Button type="submit" variant="destructive" size="sm">
        <LogOut />
        Sign Out
      </Button>
    </form>
  </CardContent>
</Card>
