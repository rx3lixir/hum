<script lang="ts">
  import { Alert, AlertDescription } from "$lib/components/ui/alert";
  import { CircleAlert } from "@lucide/svelte";

  let { message }: { message: string } = $props();
</script>

<Alert variant="destructive">
  <CircleAlert /> 
  <AlertDescription>{message}</AlertDescription>
</Alert>
