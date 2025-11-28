import * as vscode from 'vscode';
import { SnakeGamePanel } from './snakeGame';

let gamePanel: SnakeGamePanel | undefined;
let buildProcess: vscode.Terminal | undefined;
let buildTimeout: ReturnType<typeof setTimeout> | undefined;
let extensionContext: vscode.ExtensionContext;
let activeTerminals: Map<vscode.Terminal, { hasCommand: boolean; timer?: ReturnType<typeof setTimeout> }> = new Map();

export function activate(context: vscode.ExtensionContext) {
    extensionContext = context;
    console.log('Slow Build Game extension is now active!');

    // Monitora eventos de execução de tarefas
    vscode.tasks.onDidStartTask((event) => {
        const taskName = event.execution.task.name.toLowerCase();
        if (taskName.includes('build') || taskName.includes('make')) {
            handleBuildStart();
        }
    });

    vscode.tasks.onDidEndTask((event) => {
        const taskName = event.execution.task.name.toLowerCase();
        if (taskName.includes('build') || taskName.includes('make')) {
            handleBuildComplete();
        }
    });

    // Monitora comandos executados no terminal
    vscode.window.onDidStartTerminalShellExecution((event) => {
        const command = event.execution.commandLine.value.toLowerCase();
        
        // Detecta comandos de build comuns
        const isBuildCommand = 
            command.includes('make build') ||
            command.includes('make build-no-cache') ||
            command.includes('npm run build') ||
            command.includes('yarn build') ||
            command.includes('pnpm build') ||
            command.includes('gradle build') ||
            command.includes('mvn build') ||
            command.includes('cargo build') ||
            command.includes('go build') ||
            command.match(/\bmake\b/) ||
            command.includes('cmake');

        if (isBuildCommand) {
            buildProcess = event.terminal;
            handleBuildStart(event.terminal);
        }
    });

    // Monitora fim de execução no terminal
    vscode.window.onDidEndTerminalShellExecution((event) => {
        const terminalData = activeTerminals.get(event.terminal);
        if (terminalData) {
            handleBuildComplete();
            activeTerminals.delete(event.terminal);
        }
    });

    // Limpa quando terminal é fechado
    vscode.window.onDidCloseTerminal((terminal) => {
        const terminalData = activeTerminals.get(terminal);
        if (terminalData?.timer) {
            clearTimeout(terminalData.timer);
        }
        activeTerminals.delete(terminal);
        if (terminal === buildProcess) {
            buildProcess = undefined;
        }
    });

    // Comando para iniciar o jogo manualmente (para teste)
    let disposable = vscode.commands.registerCommand('slow-build-game.startGame', () => {
        startGame(context);
    });

    context.subscriptions.push(disposable);
}

function handleBuildStart(terminal?: vscode.Terminal) {
    // Aguarda 2 segundos para ver se o build demora
    const timer = setTimeout(() => {
        vscode.window.showInformationMessage('⏳ Build está demorando... Que tal jogar enquanto espera?');
        startGame(extensionContext);
    }, 10000);
    
    buildTimeout = timer;
    
    if (terminal) {
        activeTerminals.set(terminal, { hasCommand: true, timer });
    }
}

function startGame(context: vscode.ExtensionContext) {
    if (gamePanel) {
        gamePanel.reveal();
    } else {
        gamePanel = new SnakeGamePanel(context, (score: number, won: boolean) => {
            handleGameEnd(score, won);
        });
    }
}

function handleGameEnd(score: number, won: boolean) {
    if (!won) {
        // Jogador perdeu - cancela o build
        vscode.window.showWarningMessage(`💀 Game Over! Score: ${score}. Cancelando build...`);
        if (buildProcess) {
            // Envia Ctrl+C para o terminal
            vscode.commands.executeCommand('workbench.action.terminal.sendSequence', {
                text: '\x03'
            });
        }
    } else {
        // Jogador venceu! 
        vscode.window.showInformationMessage(`🎉 INCRÍVEL! Você zerou o jogo! Score: ${score}. Build continua...`);
    }
    gamePanel = undefined;
}

function handleBuildComplete() {
    if (buildTimeout) {
        clearTimeout(buildTimeout);
    }
    
    if (gamePanel) {
        const score = gamePanel.getScore();
        gamePanel.close();
        gamePanel = undefined;
        vscode.window.showInformationMessage(`✅ Build completo! Sua pontuação: ${score}`);
    }
}

export function deactivate() {
    if (gamePanel) {
        gamePanel.close();
    }
}
