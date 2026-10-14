<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>Início</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <main class="welcome-wrap">
        <ion-card>
          <ion-card-content class="welcome-content">
            <template v-if="user">
              <ion-avatar class="avatar"><img v-if="avatarUrl" :src="avatarUrl" alt="Foto do perfil" /><ion-icon v-else :icon="personCircleOutline" /></ion-avatar>
              <ion-card-title>Olá, {{ nickname || user.email }}!</ion-card-title>
              <p>Que bom ter você por aqui.</p>
              <ion-item lines="none"><input type="file" accept="image/*" aria-label="Escolher foto de perfil" @change="uploadAvatar" /></ion-item>
              <ion-text v-if="message" :color="error ? 'danger' : 'success'"><p role="status">{{ message }}</p></ion-text>
              <ion-button expand="block" fill="outline" @click="signOut">Sair da conta</ion-button>
            </template>
            <template v-else>
              <ion-icon class="welcome-icon" :icon="personCircleOutline" />
              <ion-card-title>Boas-vindas!</ion-card-title>
              <p>Entre ou crie uma conta na aba Entrar para começar.</p>
            </template>
          </ion-card-content>
        </ion-card>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IonAvatar, IonButton, IonCard, IonCardContent, IonCardTitle, IonContent, IonHeader, IonIcon, IonItem, IonPage, IonText, IonTitle, IonToolbar, onIonViewWillEnter } from '@ionic/vue'
import type { User } from '@supabase/supabase-js'
import { personCircleOutline } from 'ionicons/icons'
import { supabase } from '@/lib/supabase'

const user = ref<User | null>(null)
const nickname = ref('')
const avatarUrl = ref('')
const message = ref('')
const error = ref(false)

onIonViewWillEnter(async () => {
  if (!supabase) return
  message.value = ''
  try {
    const { data, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError
    user.value = data.user
    if (!user.value) {
      nickname.value = ''
      avatarUrl.value = ''
      return
    }
    nickname.value = user.value.user_metadata.nickname ?? ''
    const { data: profile, error: profileError } = await supabase.from('profiles').select('nickname, avatar_url').eq('id', user.value.id).maybeSingle()
    if (profileError) throw profileError
    nickname.value = profile?.nickname || nickname.value
    avatarUrl.value = profile?.avatar_url ?? ''
  } catch (caught) {
    error.value = true
    message.value = caught instanceof Error ? caught.message : 'Não foi possível carregar o perfil.'
  }
})

async function uploadAvatar(event: Event) {
  if (!supabase || !user.value) {
    error.value = true
    message.value = 'Entre na sua conta para enviar uma foto.'
    return
  }
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) { message.value = 'Escolha um arquivo de imagem.'; error.value = true; return }
  if (file.size > 5 * 1024 * 1024) { message.value = 'A imagem deve ter no máximo 5 MB.'; error.value = true; return }
  message.value = ''
  error.value = false
  try {
    const safeName = file.name.replace(/[^\w.-]/g, '_')
    const path = `${user.value.id}/${Date.now()}-${safeName}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type })
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const { error: saveError } = await supabase.from('profiles').upsert({ id: user.value.id, avatar_url: data.publicUrl })
    if (saveError) throw saveError
    avatarUrl.value = data.publicUrl
    message.value = 'Foto atualizada.'
  } catch (caught) {
    error.value = true
    message.value = caught instanceof Error ? caught.message : 'Não foi possível enviar a foto.'
  }
}

async function signOut() {
  if (!supabase) return
  const { error: signOutError } = await supabase.auth.signOut()
  if (signOutError) {
    error.value = true
    message.value = signOutError.message
    return
  }
  user.value = null
  nickname.value = ''
  avatarUrl.value = ''
  message.value = ''
}
</script>

<style scoped>
.welcome-wrap { max-width: 560px; margin: 8vh auto 0; text-align: center; }
.welcome-content { padding: 32px 24px; }
.avatar { width: 96px; height: 96px; margin: 0 auto 20px; }
.avatar ion-icon, .welcome-icon { width: 72px; height: 72px; color: var(--ion-color-primary); }
.welcome-icon { margin-bottom: 12px; }
ion-item { --padding-start: 0; justify-content: center; margin: 12px 0 20px; }
</style>
