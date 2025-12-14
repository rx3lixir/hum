<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import { Separator } from "$lib/components/ui/separator";
  import { MessageSquare, Users, ArrowRight } from "@lucide/svelte";
  import ErrorAlert from "$lib/components/common/ErrorAlert.svelte";

  let { 
    rooms, 
    roomsCount, 
    currentUserId,
    error 
  }: { 
    rooms: any[]; 
    roomsCount: number; 
    currentUserId: string;
    error?: string;
  } = $props();
</script>

<Card>
  <CardHeader>
    <div class="flex justify-between items-center">
      <CardTitle class="flex items-center gap-2">
        <MessageSquare class="size-5" />
        Your Rooms
      </CardTitle>
      <Badge variant="secondary">{roomsCount}</Badge>
    </div>
  </CardHeader>

  <CardContent>
    {#if error}
      <ErrorAlert message={error} />
    {:else if rooms.length === 0}
      <div class="text-center py-12">
        <MessageSquare class="size-12 mx-auto text-muted-foreground mb-4" />
        <p class="text-muted-foreground mb-2">No rooms yet</p>
        <p class="text-sm text-muted-foreground">Create one to start chatting! 🎉</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each rooms as room, idx}
          {#if idx > 0}
            <Separator />
          {/if}
          
          <div class="flex justify-between items-center py-2">
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold">Room {room.room.id.slice(0, 8)}...</h3>
                <Badge variant="outline" class="gap-1">
                  <Users class="size-3" />
                  {room.participants.length}
                </Badge>
              </div>
              
              <div class="flex gap-2">
                {#each room.participants as participant}
                  <Badge variant={participant.user_id === currentUserId ? "default" : "secondary"}>
                    {participant.user_id === currentUserId ? 'You' : participant.user_id.slice(0, 8)}
                  </Badge>
                {/each}
              </div>
            </div>
            
            <Button href="/room/{room.room.id}" variant="ghost" size="sm">
              Open
              <ArrowRight class="size-4" />
            </Button>
          </div>
        {/each}
      </div>
    {/if}
  </CardContent>
</Card>
