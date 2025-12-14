<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { Separator } from "$lib/components/ui/separator";
  import { Users, Calendar } from "@lucide/svelte";

  let { 
    participants, 
    currentUserId 
  }: { 
    participants: any[]; 
    currentUserId: string;
  } = $props();
</script>

<Card>
  <CardHeader>
    <CardTitle class="flex items-center gap-2">
      <Users class="size-5" />
      Participants
      <Badge variant="secondary">{participants.length}</Badge>
    </CardTitle>
  </CardHeader>
  
  <CardContent>
    <div class="space-y-3">
      {#each participants as participant, idx}
        {#if idx > 0}
          <Separator />
        {/if}
        
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <p class="font-medium">
              {participant.user_id === currentUserId ? 'You' : `User ${participant.user_id.slice(0, 8)}`}
            </p>
            <div class="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar class="size-3" />
              Joined: {new Date(participant.joined_at).toLocaleDateString()}
            </div>
          </div>
          
          {#if participant.user_id === currentUserId}
            <Badge>You</Badge>
          {/if}
        </div>
      {/each}
    </div>
  </CardContent>
</Card>
