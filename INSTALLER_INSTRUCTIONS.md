# Instruções para Criar o Instalador

## ⚠️ IMPORTANTE: Privilégios de Administrador Necessários

O electron-builder precisa de privilégios de administrador no Windows para criar symbolic links durante o processo de build.

## Solução 1: Executar como Administrador (RECOMENDADO)

### Passo a Passo:

1. **Abrir PowerShell ou CMD como Administrador:**
   - Pressione `Win + X`
   - Selecione "Windows PowerShell (Admin)" ou "Prompt de Comando (Admin)"
   - Ou clique com botão direito no PowerShell/CMD e selecione "Executar como administrador"

2. **Navegar até a pasta do projeto:**
   ```bash
   cd "C:\Users\joaoc\Documents\koliseu-launcher"
   ```

3. **Executar o build:**
   ```bash
   npm run electron:build
   ```

4. **Aguardar a conclusão:**
   - O processo pode levar alguns minutos
   - O instalador será criado na pasta `out/`

5. **Localizar o instalador:**
   ```
   out\KoliseuOT Launcher Setup 1.0.0.exe
   ```

## Solução 2: Habilitar Modo Desenvolvedor no Windows

Se preferir não executar como administrador toda vez:

1. Abra **Configurações** do Windows
2. Vá em **Atualização e Segurança** > **Para Desenvolvedores**
3. Ative o **Modo de desenvolvedor**
4. Reinicie o computador
5. Execute `npm run electron:build` normalmente

## Solução 3: Build Portável (Sem Instalador)

Se não conseguir executar como admin, você pode criar uma versão portável:

```bash
npm run build
```

Depois, copie manualmente os arquivos de `out/win-unpacked/` para distribuir.

## Verificação Pós-Build

Após criar o instalador com sucesso:

1. ✅ Verifique se o arquivo `.exe` existe em `out/`
2. ✅ Teste a instalação em uma máquina limpa
3. ✅ Verifique se os atalhos foram criados
4. ✅ Teste se o launcher abre corretamente

## Troubleshooting

### Erro: "Cannot create symbolic link"
**Solução:** Execute o terminal como Administrador (Solução 1)

### Erro: "EACCES" ou "Permission denied"
**Solução:**
- Execute como Administrador
- Ou desative temporariamente o antivírus
- Ou adicione a pasta do projeto às exceções do antivírus

### Instalador muito grande (> 200MB)
**Normal:** O Electron inclui o Chromium, então o tamanho base é ~100-150MB

### Erro ao instalar: "Antivírus bloqueou"
**Solução:**
- Adicione o instalador às exceções do antivírus
- Ou assine digitalmente o instalador (requer certificado de code signing)

## Assinatura Digital (Opcional - Para Distribuição Profissional)

Para evitar avisos do Windows SmartScreen:

1. Adquira um certificado de code signing (ex: Sectigo, DigiCert)
2. Configure as variáveis de ambiente:
   ```
   set CSC_LINK=caminho\para\certificado.pfx
   set CSC_KEY_PASSWORD=senha_do_certificado
   ```
3. Execute o build normalmente

Custo típico: $200-500/ano

## Scripts Disponíveis

- `npm run build` - Compila o código (sem gerar instalador)
- `npm run electron:build` - Gera o instalador completo
- `npm run dev` - Executa em modo de desenvolvimento

## Suporte

Se encontrar problemas:
1. Verifique os logs em `out/`
2. Execute com `--verbose`: `npm run electron:build -- --verbose`
3. Consulte a documentação: https://www.electron.build/

---

**KoliseuOT Team** 🏰
