# Guia de Implementação da API para o Launcher KoliseuOT

Este documento contém todas as especificações técnicas necessárias para implementar os endpoints de atualização do launcher no seu site.

## 📋 Sumário
1. [Endpoint de Versão do Cliente](#1-endpoint-de-versão-do-cliente)
2. [Endpoint de Updates do Launcher](#2-endpoint-de-updates-do-launcher)
3. [Estrutura de Arquivos](#3-estrutura-de-arquivos)
4. [Exemplos de Implementação](#4-exemplos-de-implementação)

---

## 1. Endpoint de Versão do Cliente

### 1.1 Especificações

**URL**: `https://game.koliseuot.com.br/api/client/version`

**Método**: `GET`

**Descrição**: Retorna informações sobre a versão mais recente do cliente do jogo.

### 1.2 Resposta Esperada

**Status Code**: `200 OK`

**Content-Type**: `application/json`

**Body**:
```json
{
  "version": "1.0.0",
  "download_url": "https://game.koliseuot.com.br/downloads/client-1.0.0.zip"
}
```

### 1.3 Estrutura dos Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `version` | string | Sim | Versão atual do cliente (formato semver: X.Y.Z) |
| `download_url` | string | Sim | URL completa para download do arquivo ZIP do cliente |

### 1.4 Exemplo de Resposta Completa

```json
{
  "version": "1.2.3",
  "download_url": "https://game.koliseuot.com.br/downloads/client-1.2.3.zip"
}
```

### 1.5 Formato do Arquivo ZIP do Cliente

O arquivo ZIP deve conter:
- `Tibia.exe` - Executável principal do cliente
- Todos os arquivos necessários para o cliente funcionar
- **Não incluir** arquivo `version.txt` (o launcher cria automaticamente)

**Estrutura do ZIP**:
```
client-1.2.3.zip
├── Tibia.exe
├── data/
├── assets/
├── storeimages/
├── bin/
└── ... (outros arquivos necessários)
```

### 1.6 Substituição Seletiva de Pastas

⚠️ **IMPORTANTE**: O launcher possui um sistema de substituição seletiva de pastas durante atualizações para **preservar configurações do usuário**.

#### 1.6.1 Pastas que SÃO Substituídas (Sempre sobrescritas)

As seguintes pastas são **completamente deletadas e substituídas** a cada atualização:

- **`assets/`** - Recursos visuais do jogo (sprites, texturas, etc.)
- **`storeimages/`** - Imagens da loja do jogo
- **`bin/`** - Binários e bibliotecas do cliente

Estas pastas devem sempre estar presentes e atualizadas no ZIP de atualização.

#### 1.6.2 Arquivos/Pastas que NÃO São Substituídos (Preservados)

Todos os outros arquivos e pastas que **já existem** no diretório do cliente são **preservados**:

- **Arquivos de configuração do usuário** (ex: `clientoptions.json`, configurações de interface)
- **Dados de cache/preferências** (ex: minimapa customizado, configurações de hotkeys)
- **Qualquer arquivo criado pelo usuário**

#### 1.6.3 Lógica de Atualização

```
1. Deletar completamente: assets/, storeimages/, bin/
2. Extrair do ZIP:
   - Arquivos dentro de assets/, storeimages/, bin/ → SEMPRE extrair
   - Outros arquivos → APENAS se não existirem
3. Preservar: Tudo que já existe fora das pastas de substituição
```

#### 1.6.4 Exemplo Prático

**Antes da atualização:**
```
client/
├── Tibia.exe
├── clientoptions.json (configurações do usuário)
├── assets/ (versão antiga)
├── storeimages/ (versão antiga)
├── bin/ (versão antiga)
└── meu_arquivo_customizado.txt
```

**Após atualização:**
```
client/
├── Tibia.exe (mantido se já existia)
├── clientoptions.json (PRESERVADO - configurações do usuário)
├── assets/ (SUBSTITUÍDO - nova versão)
├── storeimages/ (SUBSTITUÍDO - nova versão)
├── bin/ (SUBSTITUÍDO - nova versão)
└── meu_arquivo_customizado.txt (PRESERVADO)
```

#### 1.6.5 Modificando as Pastas de Substituição

Se você precisar alterar quais pastas são substituídas, edite a linha 81 do arquivo `src-tauri/src/main.rs`:

```rust
const REPLACE_FOLDERS: &[&str] = &["assets", "storeimages", "bin"];
```

**Atenção**: Adicionar pastas que contêm configurações do usuário pode causar perda de dados!

---

## 2. Endpoint de Updates do Launcher

### 2.1 Especificações

**URL**: `https://game.koliseuot.com.br/launcher/updates/{{target}}/{{current_version}}`

**Método**: `GET`

**Descrição**: Retorna informações sobre atualizações disponíveis do launcher.

### 2.2 Parâmetros de URL

| Parâmetro | Exemplo | Descrição |
|-----------|---------|-----------|
| `{{target}}` | `windows-x86_64` | Plataforma alvo (apenas Windows 64-bit é suportado) |
| `{{current_version}}` | `1.0.0` | Versão atual do launcher instalada no cliente |

### 2.3 Exemplo de URL Gerada

- Windows 64-bit: `https://game.koliseuot.com.br/launcher/updates/windows-x86_64/1.0.0`

**Nota**: O servidor do jogo roda apenas em Windows, portanto apenas a plataforma `windows-x86_64` é suportada.

### 2.4 Resposta Esperada

#### 2.4.1 Quando NÃO há atualização disponível

**Status Code**: `204 No Content` ou `200 OK` com body vazio

**Body**: (vazio)

#### 2.4.2 Quando HÁ atualização disponível

**Status Code**: `200 OK`

**Content-Type**: `application/json`

**Body**:
```json
{
  "version": "1.0.1",
  "notes": "Correção de bugs e melhorias de performance",
  "pub_date": "2025-10-02T15:30:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVUeE9BQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQQ==",
      "url": "https://game.koliseuot.com.br/launcher/updates/koliseu-launcher-1.0.1-setup.exe"
    }
  }
}
```

### 2.5 Estrutura dos Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `version` | string | Sim | Nova versão disponível (formato semver: X.Y.Z) |
| `notes` | string | Não | Notas de atualização / changelog |
| `pub_date` | string | Sim | Data de publicação no formato ISO 8601 (UTC) |
| `platforms` | object | Sim | Objeto contendo informações por plataforma |
| `platforms.{target}.signature` | string | Sim | Assinatura criptográfica do arquivo (gerada pelo Tauri CLI) |
| `platforms.{target}.url` | string | Sim | URL completa para download do instalador |

### 2.6 Lógica de Comparação de Versões

O servidor deve comparar a versão solicitada (`{{current_version}}`) com a versão mais recente disponível:

- Se `current_version` < `latest_version` → Retornar JSON com update
- Se `current_version` >= `latest_version` → Retornar 204 No Content

**Exemplo**:
- Cliente solicita: `/updates/windows-x86_64/1.0.0`
- Última versão no servidor: `1.0.1`
- Resposta: JSON com informações da versão `1.0.1`

### 2.7 Gerando Assinaturas (Importante!)

As assinaturas são geradas usando o Tauri CLI:

```bash
# 1. Gerar par de chaves (fazer apenas uma vez)
tauri signer generate

# Isso gera:
# - Private key: guardar em local seguro
# - Public key: colocar no tauri.conf.json

# 2. Assinar um arquivo de update
tauri signer sign /path/to/launcher-setup.exe

# Isso gera:
# - launcher-setup.exe.sig (arquivo de assinatura)
# - String base64 para usar no JSON da API
```

---

## 3. Estrutura de Arquivos

### 3.1 Estrutura Recomendada no Servidor

```
/var/www/game.koliseuot.com.br/
├── api/
│   └── client/
│       └── version.json (ou endpoint dinâmico)
├── downloads/
│   ├── client-1.0.0.zip
│   ├── client-1.0.1.zip
│   └── client-1.2.3.zip (versão mais recente)
└── launcher/
    └── updates/
        ├── windows-x86_64/
        │   ├── koliseu-launcher-1.0.0-setup.exe
        │   ├── koliseu-launcher-1.0.0-setup.exe.sig
        │   ├── koliseu-launcher-1.0.1-setup.exe
        │   └── koliseu-launcher-1.0.1-setup.exe.sig
        └── version-info.json (arquivo de controle)
```

### 3.2 Arquivo de Controle de Versões (Sugestão)

Criar um arquivo `version-info.json` para facilitar o gerenciamento:

```json
{
  "client": {
    "version": "1.2.3",
    "download_url": "https://game.koliseuot.com.br/downloads/client-1.2.3.zip",
    "release_date": "2025-10-02",
    "changelog": "Lista de mudanças..."
  },
  "launcher": {
    "latest_version": "1.0.1",
    "release_date": "2025-10-02T15:30:00Z",
    "changelog": "Correção de bugs e melhorias de performance",
    "platforms": {
      "windows-x86_64": {
        "filename": "koliseu-launcher-1.0.1-setup.exe",
        "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",
        "url": "https://game.koliseuot.com.br/launcher/updates/koliseu-launcher-1.0.1-setup.exe"
      }
    }
  }
}
```

---

## 4. Exemplos de Implementação

### 4.1 PHP (Simples - Arquivo Estático)

```php
<?php
// api/client/version.php

header('Content-Type: application/json');

$versionInfo = [
    'version' => '1.2.3',
    'download_url' => 'https://game.koliseuot.com.br/downloads/client-1.2.3.zip'
];

echo json_encode($versionInfo);
```

### 4.2 PHP (Dinâmico com Controle de Versão)

```php
<?php
// api/client/version.php

header('Content-Type: application/json');

// Carregar informações de versão de um arquivo ou banco de dados
$versionFile = __DIR__ . '/../../version-info.json';
$versionData = json_decode(file_get_contents($versionFile), true);

$response = [
    'version' => $versionData['client']['version'],
    'download_url' => $versionData['client']['download_url']
];

echo json_encode($response);
```

### 4.3 PHP (Endpoint de Updates do Launcher)

```php
<?php
// launcher/updates/index.php

header('Content-Type: application/json');

// Extrair parâmetros da URL
// URL: /launcher/updates/{target}/{current_version}
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($path, '/'));

// Exemplo: ['launcher', 'updates', 'windows-x86_64', '1.0.0']
$target = $parts[2] ?? '';
$currentVersion = $parts[3] ?? '';

// Carregar informações de versão
$versionFile = __DIR__ . '/../../version-info.json';
$versionData = json_decode(file_get_contents($versionFile), true);

$latestVersion = $versionData['launcher']['latest_version'];

// Comparar versões (função simplificada)
function compareVersions($current, $latest) {
    return version_compare($current, $latest, '<');
}

// Se não há atualização disponível
if (!compareVersions($currentVersion, $latestVersion)) {
    http_response_code(204);
    exit;
}

// Se há atualização disponível
$platformData = $versionData['launcher']['platforms'][$target] ?? null;

if (!$platformData) {
    http_response_code(404);
    echo json_encode(['error' => 'Platform not supported']);
    exit;
}

$response = [
    'version' => $latestVersion,
    'notes' => $versionData['launcher']['changelog'],
    'pub_date' => $versionData['launcher']['release_date'],
    'platforms' => [
        $target => [
            'signature' => $platformData['signature'],
            'url' => $platformData['url']
        ]
    ]
];

echo json_encode($response);
```

### 4.4 Node.js/Express (Completo)

```javascript
// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const semver = require('semver');

const app = express();
const PORT = 3000;

// Carregar dados de versão
const versionData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'version-info.json'), 'utf8')
);

// Endpoint de versão do cliente
app.get('/api/client/version', (req, res) => {
  res.json({
    version: versionData.client.version,
    download_url: versionData.client.download_url
  });
});

// Endpoint de updates do launcher
app.get('/launcher/updates/:target/:currentVersion', (req, res) => {
  const { target, currentVersion } = req.params;
  const latestVersion = versionData.launcher.latest_version;

  // Verificar se há atualização disponível
  if (!semver.lt(currentVersion, latestVersion)) {
    return res.status(204).send();
  }

  // Verificar se a plataforma é suportada
  const platformData = versionData.launcher.platforms[target];
  if (!platformData) {
    return res.status(404).json({ error: 'Platform not supported' });
  }

  // Retornar informações de atualização
  res.json({
    version: latestVersion,
    notes: versionData.launcher.changelog,
    pub_date: versionData.launcher.release_date,
    platforms: {
      [target]: {
        signature: platformData.signature,
        url: platformData.url
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 4.5 Python/Flask (Completo)

```python
# app.py
from flask import Flask, jsonify, request
import json
from packaging import version

app = Flask(__name__)

# Carregar dados de versão
with open('version-info.json', 'r') as f:
    version_data = json.load(f)

@app.route('/api/client/version', methods=['GET'])
def get_client_version():
    return jsonify({
        'version': version_data['client']['version'],
        'download_url': version_data['client']['download_url']
    })

@app.route('/launcher/updates/<target>/<current_version>', methods=['GET'])
def get_launcher_updates(target, current_version):
    latest_version = version_data['launcher']['latest_version']

    # Verificar se há atualização disponível
    if version.parse(current_version) >= version.parse(latest_version):
        return '', 204

    # Verificar se a plataforma é suportada
    platform_data = version_data['launcher']['platforms'].get(target)
    if not platform_data:
        return jsonify({'error': 'Platform not supported'}), 404

    # Retornar informações de atualização
    return jsonify({
        'version': latest_version,
        'notes': version_data['launcher']['changelog'],
        'pub_date': version_data['launcher']['release_date'],
        'platforms': {
            target: {
                'signature': platform_data['signature'],
                'url': platform_data['url']
            }
        }
    })

if __name__ == '__main__':
    app.run(port=3000)
```

---

## 5. Checklist de Implementação

### 5.1 Setup Inicial

- [ ] Decidir tecnologia/framework (PHP, Node.js, Python, etc.)
- [ ] Criar estrutura de diretórios no servidor
- [ ] Configurar HTTPS (obrigatório para downloads seguros)
- [ ] Preparar arquivo ZIP do cliente inicial

### 5.2 Endpoint de Cliente

- [ ] Implementar GET `/api/client/version`
- [ ] Retornar JSON com `version` e `download_url`
- [ ] Fazer upload do arquivo ZIP do cliente
- [ ] Testar endpoint manualmente

### 5.3 Endpoint de Launcher (Opcional inicialmente)

- [ ] Gerar par de chaves com `tauri signer generate`
- [ ] Adicionar chave pública no `tauri.conf.json`
- [ ] Implementar GET `/launcher/updates/{target}/{version}`
- [ ] Compilar launcher e gerar instaladores
- [ ] Assinar instaladores com chave privada
- [ ] Fazer upload dos instaladores e assinaturas
- [ ] Testar endpoint manualmente

### 5.4 Testes

- [ ] Testar verificação de versão do cliente
- [ ] Testar download e extração do cliente
- [ ] Testar lançamento do cliente
- [ ] Testar verificação de versão do launcher
- [ ] Testar download e instalação de update do launcher

---

## 6. Notas Importantes

### 6.1 Segurança

- ✅ Use sempre HTTPS para todos os endpoints
- ✅ Assine todos os updates do launcher com chave privada
- ✅ Nunca exponha sua chave privada publicamente
- ✅ Valide tamanhos de arquivo antes de fazer upload
- ✅ Use Content-Type correto (`application/json`)

### 6.2 Performance

- ✅ Use cache HTTP para respostas de versão (quando não mudarem)
- ✅ Use CDN para hospedar arquivos grandes (ZIPs, instaladores)
- ✅ Comprima os arquivos ZIP do cliente adequadamente
- ✅ Monitore largura de banda e uso de storage

### 6.3 Manutenção

- ✅ Mantenha histórico de versões antigas (pelo menos 2-3 versões)
- ✅ Documente mudanças em cada versão (changelog)
- ✅ Implemente logging de requisições aos endpoints
- ✅ Configure backup automático dos arquivos de versão

---

## 7. Troubleshooting

### Problema: "Failed to fetch version info"
- Verificar se o endpoint está acessível
- Verificar CORS se estiver testando localmente
- Verificar formato do JSON retornado

### Problema: "Failed to download client"
- Verificar se a URL do download está correta
- Verificar permissões do arquivo no servidor
- Verificar se o arquivo ZIP está corrompido

### Problema: "Signature verification failed" (launcher update)
- Verificar se a chave pública no `tauri.conf.json` está correta
- Verificar se o arquivo foi assinado com a chave privada correspondente
- Verificar se o arquivo não foi modificado após a assinatura

---

## 8. Recursos Adicionais

- [Documentação oficial do Tauri Updater](https://tauri.app/v1/guides/distribution/updater)
- [Semantic Versioning](https://semver.org/)
- [ISO 8601 Date Format](https://en.wikipedia.org/wiki/ISO_8601)

---

**Última atualização**: 2025-10-02
**Versão do documento**: 1.0.0
