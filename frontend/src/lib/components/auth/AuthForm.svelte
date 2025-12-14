<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card";
  import ErrorAlert from "$lib/components/common/ErrorAlert.svelte";
  import type { SubmitFunction } from "@sveltejs/kit";

  let { 
    mode = 'signin'
  }: { 
    mode: 'signin' | 'signup' 
  } = $props();

  let email = $state('');
  let password = $state('');
  let username = $state('');

  let isSubmitting = $state(false);
  let errors = $state<{ 
    username?: string;
    email?: string; 
    password?: string; 
    general?: string 
  }>({});

  const isSignup = $derived(mode === 'signup');
  const actionUrl = $derived(isSignup ? '?/signup' : '?/signin');
  const title = $derived(isSignup ? 'Sign Up 🔑' : 'Sign In 🚪');
  const description = $derived(isSignup ? 'Create a new account to get started' : 'Welcome back! Please sign in to continue');
  const buttonText = $derived(isSignup ? 'Create Account' : 'Sign In');
  const alternateText = $derived(isSignup ? 'Already have an account?' : 'Not registered yet?');
  const alternateLinkText = $derived(isSignup ? 'Sign In' : 'Sign Up');
  const alternateLink = $derived(isSignup ? '/signin' : '/signup');

  const validateEmail = (value: string): string | undefined => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
    return undefined;
  }

  const validatePassword = (value: string): string | undefined => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return undefined;
  }

  const validateUsername = (value: string): string | undefined => {
    if (!value) return 'Username is required';
    if (value.length < 3) return 'Username must be at least 3 characters';
    return undefined;
  }

  const handleSubmit: SubmitFunction = () => {
    isSubmitting = true;
    errors = {};

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const usernameError = isSignup ? validateUsername(username) : undefined;

    if (emailError || passwordError || usernameError) {
      errors = {
        email: emailError,
        password: passwordError,
        username: usernameError
      };
      isSubmitting = false;
      return () => {};
    }

    return async ({ result, update }) => {
      await update();

      if (result.type === 'success' && result.data?.success) {
        goto("/");
      } else if (result.type === 'failure') {
        errors = { general: result.data?.error || `${isSignup ? 'Sign up' : 'Sign in'} failed` };
      }
      
      isSubmitting = false;
    };
  };
</script>

<Card class="w-full max-w-md">
  <CardHeader>
    <CardTitle>{title}</CardTitle>
    <CardDescription>{description}</CardDescription>
  </CardHeader>

  <form method="POST" action={actionUrl} use:enhance={handleSubmit}>
    <CardContent class="space-y-4">
      {#if errors.general}
        <ErrorAlert message={errors.general} />
      {/if}

      {#if isSignup}
        <div class="space-y-2">
          <Label for="username">Username</Label>
          <Input 
            id="username" 
            name="username"
            type="text"
            autocomplete="username"
            required
            bind:value={username}
            aria-invalid={!!errors.username}
          />
          {#if errors.username}
            <p class="text-sm text-destructive">{errors.username}</p>
          {/if}
        </div>
      {/if}

      <div class="space-y-2">
        <Label for="email">Email</Label>
        <Input 
          id="email" 
          name="email"
          type="email"
          autocomplete="email"
          required
          bind:value={email}
          aria-invalid={!!errors.email}
        />
        {#if errors.email}
          <p class="text-sm text-destructive">{errors.email}</p>
        {/if}
      </div>

      <div class="space-y-2">
        <Label for="password">Password</Label>
        <Input 
          id="password" 
          name="password"
          type="password"
          autocomplete={isSignup ? "new-password" : "current-password"}
          required
          bind:value={password}
          aria-invalid={!!errors.password}
        />
        {#if errors.password}
          <p class="text-sm text-destructive">{errors.password}</p>
        {/if}
      </div>
    </CardContent>

    <CardFooter class="flex flex-col gap-4 mt-8">
      <Button type="submit" disabled={isSubmitting} class="w-full">
        {isSubmitting ? 'Processing...' : buttonText}
      </Button>
      
      <p class="text-center text-sm text-muted-foreground">
        {alternateText}
        <a href={alternateLink} class="text-primary hover:underline font-medium">
          {alternateLinkText}
        </a>
      </p>
    </CardFooter>
  </form>
</Card>
