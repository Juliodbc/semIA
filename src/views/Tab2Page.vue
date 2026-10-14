<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>Meu perfil</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <main class="profile-wrap">
        <ion-card>
          <ion-card-header><ion-card-title>Dados do perfil</ion-card-title><ion-card-subtitle>Suas informações ficam salvas na sua conta.</ion-card-subtitle></ion-card-header>
          <ion-card-content>
            <template v-if="user">
              <ion-input v-model="nickname" label="Apelido" label-placement="stacked" autocomplete="nickname" />
              <ion-input v-model="birthDate" label="Data de nascimento" label-placement="stacked" type="date" />
              <ion-button expand="block" class="ion-margin-top" :disabled="loading" @click="save">{{ loading ? 'Salvando...' : 'Salvar perfil' }}</ion-button>
            </template>
            <ion-text v-else color="medium"><p>Entre na aba Entrar para editar seus dados.</p></ion-text>
            <ion-text v-if="message" :color="error ? 'danger' : 'success'"><p role="status">{{ message }}</p></ion-text>
          </ion-card-content>
        </ion-card>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonInput, IonPage, IonText, IonTitle, IonToolbar, onIonViewWillEnter } from '@ionic/vue'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

const user = ref<User | null>(null)
const nickname = ref('')
const birthDate = ref('')
const loading = ref(false)
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
      birthDate.value = ''
      return
    }
    const { data: profile, error: profileError } = await supabase.from('profiles').select('nickname, birth_date').eq('id', user.value.id).maybeSingle()
    if (profileError) throw profileError
    nickname.value = profile?.nickname ?? user.value.user_metadata.nickname ?? ''
    birthDate.value = profile?.birth_date ?? user.value.user_metadata.birth_date ?? ''
  } catch (caught) {
    error.value = true
    message.value = caught instanceof Error ? caught.message : 'Não foi possível carregar o perfil.'
  }
})

async function save() {
  if (!supabase || !user.value) {
    error.value = true
    message.value = 'Entre na sua conta para salvar o perfil.'
    return
  }
  loading.value = true
  message.value = ''
  error.value = false
  try {
    const { error: saveError } = await supabase.from('profiles').upsert({
      id: user.value.id,
      nickname: nickname.value,
      birth_date: birthDate.value || null,
      updated_at: new Date().toISOString(),
    })
    if (saveError) throw saveError
    message.value = 'Perfil salvo com sucesso.'
  } catch (caught) {
    error.value = true
    message.value = caught instanceof Error ? caught.message : 'Não foi possível salvar o perfil.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.profile-wrap { max-width: 600px; margin: 4vh auto 0; }
ion-input { margin-bottom: 16px; }
</style>
