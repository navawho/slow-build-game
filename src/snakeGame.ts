import * as vscode from 'vscode';

export class SnakeGamePanel {
    private panel: vscode.WebviewPanel;
    private score: number = 0;
    private onGameEndCallback: (score: number, won: boolean) => void;

    constructor(
        context: vscode.ExtensionContext,
        onGameEnd: (score: number, won: boolean) => void
    ) {
        this.onGameEndCallback = onGameEnd;

        this.panel = vscode.window.createWebviewPanel(
            'snakeGame',
            '🐍 Snake Game - Build em progresso...',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.webview.html = this.getWebviewContent();

        // Recebe mensagens do webview
        this.panel.webview.onDidReceiveMessage(
            (message) => {
                switch (message.command) {
                    case 'updateScore':
                        this.score = message.score;
                        break;
                    case 'gameOver':
                        this.onGameEndCallback(message.score, false);
                        break;
                    case 'gameWin':
                        this.onGameEndCallback(message.score, true);
                        break;
                }
            },
            undefined,
            context.subscriptions
        );

        this.panel.onDidDispose(() => {
            this.panel.dispose();
        });
    }

    public reveal() {
        this.panel.reveal();
    }

    public close() {
        this.panel.dispose();
    }

    public getScore(): number {
        return this.score;
    }

    private getWebviewContent(): string {
        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Snake Game</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background-color: #1e1e1e;
            color: #d4d4d4;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        h1 {
            margin-bottom: 10px;
        }
        #score {
            font-size: 24px;
            margin-bottom: 20px;
            color: #4ec9b0;
        }
        canvas {
            border: 2px solid #569cd6;
            background-color: #252526;
            box-shadow: 0 0 20px rgba(86, 156, 214, 0.3);
        }
        #instructions {
            margin-top: 20px;
            text-align: center;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <h1>🐍 Jogo da Cobrinha</h1>
    <div id="score">Score: 0</div>
    <canvas id="gameCanvas" width="400" height="400"></canvas>
    <div id="instructions">
        Use as setas ←↑→↓ para mover<br>
        <strong>⚠️ Se você perder, o build será cancelado!</strong>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const scoreElement = document.getElementById('score');

        const gridSize = 20;
        const tileCount = canvas.width / gridSize;

        let snake = [{ x: 10, y: 10 }];
        let food = { x: 15, y: 15 };
        let dx = 0;
        let dy = 0;
        let score = 0;
        let gameRunning = true;
        let directionQueue = []; // Fila de direções (permite múltiplos comandos)

        document.addEventListener('keydown', changeDirection);

        function changeDirection(event) {
            const key = event.key;
            
            // Pega a última direção da fila, ou a direção atual se fila vazia
            const lastInQueue = directionQueue.length > 0 
                ? directionQueue[directionQueue.length - 1]
                : { dx, dy };
            
            let newDirection = null;
            
            // Previne virar 180° comparando com a última direção conhecida
            if (key === 'ArrowLeft' && lastInQueue.dx !== 1) {
                newDirection = { dx: -1, dy: 0 };
            } else if (key === 'ArrowUp' && lastInQueue.dy !== 1) {
                newDirection = { dx: 0, dy: -1 };
            } else if (key === 'ArrowRight' && lastInQueue.dx !== -1) {
                newDirection = { dx: 1, dy: 0 };
            } else if (key === 'ArrowDown' && lastInQueue.dy !== -1) {
                newDirection = { dx: 0, dy: 1 };
            }
            
            // Adiciona à fila se for uma direção válida e diferente da última
            if (newDirection && 
                (newDirection.dx !== lastInQueue.dx || newDirection.dy !== lastInQueue.dy)) {
                // Limita a fila a 2 comandos para evitar acúmulo
                if (directionQueue.length < 2) {
                    directionQueue.push(newDirection);
                }
            }
        }

        function gameLoop() {
            if (!gameRunning) return;

            // Processa próxima direção da fila
            if (directionQueue.length > 0) {
                const nextDir = directionQueue.shift();
                dx = nextDir.dx;
                dy = nextDir.dy;
            }

            // Só move se já tiver uma direção definida
            if (dx === 0 && dy === 0) {
                draw();
                setTimeout(gameLoop, 100);
                return;
            }

            // Move a cobra
            const head = { x: snake[0].x + dx, y: snake[0].y + dy };

            // Verifica colisão com as paredes
            if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
                gameOver();
                return;
            }

            // Verifica colisão com o próprio corpo
            for (let segment of snake) {
                if (head.x === segment.x && head.y === segment.y) {
                    gameOver();
                    return;
                }
            }

            snake.unshift(head);

            // Verifica se comeu a comida
            if (head.x === food.x && head.y === food.y) {
                score++;
                scoreElement.textContent = 'Score: ' + score;
                vscode.postMessage({ command: 'updateScore', score: score });
                
                // Verifica vitória: cobriu toda a tela
                const maxScore = tileCount * tileCount;
                if (snake.length >= maxScore) {
                    gameWin();
                    return;
                }
                
                placeFood();
            } else {
                snake.pop();
            }

            draw();
            setTimeout(gameLoop, 100);
        }

        function placeFood() {
            food = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };

            // Garante que a comida não apareça em cima da cobra
            for (let segment of snake) {
                if (food.x === segment.x && food.y === segment.y) {
                    placeFood();
                    return;
                }
            }
        }

        function draw() {
            // Limpa o canvas
            ctx.fillStyle = '#252526';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Desenha a cobra
            ctx.fillStyle = '#4ec9b0';
            for (let i = 0; i < snake.length; i++) {
                const segment = snake[i];
                ctx.fillRect(
                    segment.x * gridSize,
                    segment.y * gridSize,
                    gridSize - 2,
                    gridSize - 2
                );
                
                // Cabeça é um pouco diferente
                if (i === 0) {
                    ctx.fillStyle = '#569cd6';
                    ctx.fillRect(
                        segment.x * gridSize,
                        segment.y * gridSize,
                        gridSize - 2,
                        gridSize - 2
                    );
                    ctx.fillStyle = '#4ec9b0';
                }
            }

            // Desenha a comida
            ctx.fillStyle = '#ce9178';
            ctx.beginPath();
            ctx.arc(
                food.x * gridSize + gridSize / 2,
                food.y * gridSize + gridSize / 2,
                gridSize / 2 - 2,
                0,
                2 * Math.PI
            );
            ctx.fill();
        }

        function gameOver() {
            gameRunning = false;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#f48771';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2 - 20);
            ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
            
            vscode.postMessage({ command: 'gameOver', score: score });
        }

        function gameWin() {
            gameRunning = false;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#4ec9b0';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🎉 VOCÊ VENCEU! 🎉', canvas.width / 2, canvas.height / 2 - 40);
            ctx.fillText('Pontuação Máxima!', canvas.width / 2, canvas.height / 2);
            ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 40);
            
            vscode.postMessage({ command: 'gameWin', score: score });
        }

        // Inicia o jogo
        draw();
        gameLoop();
    </script>
</body>
</html>`;
    }
}
