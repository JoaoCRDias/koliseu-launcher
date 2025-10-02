# KoliseuOT Launcher

Launcher oficial do KoliseuOT com auto-update para o launcher e cliente.

## 🚀 Tecnologias

- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **Backend:** Rust (Tauri)
- **Build:** Vite
- **Instalador:** NSIS / MSI (Windows)

## ✨ Funcionalidades

- ✅ **Auto-update do Launcher** - Atualização automática do próprio launcher
- ✅ **Auto-update do Cliente** - Download e instalação automática de novas versões do cliente Tibia
- ✅ **Verificação de Versão** - Checagem automática de atualizações ao iniciar
- ✅ **Configuração de Servidor** - Permite alterar servidor e porta
- ✅ **Interface Moderna** - UI bonita e responsiva com Tailwind CSS
- ✅ **Leve e Rápido** - ~3-5 MB graças ao Tauri (vs 120+ MB do Electron)
- ✅ **Seguro** - Backend em Rust com validações

## 📋 Pré-requisitos

### Para Desenvolvimento

- **Node.js 18+** e npm/pnpm
- **Rust** (https://rustup.rs/)
- **Windows Build Tools** (para build no Windows)

```bash
# Instalar Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Verificar instalação
rustc --version
cargo --version
node --version
npm --version
```

## 🛠️ Desenvolvimento

### 1. Instalar Dependências

```bash
cd koliseu-launcher
npm install
```

### 2. Executar em Modo Desenvolvimento

```bash
npm run tauri:dev
```

Isso irá:
- Iniciar o servidor Vite (frontend)
- Compilar o Rust (backend)
- Abrir o launcher em modo desenvolvimento

### 3. Build de Produção

```bash
npm run tauri:build
```

O instalador será gerado em `src-tauri/target/release/bundle/`:
- **NSIS:** `koliseu-launcher_1.0.0_x64-setup.exe`
- **MSI:** `koliseu-launcher_1.0.0_x64_en-US.msi`

## 🔐 Configurar Auto-Update do Launcher

### 1. Gerar Chave de Assinatura

```bash
# Instalar Tauri CLI globalmente (se ainda não tiver)
npm install -g @tauri-apps/cli

# Gerar par de chaves
tauri signer generate -w ~/.tauri/koliseu-launcher.key
```

Isso criará:
- **Chave Privada:** `~/.tauri/koliseu-launcher.key` (NUNCA compartilhar!)
- **Chave Pública:** Será exibida no terminal

### 2. Atualizar tauri.conf.json

Copie a chave pública e cole em `src-tauri/tauri.conf.json`:

```json
{
  "tauri": {
    "updater": {
      "pubkey": "SUA_CHAVE_PUBLICA_AQUI"
    }
  }
}
```

### 3. Criar Endpoint de Updates no Servidor

No seu servidor Next.js, crie:

**File:** `/home/joao/koliseu-aac/src/pages/api/launcher/updates/[target]/[version].ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { target, version } = req.query;

  // Exemplo de resposta para Windows x64
  // Adapte conforme sua lógica de versionamento
  const latestVersion = '1.0.1';
  const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/downloads/launcher/koliseu-launcher_${latestVersion}_x64-setup.nsis.zip`;

  if (version === latestVersion) {
    return res.status(204).end(); // No update available
  }

  return res.status(200).json({
    version: latestVersion,
    pub_date: new Date().toISOString(),
    url: downloadUrl,
    signature: 'SIGNATURE_GENERATED_BY_TAURI_SIGNER',
    notes: 'Bug fixes and improvements'
  });
}
```

### 4. Assinar Build de Release

Após fazer build, assine o instalador:

```bash
tauri signer sign \
  -k ~/.tauri/koliseu-launcher.key \
  -p "YOUR_PASSWORD" \
  src-tauri/target/release/bundle/nsis/koliseu-launcher_1.0.0_x64-setup.nsis.zip
```

Isso gerará um arquivo `.sig` que você deve hospedar junto com o instalador.

## 📦 Estrutura do Projeto

```
koliseu-launcher/
├── src/                      # Frontend React
│   ├── components/
│   │   ├── Launcher.tsx      # Componente principal
│   │   └── UpdateModal.tsx   # Modal de atualização
│   ├── App.tsx               # App principal
│   ├── main.tsx              # Entry point
│   └── styles.css            # Estilos globais
│
├── src-tauri/                # Backend Rust
│   ├── src/
│   │   └── main.rs           # Lógica principal (updates, launch)
│   ├── icons/                # Ícones do app
│   ├── Cargo.toml            # Dependências Rust
│   └── tauri.conf.json       # Configuração Tauri
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🎨 Customização

### Alterar Cores

Edite `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      primary: '#1a1a2e',    // Cor de fundo principal
      secondary: '#16213e',   // Cor de fundo secundária
      accent: '#0f3460',      // Cor de destaque
      highlight: '#e94560',   // Cor do botão Play
    },
  },
}
```

### Alterar Ícones

Substitua os arquivos em `src-tauri/icons/`:
- `icon.ico` - Ícone do Windows
- `icon.png` - Ícone base
- `32x32.png`, `128x128.png` - Tamanhos variados

### Alterar Servidor Padrão

Edite `src/components/Launcher.tsx`:

```tsx
const [serverUrl, setServerUrl] = useState("seu-servidor.com");
const [serverPort, setServerPort] = useState("7172");
```

## 📡 API Backend (Next.js)

### Endpoint: Versão do Cliente

**GET** `/api/client/version`

Retorna:
```json
{
  "version": "1.0.0",
  "download_url": "https://game.koliseuot.com.br/downloads/koliseu-client-1.0.0.zip",
  "changelog": [
    "Initial release",
    "Custom login screen"
  ]
}
```

### Endpoint: Updates do Launcher

**GET** `/api/launcher/updates/{target}/{current_version}`

Exemplo: `/api/launcher/updates/windows-x86_64/1.0.0`

Retorna (se houver update):
```json
{
  "version": "1.0.1",
  "pub_date": "2025-10-02T12:00:00Z",
  "url": "https://game.koliseuot.com.br/downloads/launcher/koliseu-launcher_1.0.1_x64-setup.nsis.zip",
  "signature": "BASE64_SIGNATURE",
  "notes": "Bug fixes and improvements"
}
```

Se não houver update: `HTTP 204 No Content`

## 🚢 Deploy

### 1. Build do Launcher

```bash
npm run tauri:build
```

### 2. Assinar o Instalador

```bash
tauri signer sign \
  -k ~/.tauri/koliseu-launcher.key \
  -p "PASSWORD" \
  src-tauri/target/release/bundle/nsis/koliseu-launcher_1.0.0_x64-setup.nsis.zip
```

### 3. Upload para Servidor

Faça upload dos arquivos para seu servidor:

```bash
# Instalador + Assinatura
scp src-tauri/target/release/bundle/nsis/koliseu-launcher_1.0.0_x64-setup.nsis.zip \
    src-tauri/target/release/bundle/nsis/koliseu-launcher_1.0.0_x64-setup.nsis.zip.sig \
    user@seu-servidor:/var/www/nextapp/public/downloads/launcher/
```

### 4. Atualizar Cliente Tibia

Coloque o cliente Tibia zipado no servidor:

```bash
# Exemplo: client com custom login screen
scp koliseu-client-1.0.0.zip \
    user@seu-servidor:/var/www/nextapp/public/downloads/
```

## 🔧 Troubleshooting

### Erro: "Client executable not found"

- Certifique-se de que o cliente foi baixado corretamente
- Verifique se existe `Tibia.exe` na pasta do cliente
- Rode "Check for Updates" novamente

### Erro: "Failed to fetch version info"

- Verifique se o servidor está online
- Verifique se o endpoint `/api/client/version` está respondendo
- Verifique CORS se estiver testando localmente

### Build falha no Windows

- Instale Windows Build Tools:
  ```bash
  npm install -g windows-build-tools
  ```
- Instale Visual Studio Build Tools
- Reinicie o terminal após instalar Rust

## 📝 TODO

- [ ] Adicionar barra de progresso de download
- [ ] Adicionar changelog visual
- [ ] Suportar múltiplos servidores
- [ ] Adicionar sistema de notícias
- [ ] Implementar crash reporting
- [ ] Adicionar suporte a Linux/Mac

## 📄 Licença

© 2025 KoliseuOT - Todos os direitos reservados

## 🤝 Contribuindo

Pull requests são bem-vindos! Para mudanças maiores, abra uma issue primeiro.

---

**Desenvolvido com ❤️ pela equipe KoliseuOT**
