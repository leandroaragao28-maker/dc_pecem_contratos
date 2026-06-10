// Camada de acesso à API (Apps Script)

const TOKEN_KEY = "dc_pecem_token";

function getToken()        { return localStorage.getItem(TOKEN_KEY) || ""; }
function setToken(t)       { localStorage.setItem(TOKEN_KEY, t); }
function clearToken()      { localStorage.removeItem(TOKEN_KEY); }
function estaAutenticado() { return !!getToken(); }

async function api(acao, params = {}, corpo = null) {
  const url = new URL(CONFIG.API_URL);
  url.searchParams.set("token", getToken());
  url.searchParams.set("acao", acao);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  if (corpo) url.searchParams.set("corpo", JSON.stringify(corpo));

  const res  = await fetch(url.toString());
  const data = await res.json();

  if (data.erro === "Token inválido") {
    clearToken();
    location.href = "login.html";
    return null;
  }

  if (!data.ok) throw new Error(data.erro || "Erro desconhecido na API");
  return data;
}

// Atalhos por entidade
const API = {
  dashboard:      ()         => api("getDashboard"),
  pedidos:        ()         => api("getPedidos"),
  pedido:         (id)       => api("getPedido", { id }),
  salvarPedido:   (d)        => api("savePedido", {}, d),
  excluirPedido:  (id)       => api("deletePedido", { id }),

  itens:          (pedido_id) => api("getItens", { pedido_id }),
  salvarItem:     (d)         => api("saveItem", {}, d),
  excluirItem:    (id)        => api("deleteItem", { id }),

  medicoes:       (pedido_id) => api("getMedicoes", { pedido_id }),
  medicao:        (id)        => api("getMedicao", { id }),
  salvarMedicao:  (d)         => api("saveMedicao", {}, d),

  medicaoItens:       (medicao_id) => api("getMedicaoItens", { medicao_id }),
  salvarMedicaoItens: (d)          => api("saveMedicaoItens", {}, d),

  faturamento:       (pedido_id) => api("getFaturamento", { pedido_id }),
  salvarFaturamento: (d)         => api("saveFaturamento", {}, d),
  excluirFaturamento:(id)        => api("deleteFaturamento", { id }),

  importarPedidos:      (dados) => api("importarPedidos",      {}, { dados }),
  importarItens:        (dados) => api("importarItens",        {}, { dados }),
  importarMedicoes:     (dados) => api("importarMedicoes",     {}, { dados }),
  importarMedicaoItens: (dados) => api("importarMedicaoItens", {}, { dados }),
};
