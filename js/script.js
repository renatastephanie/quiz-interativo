// 1. VARIÁVEIS DE ESTADO E ELEMENTOS DO DOM

// Variáveis de Estado
let perguntas = []; // Array que armazenará as perguntas da API
let indicePerguntaAtual = 0;
let pontuacao = 0;
const NUMERO_DE_PERGUNTAS = 10;
const CATEGORIA_POP_CULTURA = 11; // 11 é para Film, 12 é para Music, 14 para Television

// Elementos do DOM
const inicioContainer = document.getElementById('inicio-container');
const quizContainer = document.getElementById('quiz-container');
const resultadoContainer = document.getElementById('resultado-container');

const iniciarQuizBtn = document.getElementById('iniciar-quiz-btn');
const reiniciarBtn = document.getElementById('reiniciar-btn');
const proximoBtn = document.getElementById('proximo-btn');

const perguntaNumero = document.getElementById('pergunta-numero');
const perguntaTexto = document.getElementById('pergunta-texto');
const alternativasContainer = document.getElementById('alternativas-container');
const pontuacaoFinalSpan = document.getElementById('pontuacao-final');
const totalPerguntasSpan = document.getElementById('total-perguntas');

// Define o total de perguntas no resultado
totalPerguntasSpan.textContent = NUMERO_DE_PERGUNTAS;

// 2. FUNÇÕES DE UTILIDADE E API

/**
 * Embaralha um array (usado para embaralhar as alternativas).
 * Implementação do algoritmo de Fisher-Yates.
 * @param {Array} array 
 * @returns {Array} Array embaralhado
 */
function embaralharArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Busca as perguntas na Open Trivia Database.
 * @returns {Promise<Array>} Array de objetos de pergunta
 */
async function buscarPerguntas() {
    // API Open Trivia Database (usando Filmes/Cultura Pop)
    const url = `https://opentdb.com/api.php?amount=${NUMERO_DE_PERGUNTAS}&category=${CATEGORIA_POP_CULTURA}&type=multiple&encode=base64`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.response_code !== 0) {
            console.error("Erro ao buscar perguntas. Response code:", data.response_code);
            // Fallback para perguntas estáticas se a API falhar
            return [{
                "category": "Q29tcHV0ZXIgUHJvZ3JhbW1pbmc=",
                "type": "bXVsdGlwbGU=",
                "difficulty": "bWVkaXVt",
                "question": "V2hhdCBpcyB0aGUgZnVuY3Rpb24gb2YgR2l0S3Jha2VuPw==",
                "correct_answer": "SSBkbyBub3QgS25vdw==",
                "incorrect_answers": ["Q29uc3VmbyBBcGlz", "Q29kZSAgYXJyYW5nZXI=", "VHJhbnNsYXRlIGxhbmd1YWdlcw=="]
            }];
        }

        // A API usa codificação Base64 para garantir que caracteres especiais funcionem.
        // Precisamos decodificar as strings.
        return data.results.map(item => ({
            ...item,
            question: atob(item.question),
            correct_answer: atob(item.correct_answer),
            incorrect_answers: item.incorrect_answers.map(ans => atob(ans))
        }));

    } catch (error) {
        console.error("Falha na requisição da API:", error);
        // Retorna um array vazio ou um fallback em caso de erro de rede
        return [];
    }
}

// 3. FUNÇÕES DE RENDERIZAÇÃO E NAVEGAÇÃO

/**
 * Exibe a pergunta atual e renderiza as alternativas.
 */
function exibirPergunta() {
    proximoBtn.disabled = true;
    alternativasContainer.innerHTML = '';

    if (indicePerguntaAtual >= perguntas.length) {
        mostrarResultado();
        return;
    }

    const pergunta = perguntas[indicePerguntaAtual];

    // Atualiza a contagem e o texto da pergunta
    perguntaNumero.textContent = `Pergunta ${indicePerguntaAtual + 1} de ${perguntas.length}`;
    perguntaTexto.textContent = pergunta.question;

    // Combina respostas corretas e incorretas e embaralha
    const todasAlternativas = [pergunta.correct_answer, ...pergunta.incorrect_answers];
    const alternativasEmbaralhadas = embaralharArray(todasAlternativas);

    // Cria e adiciona os botões de alternativa
    alternativasEmbaralhadas.forEach(alternativa => {
        const button = document.createElement('button');
        button.textContent = alternativa;
        button.classList.add('alternativa');
        button.setAttribute('aria-label', `Alternativa: ${alternativa}`);

        button.addEventListener('click', () => selecionarAlternativa(button, alternativa, pergunta.correct_answer));

        alternativasContainer.appendChild(button);
    });
}

/**
 * Lida com a seleção de uma alternativa pelo usuário.
 * @param {HTMLElement} botaoClicado - O botão da alternativa clicado.
 * @param {string} respostaSelecionada - O texto da resposta selecionada.
 * @param {string} respostaCorreta - O texto da resposta correta.
 */
function selecionarAlternativa(botaoClicado, respostaSelecionada, respostaCorreta) {
    const todosBotoes = alternativasContainer.querySelectorAll('.alternativa');

    // Desabilita todos os botões após a primeira seleção
    todosBotoes.forEach(btn => btn.disabled = true);

    // Verifica a resposta e atualiza a pontuação
    if (respostaSelecionada === respostaCorreta) {
        pontuacao++;
        botaoClicado.classList.add('correta');
    } else {
        botaoClicado.classList.add('errada');
        // Opcional: Destaca a correta
        todosBotoes.forEach(btn => {
            if (btn.textContent === respostaCorreta) {
                btn.classList.add('correta');
            }
        });
    }

    // Habilita o botão de Próxima Pergunta
    proximoBtn.disabled = false;
}

/**
 * Mostra a tela principal do Quiz.
 */
function iniciarQuiz() {
    // Esconde a tela de início/resultado e mostra o quiz
    inicioContainer.style.display = 'none';
    resultadoContainer.style.display = 'none';
    quizContainer.style.display = 'block';

    // Inicializa o estado
    indicePerguntaAtual = 0;
    pontuacao = 0;

    // Exibe a primeira pergunta
    exibirPergunta();
}

/**
 * Mostra a tela de Resultados Finais.
 */
function mostrarResultado() {
    quizContainer.style.display = 'none';
    resultadoContainer.style.display = 'block';

    pontuacaoFinalSpan.textContent = pontuacao;

    // Adicione a lógica de animação aqui (Ex: mudar a cor de fundo, mudar ícone)
    const animacaoElemento = document.getElementById('animacao-resultado');
    if (pontuacao >= (NUMERO_DE_PERGUNTAS / 2)) {
        // Se a pontuação for boa (>= 50%)
        animacaoElemento.innerHTML = '<h2>🏆 Parabéns!</h2>'; // Exemplo simples de animação
        animacaoElemento.style.color = 'var(--cor-acerto)';
    } else {
        // Se a pontuação for baixa
        animacaoElemento.innerHTML = '<h2>😅 Tente outra vez.</h2>'; // Exemplo simples
        animacaoElemento.style.color = 'var(--cor-erro)';
    }
}

// 4. EVENT LISTENERS E INICIALIZAÇÃO

// Listener para avançar para a próxima pergunta
proximoBtn.addEventListener('click', () => {
    indicePerguntaAtual++;
    exibirPergunta();
});

// Listener para iniciar o quiz (na tela de início)
iniciarQuizBtn.addEventListener('click', () => {
    // O quiz só inicia após as perguntas serem carregadas
    if (perguntas.length > 0) {
        iniciarQuiz();
    } else {
        alert("Carregando perguntas, por favor aguarde um momento...");
    }
});

// Listener para reiniciar o quiz (na tela de resultado)
reiniciarBtn.addEventListener('click', () => {
    // Volta para a tela de início para recarregar
    resultadoContainer.style.display = 'none';
    inicioContainer.style.display = 'block';
    // Reinicia as variáveis de estado
    indicePerguntaAtual = 0;
    pontuacao = 0;
});

// Inicialização: Carrega as perguntas assim que o script é carregado
(async function carregar() {
    // Notifica o usuário que está buscando
    iniciarQuizBtn.textContent = 'Carregando Perguntas...';
    iniciarQuizBtn.disabled = true;

    perguntas = await buscarPerguntas();

    // Se as perguntas foram carregadas com sucesso
    if (perguntas.length > 0) {
        iniciarQuizBtn.textContent = 'Iniciar Quiz';
        iniciarQuizBtn.disabled = false;
        console.log("Perguntas carregadas com sucesso!");
    } else {
        iniciarQuizBtn.textContent = 'Erro ao Carregar';
        console.error("Não foi possível carregar as perguntas da API.");
    }
})();