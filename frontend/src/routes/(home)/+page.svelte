<script lang="ts">
  import type { PageData } from './$types';
  import UserInfoCard from "$lib/components/home/UserInfoCard.svelte";
  import CreateRoomDialog from "$lib/components/home/CreateRoomDialog.svelte";
  import RoomsList from "$lib/components/home/RoomsList.svelte";
  
  let { data }: { data: PageData } = $props();
</script>

<div class="min-h-screen bg-muted/50 p-4 md:p-8">
  <div class="max-w-4xl mx-auto space-y-6">
    <UserInfoCard user={data.user} />
    
    <div class="flex justify-center">
      <CreateRoomDialog />
    </div>
    
    <RoomsList 
      rooms={data.rooms} 
      roomsCount={data.roomsCount} 
      currentUserId={data.user?.id}
      error={data.error}
    />
  </div>
</div>
