<script lang="ts">
  import { Alert, AlertDescription } from "$lib/components/ui/alert";
  import { CircleCheck } from "@lucide/svelte";

  let { message }: { message: string } = $props();
</script>

<Alert class="border-green-200 bg-green-50 text-green-800">
  <CircleCheck class="text-green-600" />
  <AlertDescription>{message}</AlertDescription>
</Alert>
