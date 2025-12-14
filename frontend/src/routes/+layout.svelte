<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
  import type { LayoutData } from './$types';
	
	let { data, children }: {data: LayoutData, children: any} = $props();

  $effect(() => {
    if (data.user) {
      console.log('[Layout] User authenticated', {
        userId: data.user.id,
        username: data.user.username,
        email: data.user.email
      });
    } else {
      console.log('[Layout] No authenticated user');
    }
  });
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
