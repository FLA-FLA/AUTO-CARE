# Auto Care — documentação do projeto

> Documento técnico baseado no código e nas configurações presentes no repositório. O aplicativo está em desenvolvimento: os fluxos descritos abaixo são os implementados atualmente, e as limitações estão registradas para evitar confundir uma demonstração local com um serviço de aluguel pronto para produção.

## 1. Visão geral

Auto Care é um aplicativo móvel multiplataforma para gestão de veículos e demonstração de um marketplace de aluguel entre pessoas. Há dois perfis de conta:

- **Locador**: no código chamado `proprietario`. Cadastra veículos para aluguel, controla a disponibilidade e responde a pedidos recebidos.
- **Locatário**: no código chamado `locatario`. Consulta veículos disponíveis, informa período pretendido, envia solicitações e acompanha o status.

O projeto também contém funções de controle de um veículo: manutenção, revisões, documentos e abastecimentos. Essas informações são armazenadas localmente no aparelho.

**Estado atual importante:** não há servidor, API, banco de dados remoto, integração de pagamento ou sincronização entre celulares. Cadastro e login são demonstrativos e usam somente nome, e-mail e perfil. Os dados do marketplace ficam no `AsyncStorage` do dispositivo onde foram criados.

## 2. Funcionalidades por perfil

### 2.1 Locador (`proprietario`)

1. Cria uma conta selecionando **Quero anunciar**.
2. Acessa a área do proprietário na tela inicial.
3. Cadastra um anúncio com marca, modelo, ano, placa, cidade, preço diário e descrição opcional.
4. O anúncio começa com `disponivel: true` e aparece no catálogo de locação, exceto para o próprio proprietário.
5. Em **Meus carros**, pode alternar a disponibilidade, remover o anúncio e consultar solicitações recebidas.
6. Para cada solicitação `pendente`, pode escolher **Aprovar** ou **Recusar**.
7. A tela inicial mostra a quantidade de anúncios disponíveis do próprio locador e o total de solicitações pendentes associadas a ele.

O proprietário do anúncio é identificado pelo `proprietarioId`, e o nome registrado no momento do anúncio é copiado para `proprietarioNome`.

### 2.2 Locatário (`locatario`)

1. Cria uma conta selecionando **Quero alugar**.
2. Acessa **Explorar carros**, informa retirada e devolução no formato `AAAA-MM-DD` e consulta anúncios elegíveis.
3. Envia um pedido de aluguel para um anúncio. O pedido é criado com status `pendente`.
4. O valor estimado é calculado como quantidade de diárias multiplicada pelo valor diário do anúncio.
5. Em **Meus aluguéis**, acompanha carro, período, total estimado e status.

O cálculo considera pelo menos uma diária. A interface valida que as datas resultem em um intervalo positivo, mas o fluxo atual não implementa calendário com seleção de datas nem verificação completa de conflitos entre intervalos.

### 2.3 Recursos de veículo

Na tela inicial também existem atalhos para:

- **Manutenções:** registra serviço, data, valor e observação; permite excluir registros.
- **Revisões:** registra tipo, data, quilometragem e observação; permite excluir registros.
- **Documentos:** registra tipo, número, validade e observação; permite excluir registros.
- **Combustível:** registra abastecimentos com data, litros, valor e quilometragem; permite excluir registros.

Esses registros são listas locais do aplicativo. Atualmente não há associação por `vehicleId` nem separação por usuário logado; portanto, não devem ser tratados como prontuário privado ou sincronizado de uma conta.

## 3. Perfis de usuário e contas de demonstração

Os tipos de perfil definidos pelo código são:

```ts
type TipoUsuario = 'proprietario' | 'locatario';
```

Não existem contas padrão pré-cadastradas nem senhas de demonstração no repositório. Para experimentar os dois lados, crie duas contas neste aparelho, usando e-mails diferentes:

| Perfil | Seleção no cadastro | Fluxo para validar |
| --- | --- | --- |
| Locador | **Quero anunciar** | Criar anúncio → abrir **Meus carros** → receber pedido → aprovar ou recusar |
| Locatário | **Quero alugar** | Explorar catálogo → preencher período → solicitar aluguel → acompanhar em **Meus aluguéis** |

Para alternar as contas no mesmo aparelho, use **Sair da conta** e entre com o e-mail cadastrado. O login procura o e-mail na lista local; não solicita senha, não valida identidade e não consulta um serviço externo. Os anúncios e pedidos continuam no armazenamento local do mesmo aparelho.

## 4. Fluxo e estados do aluguel

O modelo declara os seguintes estados:

```text
pendente → aprovado
         → recusado
aprovado → finalizado (estado previsto no tipo, sem ação implementada na interface)
```

Na implementação atual, o locador pode alterar pedidos pendentes para `aprovado` ou `recusado`. Não existe botão ou rotina de finalização. O catálogo exclui carros que tenham algum pedido com estado `aprovado`; essa regra não é limitada ao período solicitado e um pedido aprovado continua retirando o carro do catálogo até que o estado seja alterado por outra lógica.

## 5. Arquitetura técnica

### 5.1 Plataforma e bibliotecas

| Componente | Uso no projeto |
| --- | --- |
| Expo SDK `57` | Plataforma e ferramentas para aplicação React Native. |
| React `19.2.3` | Componentes e estado da interface. |
| React Native `0.86.3` | Interface nativa para Android e iOS. |
| TypeScript `~6.0.3` | Tipos e checagem estática; `strict` está habilitado. |
| Expo Router `~57.0.23` | Navegação baseada nos arquivos de `src/app`. |
| AsyncStorage `2.2.0` | Persistência chave/valor local no dispositivo. |
| React Native Reanimated `4.5.1` e Worklets `0.10.1` | Dependências de animação e infraestrutura nativa. |
| Gesture Handler `~2.32.0`, Screens `~4.26.0`, Safe Area Context `~5.7.0` | Suporte de navegação e interação nativa. |
| Expo Image, Font, Constants, Linking, Splash Screen, Status Bar, System UI, Web Browser, Device, Symbols, Glass Effect e `@expo/ui` | Pacotes instalados no projeto Expo; nem todos são usados diretamente nos fluxos centrais descritos neste documento. |
| React DOM e React Native Web | Suporte à execução web configurado. |

As versões acima são as declaradas em `package.json`; `package-lock.json` fixa a árvore resolvida pelo npm. Consulte esses arquivos ao atualizar dependências.

### 5.2 Navegação e organização

O ponto de entrada é `expo-router/entry`. As telas ficam em `src/app`, e seus nomes de arquivo definem rotas. O layout raiz em `src/app/_layout.tsx` configura um `Stack` sem cabeçalho padrão. As telas usam `router.push()` para abrir rotas e `router.back()` para retornar.

| Arquivo | Rota/finalidade |
| --- | --- |
| `src/app/index.tsx` | Início, cadastro/login demonstrativos, perfil, atalhos e resumo de anúncios/pedidos. |
| `src/app/aluguel.tsx` | Catálogo, datas pretendidas e criação de pedido. |
| `src/app/meus-alugueis.tsx` | Histórico de pedidos do locatário logado. |
| `src/app/meus-carros.tsx` | Anúncios e solicitações recebidas pelo locador. |
| `src/app/adicionar-veiculo.tsx` | Formulário de anúncio. |
| `src/app/veiculo.tsx` | Cadastro local simples de veículo (`@autocare_veiculo`); fluxo legado/independente do catálogo de aluguel. |
| `src/app/manutencoes.tsx`, `src/app/adicionar-manutencao.tsx` | Lista e formulário de manutenção. |
| `src/app/revisoes.tsx`, `src/app/adicionar-revisao.tsx` | Lista e formulário de revisão. |
| `src/app/documentos.tsx`, `src/app/adicionar-documento.tsx` | Lista e formulário de documentos. |
| `src/app/combustivel.tsx`, `src/app/adicionar-combustivel.tsx` | Lista e formulário de abastecimentos. |
| `src/app/explore.tsx` | Tela de exploração herdada do starter Expo. |

### 5.3 Camada de dados do marketplace

`src/lib/aluguel.ts` define os tipos, as chaves de armazenamento e as operações de leitura/gravação do marketplace. A função genérica `ler<T>()` lê JSON do AsyncStorage e usa um valor alternativo quando não há registro; `gravar<T>()` serializa o valor com `JSON.stringify`.

| Tipo | Campos principais |
| --- | --- |
| `Usuario` | `id`, `nome`, `email`, `tipo`. |
| `Carro` | `id`, `proprietarioId`, `proprietarioNome`, `marca`, `modelo`, `ano`, `placa`, `cidade`, `diaria`, `descricao`, `disponivel`, `criadoEm`. |
| `Aluguel` | `id`, `carroId`, `locatarioId`, `locatarioNome`, `proprietarioId`, `inicio`, `fim`, `total`, `status`, `criadoEm`. |

Chaves persistidas pelo marketplace:

| Chave AsyncStorage | Conteúdo |
| --- | --- |
| `@autocare_usuarios` | Lista local de usuários de demonstração. |
| `@autocare_sessao` | Usuário atualmente selecionado; `null` após sair. |
| `@autocare_carros` | Lista de anúncios de veículos. |
| `@autocare_alugueis` | Lista de pedidos de aluguel. |
| `@autocare_manutencoes` | Lista local de manutenções. |
| `@autocare_revisoes` | Lista local de revisões. |
| `@autocare_documentos` | Lista local de documentos. |
| `@autocare_combustivel` | Lista local de abastecimentos. |
| `@autocare_veiculo` | Veículo simples da tela legada `veiculo.tsx`. |

Os quatro primeiros registros são acessados pelas funções compartilhadas de `src/lib/aluguel.ts`. As listas de manutenção, revisão, documentos e combustível leem e gravam diretamente no AsyncStorage pelas respectivas telas.

### 5.4 Persistência, identidade e segurança

- AsyncStorage é armazenamento persistente local, não um banco remoto e não um mecanismo de autenticação.
- Os dados não são compartilhados entre instalações, contas de sistema ou aparelhos.
- O perfil selecionado direciona a experiência da tela inicial, mas não substitui autorização no servidor. Não há servidor nem controle de acesso confiável neste protótipo.
- O cadastro impede repetir um e-mail já existente na lista local, comparando e-mails sem diferenciar maiúsculas de minúsculas.
- Não há senha, recuperação de conta, verificação de e-mail, proteção antifraude, criptografia de dados de negócio pela aplicação, auditoria ou política de retenção.
- Não use dados pessoais reais nem documentos sensíveis neste estágio.

## 6. Regras de negócio atualmente implementadas

1. Um anúncio exige marca, modelo, ano, placa, cidade e diária numérica maior que zero; descrição é opcional.
2. A placa é convertida para maiúsculas ao salvar o anúncio.
3. Somente uma sessão com tipo `proprietario` consegue publicar anúncio pela tela `adicionar-veiculo.tsx`.
4. O catálogo apresenta anúncios marcados como disponíveis, exclui carros do usuário atual e exclui carros que tenham aluguel aprovado.
5. Uma solicitação exige usuário logado e datas de retirada/devolução; o pedido guarda IDs e nomes usados no momento da criação.
6. O total estimado é `diárias × diária do anúncio`; a aplicação não cobra esse valor.
7. O locador consegue aprovar/recusar apenas solicitações pendentes pela interface atual.
8. A remoção de anúncio remove o carro da lista; não há rotina visível de cascata que apague os pedidos associados.
9. O conteúdo de manutenção, revisão, documento e abastecimento usa listas independentes e não é filtrado pelo usuário ou por veículo.

## 7. Comandos de desenvolvimento e build

Execute os comandos a partir da raiz `C:\AUTO-CARE`, salvo indicação contrária.

### Instalar dependências

```powershell
cd C:\AUTO-CARE
npm install
```

Prefira `npm ci` quando quiser reproduzir exatamente o `package-lock.json` em uma instalação limpa de CI:

```powershell
npm ci
```

### Iniciar o Metro/Expo

```powershell
npm start
```

O script é equivalente a `expo start`. Para limpar o cache do Metro, quando houver evidência de cache JS desatualizado:

```powershell
npx expo start --clear
```

### Executar em Android, iOS ou web

```powershell
npm run android
npm run ios
npm run web
```

Os comandos iOS requerem ambiente compatível com desenvolvimento iOS. Em Windows, use Android ou web.

### Gerar o APK de depuração Android com Gradle

O projeto Gradle está dentro de `android`; rode o wrapper a partir dessa pasta:

```powershell
cd C:\AUTO-CARE\android
.\gradlew.bat app:assembleDebug -x lint -x test --configure-on-demand --build-cache -PreactNativeDevServerPort=8081 -PreactNativeArchitectures=x86_64
```

O APK de depuração, quando o build termina com sucesso, normalmente fica em `android\app\build\outputs\apk\debug\app-debug.apk`.

Também é possível informar a pasta do projeto Gradle explicitamente:

```powershell
cd C:\AUTO-CARE
.\android\gradlew.bat -p android app:assembleDebug -x lint -x test --configure-on-demand --build-cache -PreactNativeDevServerPort=8081 -PreactNativeArchitectures=x86_64
```

O argumento `-p android` é importante quando o wrapper é iniciado da raiz, pois a raiz do repositório não contém `settings.gradle`; esse arquivo está em `android\settings.gradle`.

### Limpeza de build Android

Pare daemons e tente a tarefa Gradle `clean` a partir da pasta correta:

```powershell
cd C:\AUTO-CARE\android
.\gradlew.bat --stop
.\gradlew.bat clean
```

Se uma configuração quebrada impedir o Gradle de iniciar, `android\build` contém resultados gerados e pode ser removida para regenerar arquivos de autolinking na próxima compilação:

```powershell
Remove-Item -Recurse -Force .\build
```

Execute esse último comando somente dentro de `C:\AUTO-CARE\android`. Ele remove resultados gerados e faz a próxima compilação reconstruí-los; não remove o código-fonte de `android\app`.

### Cache do Gradle no Windows

O wrapper baixa a distribuição especificada por `android\gradle\wrapper\gradle-wrapper.properties` e guarda-a em `GRADLE_USER_HOME`. Se o diretório de cache padrão não for gravável, configure um caminho gravável antes de executar o wrapper:

```powershell
$env:GRADLE_USER_HOME = "$env:USERPROFILE\.gradle"
```

Para manter o cache específico do projeto durante uma sessão:

```powershell
$env:GRADLE_USER_HOME = "C:\AUTO-CARE\.gradle-user"
```

É necessário que o caminho escolhido seja gravável e que a rede permita baixar `https://services.gradle.org/distributions/gradle-9.3.1-bin.zip` quando essa distribuição ainda não estiver em cache. Limpar `caches` não corrige falta de permissão nem bloqueio de rede.

### Lint e reset do starter

```powershell
npm run lint
```

O script declarado é `expo lint`. O script `npm run reset-project` executa `scripts/reset-project.js` e foi herdado do template; ele reorganiza/remove o starter e não é uma rotina de limpeza do Gradle. Não o execute como tentativa de corrigir build sem revisar o script e os arquivos afetados.

## 8. Configuração Android observada

- Identificador Android: `com.jesussilvarjs.autocare`.
- Wrapper Gradle: `9.3.1` (`gradle-9.3.1-bin.zip`).
- Java observado durante o diagnóstico anterior: JDK `17.0.18`; confirme o JDK configurado no seu ambiente antes de alterar versões.
- `newArchEnabled=true` e `hermesEnabled=true` em `android\gradle.properties`.
- `reactNativeArchitectures` pode ser limitado na linha de comando a `x86_64`, como no comando de build acima.
- `android/settings.gradle` ativa os plugins de configuração do React Native e autolinking do Expo. O arquivo gerado `android\build\generated\autolinking\autolinking.json` depende da localização atual do projeto; após mover o checkout, resultados nativos gerados antigos podem conter caminhos absolutos obsoletos.
- As versões de SDK Android (`compileSdk`, `targetSdk`, NDK e Build Tools) são fornecidas pelo catálogo/configuração Expo e pelo projeto Gradle; não altere números manualmente sem consultar a documentação versionada do SDK Expo usado.

## 9. Estrutura relevante do repositório

```text
AUTO-CARE/
├── android/                 # Projeto nativo Android e wrapper Gradle
├── assets/                  # Ícones, splash e imagens
├── scripts/                 # Scripts auxiliares do projeto
├── src/
│   ├── app/                 # Rotas/telas do Expo Router
│   ├── components/          # Componentes reutilizáveis
│   ├── constants/           # Tema e constantes visuais
│   ├── hooks/               # Hooks de tema
│   └── lib/aluguel.ts       # Tipos, sessão e dados locais do marketplace
├── app.json                 # Configuração Expo
├── package.json             # Dependências e scripts npm
├── package-lock.json        # Árvore de dependências resolvida
└── tsconfig.json            # TypeScript estrito e alias @/* → src/*
```

Existe também uma pasta `app-veiculos/` com outro `package.json` e uma aplicação separada herdada/auxiliar. Os comandos e a descrição deste documento se referem ao projeto principal na raiz `C:\AUTO-CARE`, identificado pelo `package.json` que usa `expo-router/entry` e pelas telas em `src/app`.

## 10. Lacunas para transformar o protótipo em produto

Antes de uso real por locadores e locatários, seria necessário, no mínimo:

- API e banco de dados central para contas, anúncios e reservas;
- autenticação segura, autorização por recurso e recuperação de conta;
- validação de datas e concorrência no servidor, incluindo sobreposição de reservas;
- regras explícitas para aprovação, cancelamento, retirada, devolução e finalização;
- pagamentos, reembolsos, taxas e comprovantes, se fizerem parte do produto;
- fluxo de identidade, habilitação do motorista, vistoria e contratos, se exigidos pela operação;
- associação dos dados de manutenção a um usuário e a um veículo;
- tratamento de documentos e dados pessoais com controles de privacidade e retenção;
- testes automatizados, observabilidade, tratamento consistente de erros e política de backup.

Esses itens são recomendações de evolução e não funcionalidades disponíveis no código atual.

## 11. Arquivos de referência

- `package.json` e `package-lock.json`: dependências e scripts.
- `app.json`: identificador e configuração Expo.
- `tsconfig.json`: configuração TypeScript.
- `src/lib/aluguel.ts`: tipos e armazenamento do marketplace.
- `src/app/index.tsx`: sessão de demonstração e tela inicial.
- `src/app/aluguel.tsx`: catálogo e criação de solicitações.
- `src/app/meus-carros.tsx`: ações do locador.
- `src/app/meus-alugueis.tsx`: acompanhamento pelo locatário.
- `android/settings.gradle`, `android/build.gradle`, `android/app/build.gradle` e `android/gradle/wrapper/gradle-wrapper.properties`: configuração do build Android.
