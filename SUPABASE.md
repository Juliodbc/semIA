# Finalizar a configuração do Supabase

1. No SQL Editor do Supabase, execute o conteúdo de `supabase/setup.sql`. Ele cria a tabela `profiles`, as regras RLS, o cadastro automático do perfil e o bucket de fotos.
2. Em **Authentication → URL Configuration**, adicione `http://localhost:5173/tabs/tab1` em **Redirect URLs** para que a recuperação de senha retorne ao app. Em produção, inclua também o endereço publicado.
3. Inicie o app com `npm run dev`.

O cadastro e o login usam Supabase Auth; apelido e nascimento ficam na tabela `profiles`; a foto vai para Storage. As fotos usam um bucket público, enquanto cada usuário só pode enviar arquivos para sua própria pasta. Os dados do perfil são protegidos por RLS.
