<script lang="ts">
  let { isConnected = $bindable(false) }: { isConnected: boolean } = $props();
</script>

<div class="flex items-center gap-2 px-3 py-2 rounded-full {isConnected ? 'bg-green-100' : 'bg-red-100'}">
  <div class="w-3 h-3 rounded-full {isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}"></div>
  <span class="text-sm font-medium {isConnected ? 'text-green-700' : 'text-red-700'}">
    {isConnected ? 'Connected' : 'Disconnected'}
  </span>
</div>
