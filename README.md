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

Sem essas chaves o site já funciona no modo TV com as listas. A busca e o QR Code ficam desativados até a configuração.

### 1. Chave da API do YouTube (busca e vídeos das listas)

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/) e crie um projeto (ou use o mesmo do Firebase).
2. Em **APIs e serviços → Biblioteca**, ative a **YouTube Data API v3**.
3. Em **APIs e serviços → Credenciais → Criar credenciais → Chave de API**.
4. Edite a chave:
   - **Restrições de aplicativo → Sites (referenciadores HTTP)**: `https://aglalberto.github.io/*` e `http://localhost:5173/*`.
   - **Restrições de API → Restringir chave**: só a YouTube Data API v3.
5. No GitHub: **Settings → Secrets and variables → Actions → New repository secret**, nome `YT_API_KEY`.

> A chave vai junto do site publicado (é assim que o navegador consegue buscar); por isso a restrição por site é essencial. A cota gratuita é de 10.000 unidades por dia, e cada busca usa 100 (cerca de 100 buscas por dia). As buscas ficam em cache por 24h em cada navegador.

### 2. Firebase (QR Code / celular)

1. Acesse o [Firebase Console](https://console.firebase.google.com/) e crie um projeto (o Google Analytics é opcional).
2. **Criação → Realtime Database → Criar banco de dados** (qualquer local, modo bloqueado). Na aba **Regras**, cole o conteúdo de [`database.rules.json`](database.rules.json) e publique.
3. **Criação → Authentication → Começar → Método de login**: ative **Anônimo**.
4. Em **Authentication → Configurações → Domínios autorizados**, adicione `aglalberto.github.io`.
5. Em **Configurações do projeto → Seus apps**, registre um app **Web** (`</>`) e copie os valores de `firebaseConfig`.
6. No GitHub: **Settings → Secrets and variables → Actions → aba Variables → New repository variable**, uma para cada valor:

| Variável | Valor do `firebaseConfig` |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_DATABASE_URL` | `databaseURL` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

> Essas configurações do Firebase são públicas por natureza; quem protege os dados são as regras do banco. Pelas regras, o celular só consegue criar pedidos e excluir as próprias músicas, e só a TV dona da fila publica a cópia da fila.

### 3. Publicar

Na aba **Actions**:

1. Rode **Resolve videos** (*Run workflow*) para buscar os vídeos das listas. Cada execução faz até 50 buscas para sobrar cota para o site, então a primeira carga completa leva uns 3 dias. Depois disso, o workflow roda sozinho toda madrugada, valida os vídeos e troca os que saírem do ar.
2. Rode **Deploy** para publicar com as chaves novas. Todo push na `main` também publica.

Enquanto uma música das listas ainda não tem vídeo definido, o "+" abre a busca já preenchida com o nome dela.

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
