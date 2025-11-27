# Como sincronizar a view do Supabase com Google Sheets (Apps Script)

Passo a passo em português para expor apenas os campos necessários ao cliente via Google Sheets, usando uma view de leitura + Apps Script.

## 1) Criar a view no Supabase
1. Abra o Supabase SQL Editor.
2. Cole o conteúdo de `supabase/views/customer_contacts_view.sql`.
3. Execute o SQL para criar/atualizar a view.
4. Certifique-se de que as políticas (RLS) permitem `SELECT` nessa view para a chave de leitura (ideal: `anon` ou um usuário/role de leitura dedicado).

## 2) Preparar a planilha do cliente
1. Crie/abra a planilha no Google Sheets.
2. Anote o `SPREADSHEET_ID` (na URL).
3. Acesse Extensões → App Script.

## 3) Configurar o Apps Script
1. Crie um novo projeto e substitua o código pelo conteúdo de `scripts/google-appscript-sync.js`.
2. Vá em Projetos → Propriedades do projeto → Propriedades do script:
   - Adicione `SUPABASE_URL` com a URL do seu projeto (ex.: `https://<project>.supabase.co`).
   - Adicione `SUPABASE_KEY` com a chave de leitura (não use service role).
   - Opcional: `SUPABASE_VIEW` (default: `customer_contacts_view`).
   - Opcional: `SHEET_NAME` (default: `Data`).
3. Salve as propriedades.

## 4) Rodar e autorizar
1. No Apps Script, selecione a função `syncSupabaseToSheet` e clique em Executar.
2. Autorize o script na conta Google da planilha.
3. Após a primeira execução, confira se a aba `Data` foi preenchida.

## 5) Agendar atualização automática
1. No Apps Script, execute a função `createTrigger` uma vez.
2. Isso cria um gatilho horário (1x/hora). Ajuste no painel de gatilhos se quiser outra cadência.

## 6) Segurança e boas práticas
- Use uma chave de leitura limitada pela view (RLS) para evitar expor dados sensíveis.
- Não deixe o service role no script.
- A view deve conter apenas as colunas permitidas ao cliente.

## 7) Resumo dos arquivos
- View SQL: `supabase/views/customer_contacts_view.sql`
- Código Apps Script: `scripts/google-appscript-sync.js`
