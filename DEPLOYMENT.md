# Guia de Deploy - KoliseuOT Launcher

Este guia explica como fazer o build, assinar e distribuir o launcher.

## 📋 Pré-requisitos

### Ambiente de Build (Windows)

1. **Node.js 18+** - https://nodejs.org/
2. **Rust** - https://rustup.rs/
3. **Visual Studio Build Tools** - https://visualstudio.microsoft.com/downloads/
   - Selecione "Desktop development with C++"
4. **Tauri CLI** - `npm install -g @tauri-apps/cli`

### Verificar Instalação

```bash
node --version    # v18+ ou superior
npm --version     # 9+ ou superior
rustc --version   # 1.70+ ou superior
cargo --version   # 1.70+ ou superior
tauri --version   # 1.5+ ou superior
```

---

## 🔐 Passo 1: Gerar Chaves de Assinatura (Primeira Vez)

As chaves são necessárias para o auto-updater funcionar de forma segura.

```bash
# Criar diretório para chaves (se não existir)
mkdir -p ~/.tauri

# Gerar par de chaves
tauri signer generate -w ~/.tauri/koliseu-launcher.key
```

**Saída esperada:**
```
Your keypair was generated successfully!
Private: ~/.tauri/koliseu-launcher.key (Keep this secret!)
Public: dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6...
```

### ⚠️ IMPORTANTE

- **Chave Privada** (`~/.tauri/koliseu-launcher.key`): NUNCA compartilhe, faça backup seguro!
- **Chave Pública**: Copie e cole em `src-tauri/tauri.conf.json`

### Atualizar tauri.conf.json

```json
{
  "tauri": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://game.koliseuot.com.br/launcher/updates/{{target}}/{{current_version}}"
      ],
      "dialog": false,
      "pubkey": "COLE_SUA_CHAVE_PUBLICA_AQUI"
    }
  }
}
```

---

## 🛠️ Passo 2: Build do Launcher

### 2.1. Instalar Dependências

```bash
cd koliseu-launcher
npm install
```

### 2.2. Atualizar Versão

Edite `src-tauri/Cargo.toml` e `src-tauri/tauri.conf.json`:

```toml
# Cargo.toml
[package]
version = "1.0.1"  # Nova versão
```

```json
// tauri.conf.json
{
  "package": {
    "version": "1.0.1"  // Nova versão
  }
}
```

Também atualize `package.json`:
```json
{
  "version": "1.0.1"
}
```

### 2.3. Build de Produção

```bash
npm run tauri:build
```

**Tempo estimado:** 5-10 minutos (primeira vez pode demorar mais)

**Arquivos gerados:**

```
src-tauri/target/release/bundle/
├── nsis/
│   ├── koliseu-launcher_1.0.1_x64-setup.exe          # Instalador NSIS
│   └── koliseu-launcher_1.0.1_x64-setup.nsis.zip     # Para update
└── msi/
    └── koliseu-launcher_1.0.1_x64_en-US.msi          # Instalador MSI
```

---

## 🔏 Passo 3: Assinar o Build

Para o auto-updater funcionar, você precisa assinar o arquivo `.nsis.zip`:

```bash
tauri signer sign \
  -k ~/.tauri/koliseu-launcher.key \
  -p "" \
  src-tauri/target/release/bundle/nsis/koliseu-launcher_1.0.1_x64-setup.nsis.zip
```

**Nota:** Se você configurou senha na chave, substitua `""` pela sua senha.

**Saída esperada:**
```
Signature file written to:
src-tauri/target/release/bundle/nsis/koliseu-launcher_1.0.1_x64-setup.nsis.zip.sig
```

### Verificar Assinatura

```bash
tauri signer verify \
  -k ~/.tauri/koliseu-launcher.key \
  src-tauri/target/release/bundle/nsis/koliseu-launcher_1.0.1_x64-setup.nsis.zip \
  src-tauri/target/release/bundle/nsis/koliseu-launcher_1.0.1_x64-setup.nsis.zip.sig
```

**Saída esperada:**
```
Signature verified successfully!
```

---

## 📤 Passo 4: Upload para Servidor

### 4.1. Upload via SCP

```bash
# Definir variáveis
VERSION="1.0.1"
SERVER="seu-usuario@game.koliseuot.com.br"
DEST_DIR="/var/www/nextapp/public/downloads/launcher"

# Fazer upload dos arquivos
scp src-tauri/target/release/bundle/nsis/koliseu-launcher_${VERSION}_x64-setup.nsis.zip \
    src-tauri/target/release/bundle/nsis/koliseu-launcher_${VERSION}_x64-setup.nsis.zip.sig \
    src-tauri/target/release/bundle/nsis/koliseu-launcher_${VERSION}_x64-setup.exe \
    ${SERVER}:${DEST_DIR}/
```

### 4.2. Verificar Upload

```bash
ssh seu-usuario@game.koliseuot.com.br "ls -lh /var/www/nextapp/public/downloads/launcher/"
```

**Saída esperada:**
```
-rw-r--r-- 1 www-data www-data 4.5M Oct  2 14:30 koliseu-launcher_1.0.1_x64-setup.exe
-rw-r--r-- 1 www-data www-data 3.2M Oct  2 14:30 koliseu-launcher_1.0.1_x64-setup.nsis.zip
-rw-r--r-- 1 www-data www-data  512 Oct  2 14:30 koliseu-launcher_1.0.1_x64-setup.nsis.zip.sig
```

---

## 🌐 Passo 5: Criar API de Updates (Next.js)

### 5.1. Criar Endpoint de Updates

Crie o arquivo: `/home/joao/koliseu-aac/src/pages/api/launcher/updates/[target]/[version].ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface UpdateResponse {
  version: string;
  pub_date: string;
  url: string;
  signature: string;
  notes: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateResponse | void>
) {
  const { target, version } = req.query;

  // Versão mais recente disponível
  const LATEST_VERSION = '1.0.1';

  // Se já está na versão mais recente, sem update
  if (version === LATEST_VERSION) {
    return res.status(204).end();
  }

  // URL base dos downloads
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://game.koliseuot.com.br';
  const downloadUrl = `${baseUrl}/downloads/launcher/koliseu-launcher_${LATEST_VERSION}_x64-setup.nsis.zip`;

  // Ler assinatura do arquivo .sig
  const sigPath = path.join(
    process.cwd(),
    'public',
    'downloads',
    'launcher',
    `koliseu-launcher_${LATEST_VERSION}_x64-setup.nsis.zip.sig`
  );

  let signature = '';
  try {
    signature = fs.readFileSync(sigPath, 'utf-8').trim();
  } catch (error) {
    console.error('Failed to read signature file:', error);
    return res.status(500).json({ error: 'Signature file not found' } as any);
  }

  // Retornar informações de update
  const updateInfo: UpdateResponse = {
    version: LATEST_VERSION,
    pub_date: new Date().toISOString(),
    url: downloadUrl,
    signature: signature,
    notes: `Update to version ${LATEST_VERSION}\n\n` +
           `Changes:\n` +
           `- Bug fixes\n` +
           `- Performance improvements\n` +
           `- UI enhancements`,
  };

  return res.status(200).json(updateInfo);
}
```

### 5.2. Testar Endpoint

```bash
# Testar com versão antiga (deve retornar update)
curl https://game.koliseuot.com.br/api/launcher/updates/windows-x86_64/1.0.0

# Testar com versão atual (deve retornar 204 No Content)
curl -I https://game.koliseuot.com.br/api/launcher/updates/windows-x86_64/1.0.1
```

---

## 📦 Passo 6: Distribuir o Instalador

### Opção 1: Download Direto

Disponibilize o instalador `.exe` para download manual:

```
https://game.koliseuot.com.br/downloads/launcher/koliseu-launcher_1.0.1_x64-setup.exe
```

### Opção 2: Página de Download

Crie uma página no seu site Next.js:

```typescript
// src/pages/download-launcher.tsx
export default function DownloadLauncher() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Download KoliseuOT Launcher</h1>

      <div className="bg-secondary rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Windows</h2>
        <a
          href="/downloads/launcher/koliseu-launcher_1.0.1_x64-setup.exe"
          download
          className="inline-block px-6 py-3 bg-highlight text-white rounded-lg hover:bg-pink-600"
        >
          Download v1.0.1 (3.5 MB)
        </a>
      </div>

      <div className="mt-8 text-gray-400">
        <h3 className="font-bold mb-2">Features:</h3>
        <ul className="list-disc list-inside">
          <li>Auto-update do launcher e cliente</li>
          <li>Interface moderna e leve</li>
          <li>Configuração fácil de servidor</li>
        </ul>
      </div>
    </div>
  );
}
```

---

## 🔄 Workflow Completo de Release

### Checklist de Release

- [ ] 1. Atualizar versão em `Cargo.toml`, `tauri.conf.json`, `package.json`
- [ ] 2. Atualizar changelog/notas de release
- [ ] 3. Commit e push das mudanças
- [ ] 4. Build: `npm run tauri:build`
- [ ] 5. Assinar: `tauri signer sign -k ~/.tauri/koliseu-launcher.key ...`
- [ ] 6. Verificar assinatura: `tauri signer verify ...`
- [ ] 7. Upload para servidor (`.nsis.zip` + `.sig` + `.exe`)
- [ ] 8. Atualizar `LATEST_VERSION` no endpoint de updates
- [ ] 9. Testar download do instalador
- [ ] 10. Testar auto-update do launcher
- [ ] 11. Anunciar nova versão

### Script Automatizado (Bash)

Crie `scripts/release.sh`:

```bash
#!/bin/bash
set -e

# Configurações
VERSION=$1
KEY_PATH="$HOME/.tauri/koliseu-launcher.key"
SERVER="seu-usuario@game.koliseuot.com.br"
DEST_DIR="/var/www/nextapp/public/downloads/launcher"

if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/release.sh <version>"
  exit 1
fi

echo "🚀 Releasing version $VERSION..."

# 1. Build
echo "📦 Building..."
npm run tauri:build

# 2. Sign
echo "🔏 Signing..."
tauri signer sign \
  -k "$KEY_PATH" \
  -p "" \
  "src-tauri/target/release/bundle/nsis/koliseu-launcher_${VERSION}_x64-setup.nsis.zip"

# 3. Verify
echo "✅ Verifying signature..."
tauri signer verify \
  -k "$KEY_PATH" \
  "src-tauri/target/release/bundle/nsis/koliseu-launcher_${VERSION}_x64-setup.nsis.zip" \
  "src-tauri/target/release/bundle/nsis/koliseu-launcher_${VERSION}_x64-setup.nsis.zip.sig"

# 4. Upload
echo "📤 Uploading to server..."
scp src-tauri/target/release/bundle/nsis/koliseu-launcher_${VERSION}_x64-setup.nsis.zip \
    src-tauri/target/release/bundle/nsis/koliseu-launcher_${VERSION}_x64-setup.nsis.zip.sig \
    src-tauri/target/release/bundle/nsis/koliseu-launcher_${VERSION}_x64-setup.exe \
    "${SERVER}:${DEST_DIR}/"

echo "✨ Release complete! Don't forget to update LATEST_VERSION in the API endpoint."
```

Uso:
```bash
chmod +x scripts/release.sh
./scripts/release.sh 1.0.2
```

---

## 🧪 Testes

### Testar Auto-Update Localmente

1. Build versão antiga (ex: 1.0.0)
2. Instalar no Windows
3. Build versão nova (ex: 1.0.1) e fazer deploy
4. Abrir launcher instalado - deve detectar update automaticamente

### Testar Cliente Update

1. Fazer upload de um cliente ZIP para `/public/downloads/`
2. Atualizar versão em `/api/client/version`
3. Abrir launcher - deve detectar update do cliente

---

## 🐛 Troubleshooting

### Erro: "Signature verification failed"

- Verifique se a chave pública em `tauri.conf.json` está correta
- Certifique-se de que assinou com a chave privada correta
- Verifique se o arquivo `.sig` foi gerado e está no servidor

### Erro: "Failed to fetch update manifest"

- Verifique se o endpoint de updates está online
- Verifique CORS se estiver testando em ambiente diferente
- Verifique se a URL em `tauri.conf.json` está correta

### Build falha no Windows

- Reinstale Visual Studio Build Tools
- Reinicie o terminal/VS Code após instalar Rust
- Delete `node_modules` e `src-tauri/target`, reinstale tudo

---

## 📊 Monitoramento

Após deploy, monitore:

1. **Logs do servidor** - downloads do launcher
2. **Analytics** - taxa de update
3. **Crash reports** - erros do launcher (implementar futuramente)
4. **Feedback** - Discord/suporte

---

## 🔒 Segurança

- ✅ **Nunca commite** a chave privada no Git
- ✅ **Faça backup** da chave privada em local seguro
- ✅ **Use HTTPS** para servir updates
- ✅ **Verifique assinatura** antes de cada deploy
- ✅ **Teste** em ambiente staging antes de produção

---

## 📝 Próximos Passos

Após primeiro deploy:

1. Implementar telemetria (opcional)
2. Adicionar changelog visual no launcher
3. Implementar rollback automático em caso de falha
4. Adicionar testes automatizados
5. Configurar CI/CD (GitHub Actions)

---

**Desenvolvido com ❤️ pela equipe KoliseuOT**
