# KoliseuOT Launcher

> 🎮 Launcher oficial do KoliseuOT - Construído com Electron + React + TypeScript

[![Electron](https://img.shields.io/badge/Electron-28-blue?logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)

---

## 📋 Sobre

Launcher moderno para o jogo KoliseuOT com sistema de auto-atualização, verificação de integridade de arquivos e interface medieval customizada.

### ✨ Funcionalidades

- ✅ **Auto-atualização** - Verifica e baixa atualizações automaticamente
- ✅ **Verificação de integridade** - Valida checksums SHA256 de todos os arquivos
- ✅ **Reparo automático** - Re-download seletivo de arquivos corrompidos
- ✅ **Download com progresso** - Barra de progresso em tempo real
- ✅ **Gerenciamento de processos** - Lançar e fechar o cliente do jogo
- ✅ **Links sociais** - Botões para Discord e WhatsApp
- ✅ **Interface medieval** - Design customizado com tema dourado

---

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+ (recomendado v20)
- npm 9+

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/koliseu-launcher.git
cd koliseu-launcher

# Instale as dependências
npm install
```

### Desenvolvimento

```bash
# Executar em modo desenvolvimento (hot reload)
npm run dev
```

Isso irá:
1. Iniciar o servidor Vite em `http://localhost:5173`
2. Compilar o código TypeScript do Electron
3. Abrir a janela do Electron

### Build de Produção

```bash
# Build completo (frontend + electron)
npm run build

# Criar instalador executável
npm run electron:build
```

O instalador será gerado em:
- Windows: `out/KoliseuOT Launcher Setup.exe`
- macOS: `out/KoliseuOT Launcher.dmg`
- Linux: `out/KoliseuOT Launcher.AppImage`

---

## 📁 Estrutura do Projeto

```
koliseu-launcher/
├── electron/                    # Backend Electron (TypeScript)
│   ├── main.ts                 # Main process
│   ├── preload.ts              # Preload script (IPC bridge)
│   ├── types.ts                # Tipos compartilhados
│   └── services/
│       ├── updater.ts          # Verificação de atualizações
│       ├── downloader.ts       # Download e extração
│       ├── integrity.ts        # Verificação SHA256
│       └── process-manager.ts  # Gerenciamento de processos
├── src/                        # Frontend React (TypeScript)
│   ├── App.tsx                 # App principal
│   ├── components/
│   │   └── Launcher.tsx        # Componente principal
│   └── assets/
│       └── background.png      # Background medieval
├── dist/                       # Build do frontend (Vite)
├── dist-electron/              # Build do Electron (TS compilado)
├── out/                        # Executáveis finais
├── package.json
├── tsconfig.json               # TS config frontend
├── tsconfig.electron.json      # TS config Electron
├── vite.config.ts              # Vite config
└── electron-builder.json       # Electron Builder config
```

---

## 🛠️ Stack Tecnológica

### Frontend
- **React 18** - UI framework
- **TypeScript 5** - Type safety
- **Vite 5** - Build tool & dev server
- **Tailwind CSS 3** - Styling

### Backend (Electron)
- **Electron 28** - Desktop framework
- **TypeScript 5** - Type safety
- **axios** - HTTP requests
- **extract-zip** - ZIP extraction
- **fs-extra** - File system utilities
- **tree-kill** - Process management

### Build & Dev
- **electron-builder** - Create installers
- **concurrently** - Run multiple commands
- **wait-on** - Wait for dev server

---

## 📜 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Desenvolvimento com hot reload |
| `npm run dev:vite` | Apenas Vite dev server |
| `npm run dev:electron` | Apenas Electron |
| `npm run build` | Build completo (frontend + electron) |
| `npm run build:vite` | Build apenas do frontend |
| `npm run build:electron` | Compilar TS do Electron |
| `npm run electron:build` | Criar instalador |
| `npm run preview` | Preview do build Vite |

---

## ⚙️ Configuração

### API Endpoint

O launcher se conecta ao servidor para verificar atualizações:

```typescript
// electron/services/updater.ts
const API_BASE_URL = 'https://www.koliseuot.com.br/api';
```

Para alterar, edite a variável `API_BASE_URL` em [electron/services/updater.ts](electron/services/updater.ts:6).

### Links Sociais

Para alterar os links do Discord e WhatsApp:

```typescript
// src/components/Launcher.tsx
const DISCORD_URL = "https://discord.gg/seu-convite";
const WHATSAPP_URL = "https://chat.whatsapp.com/seu-grupo";
```

---

## 🔧 API do Servidor

O launcher espera as seguintes respostas do servidor:

### GET `/api/client/version`

```json
{
  "version": "1.0.0",
  "download_url": "https://example.com/client.zip"
}
```

### Estrutura do client.zip

```
client.zip
├── bin/
│   └── client.exe
├── assets/
├── storeimages/
├── version.txt
└── ... outros arquivos
```

---

## 🏗️ Build Customizado

### Ícones

Coloque seus ícones em:
- Windows: `build/icon.ico`
- macOS: `build/icon.icns`
- Linux: `build/icon.png`

### Electron Builder

Edite [electron-builder.json](electron-builder.json) para customizar:
- Nome do app
- ID do bundle
- Opções do instalador
- Configurações por plataforma

---

## 📖 Documentação Adicional

- [ELECTRON_MIGRATION.md](ELECTRON_MIGRATION.md) - Guia completo da migração Tauri → Electron
- [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) - Resumo da migração
- [CHANGELOG_MIGRATION.md](CHANGELOG_MIGRATION.md) - Changelog detalhado
- [REMOVE_TAURI.md](REMOVE_TAURI.md) - Como remover código Tauri antigo

---

## 🐛 Troubleshooting

### Erro: "electronAPI is not defined"

Certifique-se de que o preload script está sendo carregado:
```typescript
// electron/main.ts
preload: path.join(__dirname, 'preload.js')
```

### Porta 5173 em uso

Altere a porta em `vite.config.ts` e `electron/main.ts`.

### Erro ao compilar TypeScript

```bash
npm run build:electron
```

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: Minha feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📝 Changelog

Ver [CHANGELOG_MIGRATION.md](CHANGELOG_MIGRATION.md) para histórico de mudanças.

### Versão Atual: 2.0.0

- ✅ Migração completa de Tauri para Electron
- ✅ 100% TypeScript (sem Rust)
- ✅ Todas funcionalidades preservadas

---

## 📄 Licença

© 2025 KoliseuOT - Todos os direitos reservados

---

## 👥 Equipe

**KoliseuOT Team** - Desenvolvimento do jogo e launcher

---

## 🔗 Links

- [Website](https://www.koliseuot.com.br)
- [Discord](https://discord.gg/qwaqFUFYRj)
- [WhatsApp](https://chat.whatsapp.com/FcYKv24HyOg87EV5pmEhWL)

---

**Feito com ❤️ pela equipe KoliseuOT**
