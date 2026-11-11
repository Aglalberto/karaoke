# Karaokê

Plataforma web de karaokê numa única página: as músicas mais cantadas no Brasil e no mundo, busca no YouTube e fila de reprodução. Os convidados também podem adicionar músicas pelo celular, lendo o QR Code.

**Site:** https://aglalberto.github.io/karaoke/

## Como funciona

- **Modo TV** (computador ligado na TV): vídeo fixo, menu lateral com busca, listas e histórico, e fila no rodapé.
- **Modo celular** (aberto pelo QR Code do menu): buscar, navegar pelas listas, ver a fila e o histórico, e adicionar músicas. Quem adicionou pelo celular pode excluir as próprias músicas.
- A fila, a música atual e o histórico ficam salvos no **localStorage do navegador da TV**. O Firebase serve só de ponte: leva os pedidos do celular para a TV e devolve ao celular uma cópia da fila, apenas para leitura.

### Na TV

| Ação | Como |
|---|---|
| Adicionar música | "+" na busca ou numa lista → "Quem vai cantar essa?" |
| Play / pause | Barra de espaço (fora de pop-ups e campos de texto) |
| Opções de uma música da fila | Clique no cartão: **Próxima da fila**, **Standby** / **Retomar a fila**, **Excluir** |
| Reordenar a fila | Arraste pelo botão de ordenar (⇅) ou use as setas ← → com ele focado |
| Standby | A música fica congelada no lugar e é pulada até ser retomada (ex.: a pessoa saiu e canta quando voltar) |
| Pular a música atual | Botão ⏭ no cartão "Tocando agora" |
| Tela cheia | Botão no canto superior direito |

Quando uma música termina, ela vai para o histórico e aparece a tela **"Agora é a vez de"** com uma contagem de 8 segundos. A próxima música fica carregada e pausada: ela só começa quando alguém aperta play ou espaço.

## Configuração (uma vez)

Leva uns 20 minutos. Sem essa configuração o site já funciona no modo TV com as listas, mas a busca e o QR Code ficam desativados.

### 0. Fazer o merge do PR (primeiro)

Faça o merge do pull request na `main`. O site é publicado sozinho, já com as listas. O merge vem antes porque o botão **Run workflow** do passo 4 só aparece para workflows que estão na `main`.

> Em **Settings → Pages**, a fonte (*Source*) deve estar como **GitHub Actions**.

### 1. Firebase (comece por ele, porque ele cria o projeto no Google)

1. Acesse o [Firebase Console](https://console.firebase.google.com/), clique em **Criar um projeto**, dê o nome `karaoke` e pode desativar o Google Analytics.
2. **Criação → Realtime Database → Criar banco de dados**: escolha um local (ex.: `us-central1`), marque **Iniciar no modo bloqueado** e clique em **Ativar**.
3. Na aba **Regras**, apague o conteúdo, cole o arquivo [`database.rules.json`](database.rules.json) e clique em **Publicar**.
4. **Criação → Authentication → Vamos começar**. Na aba **Método de login**, escolha **Anônimo**, ative e salve.
5. **Authentication → Configurações → Domínios autorizados → Adicionar domínio**: `aglalberto.github.io`.
6. Clique em **⚙ → Configurações do projeto → Seus apps** e no ícone **`</>`**. Dê um apelido (ex.: `karaoke-web`), deixe o Hosting desmarcado e clique em **Registrar**. Anote estes 5 valores do `firebaseConfig`: `apiKey`, `authDomain`, `databaseURL`, `projectId` e `appId`.
   - Se o `databaseURL` não aparecer, copie o endereço do topo da página do Realtime Database (algo como `https://karaoke-xxxx-default-rtdb.firebaseio.com`).

> Essas configurações do Firebase são públicas por natureza; quem protege os dados são as regras do banco. Pelas regras, o celular só consegue criar pedidos e excluir as próprias músicas, e só a TV dona da fila publica a cópia da fila.

### 2. Chave da API do YouTube (busca e vídeos das listas)

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/) e selecione o projeto `karaoke` no seletor do topo. É o mesmo projeto criado pelo Firebase.
2. **APIs e serviços → Biblioteca**: procure **YouTube Data API v3** e clique em **Ativar**.
3. **APIs e serviços → Credenciais → + Criar credenciais → Chave de API**. Crie uma chave **nova**. Não reaproveite a "Browser key (auto created by Firebase)".
4. Edite a chave nova:
   - **Restrições de aplicativo → Sites**: `https://aglalberto.github.io/*` e `http://localhost:5173/*`.
   - **Restrições de API → Restringir chave**: só a **YouTube Data API v3**. Salve.
5. Copie a chave. As restrições podem levar até 5 minutos para valer.

> A chave vai junto do site publicado (é assim que o navegador consegue buscar); por isso a restrição por site é essencial. A cota gratuita é de 10.000 unidades por dia, e cada busca usa 100 (cerca de 100 buscas por dia). As buscas ficam em cache por 24h em cada navegador.

### 3. GitHub: guardar as chaves

Em **Settings → Secrets and variables → Actions**:

**Aba Secrets → New repository secret**

| Name | Valor |
|---|---|
| `YT_API_KEY` | a chave do YouTube |

**Aba Variables → New repository variable** (uma por linha, valores sem aspas)

| Name | Valor do `firebaseConfig` |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_DATABASE_URL` | `databaseURL` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

### 4. Publicar com as chaves

Na aba **Actions**:

1. **Resolve videos → Run workflow → Run**. Cada execução preenche até 50 músicas, para sobrar cota para o site. Depois disso, o workflow roda sozinho toda madrugada, valida os vídeos e troca os que saírem do ar. A carga inicial completa leva uns 3 dias. Enquanto uma música ainda não tem vídeo, o "+" abre a busca já preenchida com o nome dela.
2. **Deploy → Run workflow → Run**. Isso publica o site já com as chaves. Todo push na `main` também publica.

### 5. Testar

1. Abra https://aglalberto.github.io/karaoke/ no computador. O QR Code deve aparecer no menu.
2. Faça uma busca pelo menu e confira se aparecem resultados.
3. Leia o QR com o celular (teste também com o celular no 4G). Deve aparecer "TV conectada".
4. Adicione uma música pelo celular e veja se ela entra na fila da TV.
5. Toque uma música até o fim e confira se ela aparece no histórico, na TV e no celular.

### Se algo falhar

| Sintoma | Causa provável |
|---|---|
| QR mostra "Configure o Firebase para ativar" | Variáveis faltando ou com nome errado, ou o Deploy não rodou depois de criá-las |
| QR mostra "Sem conexão" | Login Anônimo desativado, regras não publicadas ou `databaseURL` errado |
| Busca diz que recusou a chave | API não ativada ou restrição de site errada (espere 5 min depois de salvar) |
| Busca diz que o limite diário acabou | A cota gratuita do dia acabou; volta no dia seguinte (use as listas) |
| Celular mostra "TV não encontrada" | A página da TV não está aberta ou não conectou ao Firebase |
| *Resolve videos* não encontra vídeos | Secret `YT_API_KEY` ausente ou API do YouTube não ativada |

## Desenvolvimento

```bash
npm install
cp .env.example .env.local   # opcional: preencha as chaves
npm run dev                  # http://localhost:5173/karaoke/
npm run build                # checagem de tipos + build de produção
npm test                     # testes do script de vídeos
```

Para testar o modo celular localmente, abra `http://localhost:5173/karaoke/?tv=<id>`. O `<id>` é o valor da chave `karaoke:tvId` no localStorage da TV, e o Firebase precisa estar configurado no `.env.local`.

### Estrutura

```
src/
  main.tsx              escolhe o modo: TV ou celular (?tv=)
  tv/                   modo TV: menu, player, fila, tela "Agora é a vez de"
  remote/               modo celular: abas Buscar, Listas, Fila e Histórico
  components/           pop-ups, linhas de música, busca, listas, histórico
  lib/state.ts          fila/histórico da TV (localStorage)
  lib/host-bridge.ts    TV ↔ Firebase (recebe pedidos, publica a cópia da fila)
  lib/remote-bridge.ts  celular ↔ Firebase (envia pedidos, lê a fila)
  lib/youtube-search.ts busca no YouTube com cache
  data/songs.json       listas curadas (artista, música, vídeo)
scripts/resolve-videos.mjs   busca/valida os vídeos das listas (usado pelo workflow)
database.rules.json          regras de segurança do Firebase
```

### Listas

As listas ficam em `src/data/songs.json` e podem ser editadas à vontade: cada música aparece uma vez em `songs` e é referenciada pelo id nas `lists`. Para trocar o vídeo de uma música, ponha o ID do YouTube em `videoId`. Para deixar o workflow escolher, use `null`.

A curadoria partiu de pesquisas e rankings públicos: a pesquisa KWC Brasil citada pela imprensa ("Evidências" como a mais cantada nos karaokês), o ranking do Ecad das mais tocadas em shows em 2025, rankings da Singa e da KaraFun, e a lista da Billboard das maiores músicas de karaokê. Como não existe um ranking oficial completo de karaokê no Brasil, a ordem dentro de cada lista é uma curadoria e não uma medição.
