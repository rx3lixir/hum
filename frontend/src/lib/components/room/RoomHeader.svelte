<script lang="ts">
  import { Card, CardContent } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { ArrowLeft, Hash } from "@lucide/svelte";
  import ConnectionStatus from "$lib/components/common/ConnectionStatus.svelte";
  import ErrorAlert from "$lib/components/common/ErrorAlert.svelte";

  let { 
    roomId, 
    isConnected = $bindable(false),
    connectionError 
  }: { 
    roomId: string; 
    isConnected: boolean;
    connectionError?: string | null;
  } = $props();
</script>

<Card>
  <CardContent class="pt-6">
    <div class="flex justify-between items-start mb-4">
      <div>
        <h1 class="text-3xl font-bold mb-2">Room Chat</h1>
        <div class="flex items-center gap-2 text-muted-foreground">
          <Hash class="size-4" />
          <span class="text-sm font-mono">{roomId}</span>
        </div>
      </div>
      
      <ConnectionStatus bind:isConnected />
    </div>

    {#if connectionError}
      <div class="mb-4">
        <ErrorAlert message={connectionError} />
      </div>
    {/if}

    <Button href="/" variant="ghost" size="sm">
      <ArrowLeft class="size-4" />
      Back to Home
    </Button>
  </CardContent>
</Card>
