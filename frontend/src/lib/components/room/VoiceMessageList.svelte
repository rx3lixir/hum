<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { Separator } from "$lib/components/ui/separator";
  import { Spinner } from "$lib/components/ui/spinner";
  import { MessageSquare, Mic, Play } from "@lucide/svelte";

  let { 
    messages, 
    currentUserId,
    isLoading 
  }: { 
    messages: any[]; 
    currentUserId: string;
    isLoading: boolean;
  } = $props();

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  }
</script>

<Card>
  <CardHeader>
    <CardTitle class="flex items-center gap-2">
      <MessageSquare class="size-5" />
      Voice Messages
      <Badge variant="secondary">{messages.length}</Badge>
    </CardTitle>
  </CardHeader>

  <CardContent>
    {#if isLoading}
      <div class="text-center py-8 flex items-center justify-center gap-2">
        <Spinner />
        <span class="text-muted-foreground">Loading messages...</span>
      </div>
    {:else if messages.length === 0}
      <div class="text-center py-12">
        <Mic class="size-12 mx-auto text-muted-foreground mb-4" />
        <p class="text-lg mb-2 font-medium">No voice messages yet</p>
        <p class="text-sm text-muted-foreground">Upload the first one to get started! 🎤</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each messages as message, idx}
          {#if idx > 0}
            <Separator />
          {/if}
          
          <div class="p-4 rounded-lg {message.sender_id === currentUserId ? 'bg-primary/10' : 'bg-muted'}">
            <div class="flex justify-between items-start mb-3">
              <div>
                <p class="text-sm font-medium">
                  {message.sender_id === currentUserId ? 'You' : `User ${message.sender_id.slice(0, 8)}`}
                </p>
                <p class="text-xs text-muted-foreground">
                  {formatDate(message.created_at)}
                </p>
              </div>
              <Badge variant="outline">
                {formatDuration(message.duration_seconds)}
              </Badge>
            </div>

            {#if message.url}
              <audio controls class="w-full">
                <source src={message.url} type="audio/webm">
                Your browser does not support the audio element.
              </audio>
            {:else}
              <p class="text-xs text-muted-foreground italic">Audio file unavailable</p>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </CardContent>
</Card>
