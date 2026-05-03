# TASK — Roadmap de Desenvolvimento

**Planejamento técnico baseado no GDD v2.0 vs. estado atual do código**

---

## Resumo do diagnóstico

| Métrica | Valor |
|---|---|
| Total de tarefas | 42 |
| Concluídas | 6 |
| Parciais | 3 |
| Pendentes | 33 |

O código atual cobre **~65% do Milestone 0** (cenário 3D base). A sala está montada, o monitor CRT funciona, a câmera tem 3 modos e a janela tem parallax. Falta tudo que transforma o cenário em jogo: IDE, KPIs, interrupções, áudio, finais.

---

## Milestone 0 — Fundação 3D (cenário base)

**Status: em andamento (~65%)**
Montar o escritório 3D em Three.js com câmera em primeira pessoa. O cenário é o palco — sem ele, nada mais funciona.

### Cenário 3D

- [x] **Cena Three.js com renderer 640×480**
  - `main.js` — `WebGLRenderer`, resolução PS1
- [x] **Sala fechada (4 paredes + chão + teto)**
  - `sceneObjects.js` — `BoxGeometry` × 6
- [x] **Mesa + monitor CRT com luz verde**
  - `sceneObjects.js` — `RoundedBoxGeometry` + `PointLight` emissivo
- [x] **Baia do cubículo (3 divisórias)**
  - `sceneObjects.js` — 3× `BoxGeometry` com `matBaia`
- [x] **Janela com parallax de 2 camadas**
  - `sceneObjects.js` — `PlaneGeometry` + `TextureLoader` + `updateParallax()`
- [x] **Iluminação multi-camada (ambiente + teto + janela + hemisférica)**
  - `main.js` — `AmbientLight` + `PointLight` + `HemisphereLight` + `DirectionalLight`

- [x] **Modelar telefone fixo (à esquerda da mesa)**
  - `sceneObjects.js` — Group de `BoxGeometry`/`CylinderGeometry`, ~150 polígonos
  - **Como implementar:** Criar um grupo com: base retangular (BoxGeo), gancho (CylinderGeo curvo), fone repousando. Posicionar em x≈-0.5, y≈0.73, z≈0.5. Material: `MeshLambertMaterial` cor preta (`#1A1A1A`).

- [x] **Modelar celular sobre a mesa (canto inferior)**
  - `sceneObjects.js` — `BoxGeometry` pequeno + `PlaneGeometry` para tela
  - **Como implementar:** Box simples 0.06×0.01×0.10 com tela emissiva escura. Posicionar em x≈0.4, y≈0.73, z≈0.7. Adicionar animação de vibração (oscilação em `rotation.z`) ativável via flag.

- [x] **Xícara de café com vapor (partículas)**
  - `sceneObjects.js` — `CylinderGeometry` + sistema de partículas simples
  - **Como implementar:** Cilindro low-poly (8 segmentos), cor cerâmica (`#8B7355`). Vapor: 5-8 `PlaneGeometry` pequenos com texture transparente, animados subindo em Y com `Math.sin()` para ondulação. Opacidade diminui com `gameState.cafeTemperatura`.

- [x] **Porta-retrato com foto da esposa**
  - `sceneObjects.js` — `BoxGeometry` + `PlaneGeometry` com textura
  - **Como implementar:** Moldura: Box fino 0.12×0.15×0.02. Foto: Plane com textura sépia carregada via `TextureLoader`. Posicionar à esquerda do monitor.

- [ x ] **Post-its colados na borda do monitor**
  - `sceneObjects.js` — `PlaneGeometry` × 3-4 com texturas geradas
  - **Como implementar:** Planos pequenos (~0.05×0.05) com `CanvasTexture` gerada em runtime. Textos de uma lista aleatória: 'call 14h', 'entregar calc', 'comprar leite'. Rotação leve aleatória em Z para naturalidade.

- [ x ] **Teclado + mouse no primeiro plano**
  - `sceneObjects.js` — geometrias box simples
  - **Como implementar:** Teclado: Box 0.35×0.01×0.12. Mouse: Box arredondado 0.03×0.01×0.05. Ambos em cor escura. Posicionar em z≈0.8 (próximo da câmera). Animação do teclado: key-press sutil quando jogador digita.

### Câmera

- [x] **3 modos de câmera (LIVRE / CADEIRA / MONITOR)**
  - `camera.js` — `setCameraMode()` com teclas C, M, L

- [~] **Modo CADEIRA com parallax por mouse (head-tracking)**
  - `camera.js` — `mousemove` → lerp rotation
  - **Ajuste necessário:** O GDD pede pan horizontal limitado a ~60° total e sem controle vertical livre. Ajustar `maxLookHorizontal` para 0.52 (≈30° cada lado) e reduzir `maxLookVertical` para 0.08 (quase nenhum).

- [~] **Modo MONITOR fixo na tela do CRT**
  - `camera.js` — `position.set(0, 1.17, 1.0)`
  - **Ajuste necessário:** Travar totalmente a rotação (`rotation.set` fixo) e adicionar transição suave (lerp) ao entrar no modo em vez de snap instantâneo.

- [ x ] **Transição suave entre modos (lerp de posição e rotação)**
  - `camera.js` — TWEEN ou lerp manual no `updateCamera()`
  - **Como implementar:** Adicionar variáveis `targetPosition` e `targetRotation`. No `updateCamera()`, fazer `camera.position.lerp(targetPosition, 0.08)`. Ao trocar modo, definir os targets em vez de setar direto. Tempo de transição: ~0.5s.

- [ x ] **Limites do OrbitControls (azimuth, polar, distância)**
  - `main.js` — `min/maxAzimuthAngle`, `maxDistance`
  - **Ajuste necessário:** maxDistance corrigido (3.5→2.5) para não ultrapassar a parede traseira. Considerar também ajustar o target do orbit para não permitir que a câmera vá para regiões sem conteúdo visual.

---

## Milestone 1 — IDE fake + timer (prova de conceito)

**Status: pendente**
A IDE é o coração do jogo. Se "codar sob pressão de timer" não for divertido, repensar o projeto. Esta é a milestone de validação.

### IDE fake

- [ ] **Renderizar UI da IDE na tela do CRT**
  - Novo arquivo: `ide.js`
  - **Como implementar:** Duas abordagens possíveis:
    1. `CSS2DRenderer` do Three.js — renderiza HTML na posição 3D da tela do monitor. Mais imersivo mas mais complexo.
    2. HTML overlay posicionado sobre o canvas — mais simples, controle total de CSS.
  - **Recomendação: overlay HTML.** Criar um `<div id="monitor-screen">` posicionado absolute sobre o canvas, com dimensões proporcionais à tela do CRT. Estilo: fundo preto (`#1A1A1A`), texto verde fósforo (`#4FAE3E`), font Courier New/Consolas.

- [ ] **Editor de texto com syntax highlight básico**
  - `ide.js` — textarea sobreposto a `<pre>` com highlight
  - **Como implementar:** Padrão "transparent textarea over highlighted pre". O `<textarea>` fica transparente, o `<pre>` atrás mostra o texto colorido. Cada vez que o jogador digita, rodar regex simples para colorir keywords JS (`function`, `var`, `const`, `let`, `return`, `if`, `else`). Fonte: Consolas 14px, line-height 1.4.

- [ ] **Parser JS em tempo real com acorn.js**
  - CDN: `https://cdn.jsdelivr.net/npm/acorn`
  - **Como implementar:** A cada 500ms (debounce), rodar `acorn.parse(code, {ecmaVersion: 2020})` em try/catch. Se der erro, mostrar a linha e mensagem no painel inferior da IDE. Se passar, marcar sub-tarefa como "compilável".

- [ ] **Sistema de 6 sub-tarefas sequenciais com validação**
  - `ide.js` — array de objetos `{nome, descricao, testFn, completa}`
  - **Como implementar:** Cada sub-tarefa tem: nome, descrição, uma função de teste (`testFn`) que recebe o código e retorna true/false, e um flag de conclusão. Sub-tarefas:
    1. Estrutura HTML (grid de botões)
    2. Styling CSS (estilização)
    3. Captura de input (event listeners)
    4. Soma/subtração
    5. Multiplicação/divisão
    6. Clear + deploy
  - Validação: executar em iframe sandbox e rodar testes automatizados.

- [ ] **Execução sandboxed em iframe oculto**
  - `ide.js` — iframe `srcdoc` com `postMessage`
  - **Como implementar:** Criar `<iframe sandbox="allow-scripts" style="display:none">`. Injetar o código do jogador via `srcdoc`. Comunicar resultado dos testes via `postMessage`. Timeout de 2s para evitar loops infinitos. Matar e recriar o iframe a cada execução.

- [ ] **Ctrl+Z ilimitado (undo buffer)**
  - `ide.js` — array de snapshots do texto
  - **Como implementar:** Manter um array `undoStack[]`. A cada pausa de digitação (>300ms), empurrar o texto atual. Ctrl+Z faz pop. Limitar a ~200 entradas para memória. Implementar via `keydown` listener (`e.preventDefault()` no Ctrl+Z nativo do browser).

### Timer

- [ ] **Timer de 5 minutos (300s) em tempo real, sem pausa**
  - `gameLogic.js` — `gameState.timer -= deltaTime`
  - **Como implementar:** No `updateGameLogic(deltaTime)`: decrementar `gameState.timer`. Quando chegar a 0, disparar evento `partida-fim`. O timer no HUD mostra horário fictício: mapear 300s→0s para 11:30→12:00 (cada segundo real = 0.1 minuto fictício). Exibir como relógio digital na bandeja XP.

---

## Milestone 2 — Sistemas core (KPIs + interrupções)

**Status: pendente**
Dar vida aos 4 KPIs e implementar a primeira interrupção (telefone). Aqui nasce a sensação de "pratinhos girando".

### KPIs

- [ ] **4 KPIs funcionais com lógica de ganho/perda**
  - `gameLogic.js` — objeto `kpis` com funções de modificação
  - **Como implementar:**
    - `gameState.kpis = {saudeMental: 100, satChefe: 100, satCliente: 100, climaEquipe: 100}`
    - **Regra de ouro: APENAS saudeMental pode subir. Os outros 3 só descem** (clamp com `Math.min`).
    - Criar função `modifyKPI(nome, delta)` que aplica o delta, clampa em [0, 100], e emite evento para atualizar o HUD.
    - Decay passivo: satChefe -0.5/min, satCliente -0.3/min, climaEquipe -0.2/min (ajustável com playtest).

- [ ] **HUD dos 4 relógios analógicos (overlay SVG ou Canvas)**
  - Novo arquivo: `hud.js`
  - **Como implementar:** 4 mini-relógios SVG no canto superior-direito. Cada um: círculo de 40px, ponteiro que vai de 12h (100) a 6h (0). Ângulo = `-90° + (100 - valor) × 1.8°`. Zona vermelha (0-40): ponteiro treme (`Math.random() × 2°` por frame) e círculo pulsa (scale 1.0↔1.05 a 2Hz). Labels: 'MENTAL', 'CHEFE', 'CLIENTE', 'EQUIPE'.

### Interrupções

- [ ] **Sistema de interrupções com fila e scheduler**
  - Novo arquivo: `interrupcoes.js`
  - **Como implementar:** `EventScheduler`: fila de eventos com timestamp de disparo. A cada frame, verificar se algum evento deve disparar (`timestamp <= gameTime`). Tipos: TELEFONE, TEAMS, CELULAR, ALTERACAO. Curva de dificuldade do GDD:
    - 0:00–0:45 → 1 interrupção (chefe, hook)
    - 0:45–2:00 → 1 a cada 30-40s
    - 2:00–3:00 → frequência dobra
    - 3:00–4:00 → caos
    - 4:00–5:00 → inferno
  - Gerar a timeline no início da partida baseado no Fator Sorte.

- [ ] **Telefone fixo com diálogo de múltipla escolha**
  - `interrupcoes.js` + Novo: `dialogos.js`
  - **Como implementar:**
    1. Tocar áudio MIDI (3 intensidades)
    2. Pista sutil: animação de vibração no modelo 3D do telefone, 1-2s antes do toque
    3. Regra de tolerância: 3 toques sem atender OK, depois -8 satChefe por toque ignorado
    4. Atender: overlay de diálogo com 2-4 opções (responder educado, hostil, rápido, ignorar)
    5. Cada opção tem efeitos nos KPIs definidos em JSON
  - Personagens que ligam: chefe (mais frequente), cliente, colegas (trotes).

---

## Milestone 3 — Mundo completo (loop jogável)

**Status: pendente**
Todas as mecânicas implementadas: Teams, celular, café, banheiro, Vampetazo, alterações dinâmicas, Fator Sorte. Loop completo.

### Interrupções restantes

- [ ] **Pop-ups do Teams (overlay estilo XP, acumula até 4)**
  - `interrupcoes.js` + novo: `teams.js`
  - **Como implementar:** Pop-ups no canto inferior-direito do "monitor". Cada pop-up: avatar 2D + nome + ícone urgência (verde/amarelo/vermelho). Acumulam empilhados. Clicar abre janela cheia do Teams. Com playlist ativa: SOM silenciado, apenas piscar visual.

- [ ] **Celular da esposa (vibração + chat)**
  - `interrupcoes.js` + novo: `celular.js`
  - **Como implementar:** Vibração visual no modelo 3D + som no tampo. Clicar inclina câmera para baixo (lerp). Chat com 3 opções: carinhoso / curto / ignorar. 3+ ignoradas = risco de final "Divorciado". Mensagem de apoio (Fator Sorte alto): +6 Mental.

- [ ] **Alterações dinâmicas (2-3 por partida, min 1:30 a 4:30)**
  - `interrupcoes.js` + `ide.js`
  - **Como implementar:** Mensagem do Teams pedindo mudança. Tipos: trocar cor CSS, adicionar botão, alterar lógica JS. Cada alteração força retorno a sub-tarefa já concluída. Custo: 15-45s + 3-6 Mental. Tipo mais grave (min 4+): "cliente pediu em Python" → reseta lógica JS parcialmente.

### Mecânicas de necessidades

- [ ] **Sistema de café (barra crescente, ação de beber, +12 Mental)**
  - `gameLogic.js` + `hud.js`
  - **Como implementar:** `cafeNecessidade` cresce 0.33/s. Botão ícone de xícara no HUD. Ao clicar: animação de beber (4s), +12 Mental. Vapor do modelo 3D proporcional a `cafeTemperatura` (decai ao longo da partida). Café frio = sem benefício (verificar `cafeTemperatura > 30`).

- [ ] **Sistema de banheiro (barra crescente, 15s ausência, risco Vampetazo)**
  - `gameLogic.js` + `hud.js`
  - **Como implementar:** `banheiroNecessidade` cresce 0.2/s. Sinais visuais: piscar mais frequente (shader), cursor treme. Ao clicar botão: fade-out 1s, gameTime avança 15s, fade-in 1s. Se PC não travado (Win+L): verificar probabilidade de Vampetazo. Ignorar muito tempo: "fez xixi" → Equipe -8, Chefe -8.

### Mecânicas especiais

- [ ] **Fator Sorte integrado (senha → ASCII mod 10)**
  - `gameLogic.js` — `calcularFatorSorte(senha)`
  - **Como implementar:** Na tela de login: input de senha. `S = (soma dos charCodes) % 10`. Faixas: 0-2 (Amaldiçoado), 3-6 (Normal), 7-9 (Abençoado). Modificadores definidos em JSON: quedas de energia, bugs na IDE, humor do chefe, etc. NUNCA revelar ao jogador.

- [ ] **Vampetazo (imagem censurada + efeitos)**
  - Novo: `vampetazo.js`
  - **Como implementar:** Probabilidade: `0.30 + (climaRuim × 0.40) - (sorteAlta × 0.15)`. Sempre dispara se saiu da mesa sem Win+L. Ao ativar: tela tomada por tarja "CENSURADO" piscante (amarelo `#C4A747` sobre preto). Áudio: risadas abafadas + erro XP. Fechar manualmente (3-5s). Efeitos: Equipe -25, Mental -10. Mensagem permanente no Teams com emojis.

- [ ] **Win+L para travar tela (anti-Vampetazo)**
  - `camera.js` ou `gameLogic.js`
  - **Como implementar:** Listener `keydown` para `Meta+l` ou `Control+l`. Ativa flag `pcTravado`. Visual: tela do monitor mostra lock screen do XP. Indicador de cadeado na bandeja. Também clicável via ícone no HUD.

- [ ] **Playlist (toggle na bandeja, reduz perda Mental 40%, abafa telefone)**
  - Novo: `playlist.js`
  - **Como implementar:** Ícone de nota musical na bandeja XP. Ao ativar: `playlistAtiva = true`. Efeito: multiplicador 0.6 em todas as perdas de Mental. Custo: volume do telefone × 0.3 (fácil perder toques), som dos pop-ups Teams silenciado. MVP: áudio local (royalty-free). Futuro: YouTube API.

---

## Milestone 4 — Polimento visual e áudio

**Status: pendente**
Shaders PS1, texturas definitivas, UI do Windows XP, vozes TTS, SFX. Identidade visual e sonora completas.

### Shaders PS1

- [ ] **Vertex snapping (tremor de vértices estilo PS1)**
  - Novo: `ps1Shader.js` — custom `ShaderMaterial`
  - **Como implementar:** No vertex shader: quantizar a posição do vértice para uma grade de baixa resolução. Fórmula: `pos = floor(pos * gridSize + 0.5) / gridSize`. gridSize ≈ 64-128. Aplicar em todos os materiais do cenário via `onBeforeCompile` ou `ShaderMaterial` custom. NÃO aplicar nos textos/UI.

- [ ] **Affine texture mapping (distorção de textura PS1)**
  - `ps1Shader.js` — desabilitar correção perspectiva no fragment shader
  - **Como implementar:** No vertex shader: passar UV sem dividir por W (noPerspective interpolation). Em Three.js r160: usar ShaderChunk injection ou ShaderMaterial. Efeito: texturas "escorregam" nos polígonos quando a câmera se move.

### UI Windows XP

- [ ] **Desktop XP completo (taskbar, menu iniciar, bandeja, janelas)**
  - Novo: `xpDesktop.js` + `xp.css`
  - **Como implementar:** Overlay HTML estilizado como Windows XP tardio. Taskbar azul (`#0A246A`→`#A6CAF0` gradient). Menu Iniciar. Bandeja com relógio (11:30→12:00), ícone de rede, nota musical, cadeado. Janelas com barra de título azul, botões ×/–/□. Regra: apenas UMA janela em foco por vez. Minimizar/maximizar com tween CSS.

### Áudio

- [ ] **Ambiente base (hum CRT + ventoinha + AC)**
  - Novo: `audio.js` — Web Audio API
  - **Como implementar:** 3 loops de áudio ambiente com gain nodes independentes. Hum CRT: tom grave 60Hz gerado via `OscillatorNode`. Ventoinha: ruído rosa filtrado. AC: ruído branco muito baixo com filtro passa-baixa. Todos em loop infinito, volume sutil (~0.1 gain).

- [ ] **SFX essenciais (telefone MIDI, pop Teams, teclado, erro XP)**
  - `audio.js` — `AudioBuffer` + pool de sources
  - **Como implementar:** Pré-carregar buffers de áudio. Telefone: 3 variações de intensidade. Teclado: pool de 3-4 sons de click mecânico, escolha aleatória a cada keypress. Pop Teams: ping curto lo-fi. Erro XP: ding clássico. Gole de café: ASMR sutil.

---

## Milestone 5 — Finais e score

**Status: pendente**
5 finais, árvore de decisão, tela de score gameshow anos 80, highscore em localStorage.

### Sistema de finais

- [ ] **Árvore de decisão dos 5 finais (verificação por prioridade)**
  - Novo: `finais.js`
  - **Como implementar:** Ordem de checagem:
    1. **Burnout** → Mental < 10
    2. **Demitido** → satChefe < 20 OU resposta hostil registrada
    3. **Vampetazado** → Clima < 20 + vampetazo ocorreu
    4. **Divorciado** → 3+ msgs esposa ignoradas
    5. **Humilhado** → entrega parcial ou nenhuma
  - Fallback = Humilhado.

- [ ] **Tela de score gameshow anos 80 (roleta, fanfarra, confete)**
  - `finais.js` + `score.css`
  - **Como implementar:**
    - Fórmula: `Pontos = (Qualidade × TempoRestante) - (Estresse × InterrupçõesIgnoradas)`
    - Visual: fundo preto, spotlights dourados, contador mecânico de cassino que rola até o valor final
    - Confete PS1 (partículas low-poly)
    - Áudio: fanfarra "Price is Right" + aplausos enlatados
    - Botões: VER BREAKDOWN, SALVAR HIGHSCORE, JOGAR DE NOVO

- [ ] **Persistência mínima (localStorage: nome + highscore)**
  - `finais.js` — `localStorage.setItem/getItem`
  - **Como implementar:** Salvar APENAS: `{nome: string, highscore: number}`. Nada mais — sem galeria, sem estatísticas. Cada partida é descartável.

---

## Milestone 6 — Boot, preparação e fluxo completo

**Status: pendente**
Tela de login (define Fator Sorte), fase de preparação (LinkedIn, Intranet, Kanban, Psicóloga), e o fluxo completo da partida.

### Fluxo da partida

- [ ] **Tela de boot/login (input de senha, animação XP)**
  - Novo: `boot.js`
  - **Como implementar:** Tela dentro do monitor: campo de senha livre (aceita especiais). Ao confirmar, calcular Fator Sorte silenciosamente. Animação de boot do XP (barra de progresso, logo). ~30s de fase.

- [ ] **Fase de preparação (LinkedIn, Intranet, Kanban, Psicóloga)**
  - Novo: `preparacao.js`
  - **Como implementar:** 4 "sites" navegáveis dentro do monitor:
    - **LinkedIn:** perfil do protagonista, posts de colegas
    - **Intranet:** avisos de RH, psicóloga, aniversariantes
    - **Kanban:** 3 colunas (TODO/DOING/DONE), tarefa "Calculadora JS" atrasada 3 dias
    - **Psicóloga:** dicas de jogo disfarçadas de conselho terapêutico
  - Sem timer — jogador decide quando iniciar o Crunch. Conteúdo diegético = tutorial indireto.

---

## Arquitetura de arquivos proposta

```
projeto-task/
├── index.html              ← Já existe
├── style.css               ← Já existe
├── main.js                 ← Já existe (entry point, render loop)
├── camera.js               ← Já existe (3 modos de câmera)
├── sceneObjects.js         ← Já existe (cenário 3D)
├── gameLogic.js            ← Já existe (esqueleto — expandir com KPIs, timer, estado)
│
├── ide.js                  ← NOVO — editor de código, parser acorn, sub-tarefas
├── hud.js                  ← NOVO — overlay dos 4 relógios KPI + botões café/banheiro
├── interrupcoes.js         ← NOVO — scheduler de eventos, curva de dificuldade
├── dialogos.js             ← NOVO — sistema de diálogo múltipla escolha
├── teams.js                ← NOVO — pop-ups do Teams, janela de chat
├── celular.js              ← NOVO — chat da esposa, vibração
├── vampetazo.js            ← NOVO — tela censurada, probabilidade, efeitos
├── playlist.js             ← NOVO — toggle de música, trade-off de áudio
├── audio.js                ← NOVO — Web Audio API, ambiente, SFX
├── ps1Shader.js            ← NOVO — vertex snapping, affine mapping
├── xpDesktop.js            ← NOVO — UI do Windows XP (taskbar, janelas)
├── boot.js                 ← NOVO — tela de login, Fator Sorte
├── preparacao.js           ← NOVO — LinkedIn, Intranet, Kanban, Psicóloga
├── finais.js               ← NOVO — árvore de decisão, tela de score
│
├── xp.css                  ← NOVO — estilos do Windows XP
├── score.css               ← NOVO — estilos da tela gameshow
│
├── assets/
│   ├── textures/           ← texturas PS1 (256×256 max)
│   ├── audio/              ← SFX e loops de ambiente
│   ├── avatars/            ← fotos corporativas 2D para Teams
│   └── endings/            ← 5 imagens fixas dos finais
│
├── janela1.png             ← Já existe (parallax fundo)
└── janela2.png             ← Já existe (parallax frente)
```

---

## Ordem de execução recomendada

1. **Terminar objetos da mesa** (Milestone 0) — são modelagens simples, ~150-400 polígonos cada. Dá vida ao cenário.
2. **IDE fake + timer** (Milestone 1) — é a validação do conceito. Se codar sob pressão não for divertido, repensar antes de investir mais.
3. **KPIs + telefone** (Milestone 2) — primeira sensação de "pratinhos girando".
4. **Resto das interrupções + mecânicas** (Milestone 3) — loop completo jogável com estética placeholder.
5. **Shaders PS1 + UI XP + áudio** (Milestone 4) — identidade visual e sonora.
6. **Finais + score** (Milestone 5) — experiência completa do começo ao fim.
7. **Boot + preparação** (Milestone 6) — fluxo completo da partida.

> O Milestone 3 é o marco de segurança do GDD: nesse ponto o jogo existe como loop jogável, mesmo que visualmente placeholder. Tudo depois é polimento.
