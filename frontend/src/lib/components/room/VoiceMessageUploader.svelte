<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Upload, Mic, FileAudio } from "@lucide/svelte";
  import ErrorAlert from "$lib/components/common/ErrorAlert.svelte";
  import SuccessAlert from "$lib/components/common/SuccessAlert.svelte";

  let { 
    roomId, 
    accessToken,
    onUploadSuccess 
  }: { 
    roomId: string; 
    accessToken: string;
    onUploadSuccess: () => void;
  } = $props();

  let selectedFile: File | null = $state(null);
  let isUploading = $state(false);
  let uploadError = $state<string | null>(null);
  let uploadSuccess = $state(false);

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      if (!file.type.startsWith('audio/')) {
        uploadError = 'Please select an audio file';
        selectedFile = null;
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        uploadError = 'File size must be less than 5MB';
        selectedFile = null;
        return;
      }
      
      selectedFile = file;
      uploadError = null;
      uploadSuccess = false;
    }
  }

  async function uploadVoiceMessage() {
    if (!selectedFile) return;

    isUploading = true;
    uploadError = null;
    uploadSuccess = false;

    try {
      const formData = new FormData();
      formData.append('audio', selectedFile);
      formData.append('room_id', roomId);
      formData.append('duration_seconds', (Math.floor(Math.random() * 10) + 5).toString());

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData
      });

      if (response.ok) {
        uploadSuccess = true;
        selectedFile = null;
        
        const fileInput = document.getElementById('audio-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        onUploadSuccess();
        
        setTimeout(() => { uploadSuccess = false; }, 3000);
      } else {
        const error = await response.json();
        uploadError = error.error || 'Failed to upload voice message';
      }
    } catch (error) {
      uploadError = 'An error occurred while uploading';
    } finally {
      isUploading = false;
    }
  }
</script>

<Card>
  <CardHeader>
    <CardTitle class="flex items-center gap-2">
      <Mic class="size-5" />
      Send Voice Message
    </CardTitle>
  </CardHeader>

  <CardContent class="space-y-4">
    {#if uploadSuccess}
      <SuccessAlert message="Voice message uploaded successfully! 🎉" />
    {/if}

    {#if uploadError}
      <ErrorAlert message={uploadError} />
    {/if}

    <div class="space-y-4">
      <div>
        <label 
          for="audio-file" 
          class="block text-sm font-medium mb-2"
        >
          Select Audio File
        </label>
        <input
          id="audio-file"
          type="file"
          accept="audio/*"
          onchange={handleFileSelect}
          class="block w-full text-sm text-muted-foreground
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-primary file:text-primary-foreground
            hover:file:bg-primary/90
            file:cursor-pointer cursor-pointer"
        />
        <p class="text-xs text-muted-foreground mt-1">
          Max file size: 5MB. Supported formats: MP3, WAV, WebM, etc.
        </p>
      </div>

      {#if selectedFile}
        <Card class="bg-muted">
          <CardContent class="pt-4">
            <div class="flex items-center gap-3">
              <FileAudio class="size-8 text-muted-foreground" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{selectedFile.name}</p>
                <p class="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <Badge variant="secondary">Ready</Badge>
            </div>
          </CardContent>
        </Card>
      {/if}

      <Button
        onclick={uploadVoiceMessage}
        disabled={!selectedFile || isUploading}
        class="w-full"
      >
        <Upload />
        {isUploading ? 'Uploading...' : 'Upload Voice Message'}
      </Button>
    </div>
  </CardContent>
</Card>
