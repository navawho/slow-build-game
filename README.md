# Slow Build Game 🐍

Extensão VS Code que permite jogar Snake (cobrinha) enquanto aguarda builds lentos!

## Funcionalidades

1. **Detecção automática de builds**: Monitora comandos no terminal e tasks do VS Code
   - Comandos detectados: `make build`, `make build-no-cache`, `npm run build`, `yarn build`, `pnpm build`, `gradle build`, `mvn build`, `cargo build`, `go build`, `cmake`, e mais
2. **Jogo da cobrinha integrado**: Jogue Snake em uma WebView enquanto o build executa
3. **Sistema de pontuação**: Sua pontuação é exibida quando o build termina
4. **Cancelamento de build**: Se você perder no jogo, o build é cancelado automaticamente
5. **Interface visual**: Jogo com cores do tema VS Code

## Como usar

### Método 1: Automático (detecta comandos)
1. Execute um comando de build no terminal (ex: `make build`, `npm run build`)
2. Ou execute uma task de build
3. Se demorar mais de 10 segundos, o jogo abre automaticamente

### Método 2: Manual
1. Abra a paleta de comandos (`Cmd+Shift+P` no Mac)
2. Digite "Start Build Snake Game"
3. Jogue!

## Desenvolvimento

### Instalação das dependências
```bash
npm install
```

### Compilação
```bash
npm run compile
```

### Modo watch
```bash
npm run watch
```

### Testando a extensão
1. Pressione `F5` no VS Code para abrir uma nova janela com a extensão carregada
2. Na nova janela, execute uma task de build ou use o comando manualmente

## Controles do jogo

- ⬅️ Seta Esquerda: Move para esquerda
- ⬆️ Seta Cima: Move para cima
- ➡️ Seta Direita: Move para direita
- ⬇️ Seta Baixo: Move para baixo

## ⚠️ Regras importantes

- **NÃO perca o jogo!** Se você bater na parede ou no próprio corpo, o build será CANCELADO
- **Zere o jogo para ganhar!** Se você conseguir preencher toda a tela (400 pontos), VOCÊ VENCE e o build continua! 🎉
- Quanto mais você jogar, maior sua pontuação
- A pontuação é exibida quando o build termina

## Estrutura do projeto

```
.
├── src/
│   ├── extension.ts    # Ponto de entrada da extensão
│   └── snakeGame.ts    # Lógica do jogo Snake com WebView
├── package.json        # Manifesto da extensão
├── tsconfig.json       # Configuração TypeScript
└── README.md          # Este arquivo
```

## Tecnologias utilizadas

- TypeScript
- VS Code Extension API
- WebView API
- HTML5 Canvas (para o jogo)

## Licença

MIT
