# Ícones do Launcher

Para gerar os ícones do launcher, você precisa fornecer uma imagem PNG de alta resolução (pelo menos 512x512px).

## Como Gerar Ícones

### Opção 1: Usar Tauri Icon Generator (Recomendado)

```bash
# Instalar tauri-cli globalmente
npm install -g @tauri-apps/cli

# Gerar ícones a partir de uma imagem
tauri icon path/to/your-icon.png
```

Isso gerará automaticamente todos os tamanhos necessários:
- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS)
- `icon.ico` (Windows)

### Opção 2: Manual

Crie os seguintes arquivos manualmente:

**Windows:**
- `icon.ico` - Ícone do executável Windows (deve conter múltiplos tamanhos: 16, 32, 48, 256)

**Tamanhos PNG:**
- `32x32.png` - Ícone pequeno
- `128x128.png` - Ícone médio
- `128x128@2x.png` - Ícone médio retina
- `icon.png` - Ícone base (512x512 ou maior)

**macOS:**
- `icon.icns` - Ícone macOS (se for fazer build para Mac)

## Ferramentas Online

Se você não tem uma ferramenta local, pode usar:

- https://www.icoconverter.com/ - Converter PNG para ICO
- https://cloudconvert.com/ - Converter entre formatos
- https://www.favicon-generator.org/ - Gerar múltiplos tamanhos

## Exemplo de Estrutura Final

```
icons/
├── 32x32.png
├── 128x128.png
├── 128x128@2x.png
├── icon.png
├── icon.ico
├── icon.icns
└── README.md (este arquivo)
```

## Design Recommendations

- Use cores vibrantes e contrastantes
- Evite detalhes muito pequenos (não serão visíveis em tamanhos menores)
- Teste em fundo claro e escuro
- Mantenha design simples e reconhecível
- Use formato vetorial (SVG) como fonte e depois exporte para PNG

## Sugestão de Cores para KoliseuOT

Baseado no tema do launcher:
- Primary: #1a1a2e (azul escuro)
- Highlight: #e94560 (rosa/vermelho)
- Accent: #0f3460 (azul médio)

Você pode criar um ícone com um "K" estilizado ou escudo medieval nessas cores!
