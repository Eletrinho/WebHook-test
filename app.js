// Import Express.js
const express = require("express");
require("dotenv").config();

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Set port and verify_token
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;
const HEADER = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.TOKEN_FODA}`,
};
const URL = `https://graph.facebook.com/v22.0/${process.env.NUMBER}/messages`;

async function sendMessage(to, text) {
  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: HEADER,
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: { body: text },
      }),
    });
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

// older menu used for searching by ligação -- kept for future use
async function sendSearchMenu(to) {
  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: HEADER,
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "interactive",
        interactive: {
          type: "list",
          header: { type: "text", text: "Escolha como pesquisar sua Ligação" },
          body: {
            text: "Clique em uma das opções abaixo para selecionar como deseja pesquisar a sua ligação",
          },
          action: {
            button: "Pesquisar por:",
            sections: [
              {
                title: "Opções de Pesquisa",
                rows: [
                  { id: "ligacao", title: "Código de Ligação" },
                  { id: "address", title: "Endereço Completo" },
                  { id: "fullName", title: "Nome Completo" },
                  { id: "cpf", title: "CPF" },
                ],
              },
            ],
          },
        },
      }),
    });
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

// new main menu that appears at the start of a conversation
async function sendMainMenu(to) {
  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: HEADER,
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "interactive",
        interactive: {
          type: "list",
          header: { type: "text", text: "Como posso ajudar você hoje?" },
          body: {
            text: "Selecione uma das opções abaixo para que possamos continuar:",
          },
          action: {
            button: "Escolher:",
            sections: [
              {
                title: "Atendimento",
                rows: [
                  { id: "segundaVia", title: "Segunda via de conta" },
                  { id: "info", title: "Pedir informação" },
                  { id: "servico", title: "Solicitar serviço" },
                  { id: "atendente", title: "Falar com atendente" },
                ],
              },
            ],
          },
        },
      }),
    });
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

async function sendFAQ(to) {
  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: HEADER,
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "interactive",
        interactive: {
          type: "list",
          header: { type: "text", text: "O que gostaria de saber?" },
          body: {
            text: "Selecione uma das opções abaixo para que possamos continuar:",
          },
          action: {
            button: "Escolher:",
            sections: [
              {
                title: "Informações",
                rows: [
                  { id: "ligacaoNova", title: "Ligação nova", description: "Como faço para solicitar uma nova ligação?"},
                  { id: "reeligacao", title: "Água cortada", description: "Como faço para religar a água que foi cortada por falta de pagamento?"},
                  { id: "desligaReligaPedido", title: "Desliga/Religa a pedido", description: "Como faço para fazer uma Desligação ou Religação a pedido?" },
                  { id: "outros", title: "Outra informação", description: "Falar com atendente" },
                ],
              },
            ],
          },
        },
      }),
    });
    console.log(await response.json());
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

async function getInfo(id) {
  try {
    const response = await fetch(
      `https://contasteste-latest.onrender.com/ligacao/${id}`,
    );
    const data = await response.json();
    console.log("Info received:", data);
    return data;
  } catch (error) {
    console.error("Error fetching info:", error);
  }
}

async function getInfoByCpf(cpf) {
  try {
    const response = await fetch(
      `https://contasteste-latest.onrender.com/ligacao/by-cpf/${cpf}`,
    );
    const data = await response.json();
    console.log("Info received by CPF:", data);
    return data;
  } catch (error) {
    console.error("Error fetching info by CPF:", error);
  }
}

async function getInfoByName(name) {
  try {
    const response = await fetch(
      `https://contasteste-latest.onrender.com/ligacao/by-name/${encodeURIComponent(name)}`,
    );
    const data = await response.json();
    console.log("Info received by name:", data);
    return data;
  } catch (error) {
    console.error("Error fetching info by name:", error);
  }
}

async function getInfoByAddress(address) {
  try {
    const response = await fetch(
      `https://contasteste-latest.onrender.com/ligacao/by-address/${encodeURIComponent(address)}`,
    );
    const data = await response.json();
    console.log("Info received by address:", data);
    return data;
  } catch (error) {
    console.error("Error fetching info by address:", error);
  }
}

function formatData(data) {
  if (!data) return "Dados não encontrados.";
  let text = `Ligação: ${data.ligacao}\n`;
  text += `Endereço: ${data.address.fullAddress}\n\n`;
  text += `Usuário: ${data.user.fullName} \n`;
  text += `Proprietário: ${data.owner.fullName}\n\n`;
  text += `Dívidas:\n`;
  data.debts.forEach(debt => {
    text += ` Vencimento: ${debt.vencimento} ${debt.debtStatus == 1 ? "🟡": debt.debtStatus == 2 ? "✅": "🔴" } Valor: R$ ${debt.value} - Faturada: ${debt.faturada} - \n`;
  });
  return text;
}

// Estado dos usuários
const userStates = {};
// Route for GET requests
app.get("/", (req, res) => {
  const {
    "hub.mode": mode,
    "hub.challenge": challenge,
    "hub.verify_token": token,
  } = req.query;
  if (mode === "subscribe" && token === verifyToken) {
    console.log("WEBHOOK VERIFIED");
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

// Route for POST requests
app.post("/", (req, res) => {
  const body = req.body;
  if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
    const message = body.entry[0].changes[0].value.messages[0];
    const from = message.from;
    const to = from.slice(0,4) + "9" + from.slice(4);
    if (message.type === 'text') {
      console.log("Received text message:", message.text.body);
      console.log("Current user states:", userStates);
      const text = message.text.body;

      // handler functions keyed by user state
      const textHandlers = {
        waiting_for_initial_choice: () => {
          const txt = text.trim().toLowerCase();
          if (txt.includes('info') || txt.includes('informação')) {
            sendFAQ(to);
            userStates[from] = { state: 'waiting_for_faq_choice' };
          } else {
            sendMessage(to, "Por favor, selecione uma opção através dos botões exibidos anteriormente.");
          }
        },
        waiting_for_codigo_segunda_via: () => {
          sendMessage(to, `Segunda via solicitada para o código: ${text}. Um atendente irá encaminhar.`);
          delete userStates[from];
        },
        waiting_for_info: () => {
          // fallback if we somehow get here
          sendFAQ(to);
          userStates[from] = { state: 'waiting_for_faq_choice' };
        },
        waiting_for_faq_choice: () => {
          sendMessage(to, "Por favor, escolha uma das opções da lista para obter a informação.");
        },
        waiting_for_service_type: () => {
          userStates[from] = { state: 'waiting_for_service_address', serviceType: text };
          sendMessage(to, 'Por favor, informe o endereço para o serviço:');
        },
        waiting_for_service_address: () => {
          const serviceType = userStates[from].serviceType;
          sendMessage(to, `Solicitação de serviço recebida:\nTipo: ${serviceType}\nEndereço: ${text}.\nUm atendente fará o cadastro no sistema.`);
          delete userStates[from];
        },
        waiting_for_ligacao: () => {
          getInfo(text).then(data => {
            const formatted = formatData(data);
            sendMessage(to, formatted);
            delete userStates[from];
          });
        },
        waiting_for_cpf: () => {
          getInfoByCpf(text).then(data => {
            const formatted = formatData(data);
            sendMessage(to, formatted);
            delete userStates[from];
          });
        },
        waiting_for_name: () => {
          getInfoByName(text).then(data => {
            const formatted = formatData(data);
            sendMessage(to, formatted);
            delete userStates[from];
          });
        },
        waiting_for_address: () => {
          getInfoByAddress(text).then(data => {
            const formatted = formatData(data);
            sendMessage(to, formatted);
            delete userStates[from];
          });
        },
      };

      if (!userStates[from]) {
        // Primeiro contato, enviar menu principal
        sendMessage(to, "Olá! Bem-vindo ao nosso serviço.");
        sendMainMenu(to);
        userStates[from] = { state: 'waiting_for_initial_choice' };
      } else {
        const handler = textHandlers[userStates[from].state];
        if (handler) {
          handler();
        } else {
          // unknown state, reset
          console.warn('Unrecognized text state', userStates[from].state);
          delete userStates[from];
        }
      }
    } else if (message.type === 'interactive') {
      const interactive = message.interactive;
      if (interactive.type === 'list_reply') {
        const id = interactive.list_reply.id;
        const state = userStates[from] && userStates[from].state;

        const interactiveHandlers = {
          waiting_for_initial_choice: {
            segundaVia: () => {
              sendMessage(to, 'Para segunda via vamos verificar sua ligação.');
              sendSearchMenu(to);
              userStates[from] = { state: 'waiting_for_choice' };
            },
            info: () => {
              sendFAQ(to);
              console.log("Sent FAQ menu");
              userStates[from] = { state: 'waiting_for_faq_choice' };
            },
            servico: () => {
              sendMessage(to, 'Qual tipo de serviço você deseja solicitar?');
              userStates[from] = { state: 'waiting_for_service_type' };
            },
            atendente: () => {
              sendMessage(to, 'Entendido. Um atendente entrará em contato em breve.');
              delete userStates[from];
            },
          },
          waiting_for_faq_choice: {
            ligacaoNova: () => {
              sendMessage(to, 'Para solicitar nova ligação você deve vir presencialmente com a seguinte documentação');
              delete userStates[from];
            },
            reeligacao: () => {
              sendMessage(to, 'A religação por falta de pagamento requer a quitação da dívida e da taxa de religação. Nos envie foto do seu documento para que um atendente gere a taxa.');
              delete userStates[from];
            },
            desligaReligaPedido: () => {
              sendMessage(to, 'Para fazer o desligamento ou religação a pedido, o **proprietário** do imóvel precisa nos trazer a seguinte documentação:');
              delete userStates[from];
            },
            outros: () => {
              sendMessage(to, 'Um atendente irá assumir seu caso em seguida.');
              delete userStates[from];
            },
            default: () => {
              sendMessage(to, 'Opção desconhecida. Por favor tente novamente.');
              sendFAQ(to);
              userStates[from] = { state: 'waiting_for_faq_choice' };
            },
          },
        };

        if (state && interactiveHandlers[state]) {
          const handler = interactiveHandlers[state][id] || interactiveHandlers[state].default;
          handler && handler();
        } else {
          // fallback to the old search menu behavior
          if (id === 'ligacao') {
            sendMessage(to, 'Digite o código da ligação:');
            userStates[from] = { state: 'waiting_for_ligacao' };
          } else if (id === 'cpf') {
            sendMessage(to, 'Digite o CPF:');
            userStates[from] = { state: 'waiting_for_cpf' };
          } else if (id === 'fullName') {
            sendMessage(to, 'Digite o nome completo:');
            userStates[from] = { state: 'waiting_for_name' };
          } else if (id === 'address') {
            sendMessage(to, 'Digite o endereço completo:');
            userStates[from] = { state: 'waiting_for_address' };
          }
        }
      }
    }
  }
  res.status(200).end();
});

// Start the server
app.listen(port, () => {
  console.log(`\nListening on port ${port}\n`);
});
