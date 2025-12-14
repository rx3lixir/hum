<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import type { PageData } from "./$types";
  import RoomHeader from "$lib/components/room/RoomHeader.svelte";
  import ParticipantsList from "$lib/components/room/ParticipantsList.svelte";
  import VoiceMessageUploader from "$lib/components/room/VoiceMessageUploader.svelte";
  import VoiceMessageList from "$lib/components/room/VoiceMessageList.svelte";

  let { data }: { data: PageData } = $props();
  
  let ws: WebSocket | null = $state(null);
  let isConnected = $state(false);
  let connectionError = $state<string | null>(null);
  let messages = $state<any[]>([]);
  let isLoadingMessages = $state(false);

  const log = (message: string, logData?: any) => {
    console.log(`[WS CLIENT] ${message}`, logData || '');
  };

  function connectWebSocket() {
    try {
      const wsUrl = `/api/ws?room_id=${data.room.id}&token=${data.accessToken}`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        log('Connected');
        isConnected = true;
        connectionError = null;
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'new_voice_message') {
            messages = [message.data, ...messages];
          }
        } catch (error) {
          log('Parse error', error);
        }
      };

      ws.onerror = () => {
        connectionError = 'Connection error occurred';
      };

      ws.onclose = () => {
        isConnected = false;
        connectionError = 'Failed to connect. Please refresh the page.';
      };
    } catch (error) {
      connectionError = "Failed to establish connection";
    }
  }

  async function loadMessages() {
    isLoadingMessages = true;
    try {
      const response = await fetch(`/api/messages/room/${data.room.id}`, {
        headers: { 'Authorization': `Bearer ${data.accessToken}` }
      });

      if (response.ok) {
        const result = await response.json();
        messages = result.messages || [];
      }
    } finally {
      isLoadingMessages = false;
    }
  }

  function disconnectWebSocket() {
    if (ws) {
      ws.close(1000, "User navigated away");
      ws = null;
    }
  }

  onMount(() => {
    connectWebSocket();
    loadMessages();
  });

  onDestroy(() => {
    disconnectWebSocket();
  });
</script>

<div class="min-h-screen bg-muted/50 p-4 md:p-8">
  <div class="max-w-4xl mx-auto space-y-6">
    <RoomHeader 
      roomId={data.room.id} 
      bind:isConnected 
      {connectionError}
    />
    
    <ParticipantsList 
      participants={data.participants} 
      currentUserId={data.user?.id}
    />
    
    <VoiceMessageUploader 
      roomId={data.room.id}
      accessToken={data.accessToken}
      onUploadSuccess={loadMessages}
    />
    
    <VoiceMessageList 
      {messages}
      currentUserId={data.user?.id}
      isLoading={isLoadingMessages}
    />
  </div>
</div>
