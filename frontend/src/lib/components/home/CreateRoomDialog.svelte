<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "$lib/components/ui/dialog";
  import { Plus } from "@lucide/svelte";
  import type { SubmitFunction } from "@sveltejs/kit";

  let open = $state(false);
  let participantEmail = $state('');
  let isSubmitting = $state(false);

  const handleSubmit: SubmitFunction = () => {
    isSubmitting = true;
    
    return async ({ result, update }) => {
      await update();
      
      if (result.type === 'success') {
        open = false;
        participantEmail = '';
      }
      
      isSubmitting = false;
    };
  };
</script>

<Dialog bind:open>
  <DialogTrigger>
    <Button>
      <Plus />
      Create Room
    </Button>
  </DialogTrigger>
  
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create New Room</DialogTitle>
      <DialogDescription>
        Enter the email address of the person you want to chat with
      </DialogDescription>
    </DialogHeader>
    
    <form method="POST" action="?/createRoom" use:enhance={handleSubmit}>
      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label for="participant">Participant Email</Label>
          <Input
            id="participant"
            name="participant"
            type="email"
            required
            placeholder="friend@example.com"
            bind:value={participantEmail}
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Room'}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
