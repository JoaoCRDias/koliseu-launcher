# Build Resources

Esta pasta contém os recursos necessários para criar o instalador do launcher.

## Ícones Necessários

Para personalizar o instalador, substitua os seguintes arquivos:

- **icon.png** - Ícone para Linux (512x512px ou maior, formato PNG)
- **icon.ico** - Ícone para Windows (deve conter múltiplos tamanhos: 16x16, 32x32, 48x48, 256x256)
- **icon.icns** - Ícone para macOS (formato ICNS da Apple)

## Gerando Ícones

Você pode usar ferramentas online ou locais para converter uma imagem PNG em diferentes formatos:

### Windows (.ico)
- Use ferramentas online como https://convertio.co/png-ico/
- Ou use ImageMagick: `convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico`

### macOS (.icns)
- Use o app `iconutil` no macOS
- Ou ferramentas online como https://cloudconvert.com/png-to-icns

## Ícone Atual

O ícone atual é um placeholder temporário. Substitua-o pelo logo oficial do KoliseuOT.
