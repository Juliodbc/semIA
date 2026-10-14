<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>Minha conta</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <main class="auth-wrap">
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ mode === 'signup' ? 'Criar conta' : mode === 'reset' ? 'Recuperar senha' : mode === 'update' ? 'Nova senha' : 'Bem-vindo' }}</ion-card-title>
            <ion-card-subtitle>{{ mode === 'signup' ? 'Cadastre-se para começar.' : mode === 'reset' ? 'Enviaremos um link para seu e-mail.' : mode === 'update' ? 'Escolha uma nova senha para sua conta.' : 'Entre para acessar seu perfil.' }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ion-input v-if="mode === 'signup'" v-model="nickname" label="Apelido" label-placement="stacked" placeholder="Como podemos chamar você?" autocomplete="nickname" />
            <ion-input v-if="mode === 'signup'" v-model="birthDate" label="Data de nascimento" label-placement="stacked" type="date" />
            <ion-input v-model="email" label="E-mail" label-placement="stacked" type="email" autocomplete="email" />
            <ion-input v-if="mode !== 'reset'" v-model="password" :label="mode === 'update' ? 'Nova senha' : 'Senha'" label-placement="stacked" type="password" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" />
            <ion-button expand="block" class="ion-margin-top" :disabled="loading" @click="submit">
              {{ loading ? 'Aguarde...' : mode === 'signup' ? 'Criar conta' : mode === 'reset' ? 'Enviar link' : mode === 'update' ? 'Salvar nova senha' : 'Entrar' }}
            </ion-button>
            <ion-text v-if="message" :color="error ? 'danger' : 'success'"><p role="status">{{ message }}</p></ion-text>
            <div class="auth-links">
              <ion-button v-if="mode === 'login'" fill="clear" size="small" @click="mode = 'reset'; message = ''">Esqueci minha senha</ion-button>
              <ion-button v-if="mode === 'login' || mode === 'signup'" fill="clear" size="small" @click="mode = mode === 'signup' ? 'login' : 'signup'; message = ''">
                {{ mode === 'signup' ? 'Já tenho conta' : 'Criar uma conta' }}
              </ion-button>
              <ion-button v-if="mode === 'reset'" fill="clear" size="small" @click="mode = 'login'; message = ''">Voltar ao login</ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonInput, IonPage, IonText, IonTitle, IonToolbar } from '@ionic/vue'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const mode = ref<'login' | 'signup' | 'reset' | 'update'>('login')
const email = ref('')
const password = ref('')
const nickname = ref('')
const birthDate = ref('')
const loading = ref(false)
const message = ref('')
const error = ref(false)

const authSubscription = supabase?.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') mode.value = 'update'
})
onUnmounted(() => authSubscription?.data.subscription.unsubscribe())

async function submit() {
  if (!supabase) {
    error.value = true
    message.value = 'Não foi possível conectar ao serviço. Confira a configuração do aplicativo.'
    return
  }
  if ((mode.value !== 'update' && !email.value.trim()) || (mode.value !== 'reset' && !password.value)) {
    error.value = true
    message.value = 'Preencha o e-mail e a senha.'
    return
  }
  if (mode.value === 'signup' && (!nickname.value || !birthDate.value)) {
    error.value = true
    message.value = 'Preencha o apelido e a data de nascimento.'
    return
  }
  loading.value = true
  message.value = ''
  error.value = false
  try {
    if (mode.value === 'signup') {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.value.trim(),
        password: password.value,
        options: { data: { nickname: nickname.value, birth_date: birthDate.value } },
      })
      if (signupError) throw signupError
      if (data.session) {
        await router.replace('/tabs/tab3')
      } else {
        message.value = 'Conta criada. Confira seu e-mail para confirmar o cadastro.'
      }
    } else if (mode.value === 'reset') {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.value.trim(), {
        redirectTo: `${window.location.origin}/tabs/tab1`,
      })
      if (resetError) throw resetError
      message.value = 'Se o e-mail estiver cadastrado, você receberá o link de recuperação.'
    } else if (mode.value === 'update') {
      const { error: updateError } = await supabase.auth.updateUser({ password: password.value })
      if (updateError) throw updateError
      mode.value = 'login'
      password.value = ''
      message.value = 'Senha atualizada. Você já pode entrar com a nova senha.'
    } else {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.value.trim(), password: password.value })
      if (loginError) throw loginError
      await router.replace('/tabs/tab3')
    }
  } catch (caught) {
    error.value = true
    message.value = caught instanceof Error ? caught.message : 'Não foi possível concluir a operação.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-wrap { max-width: 520px; margin: 8vh auto 0; }
ion-input { margin-bottom: 16px; }
.auth-links { display: flex; flex-wrap: wrap; justify-content: center; }
</style>
