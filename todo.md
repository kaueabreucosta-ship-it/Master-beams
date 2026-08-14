# Project TODO

- [x] Landing page cyberpunk dark premium com fundo preto, vinheta, scanlines, partículas e planeta 3D interativo com Three.js
- [x] CTAs da landing page: ENTRAR e CRIAR CONTA
- [x] Autenticação por username e senha, sem email na interface de autenticação
- [x] Cadastro com username, senha, confirmação e webhook, incluindo validações e unicidade
- [x] Hash seguro de senha e sessão persistente via cookie seguro do backend
- [x] Criar automaticamente o canal AVISOS vazio para novas contas
- [x] Modelar usuários, canais e cards com isolamento por usuário e canal
- [x] Dashboard responsivo com sidebar fixa no desktop e retrátil no mobile
- [x] Criar, selecionar e excluir canais com confirmação explícita
- [x] Criar cards por modal com título, descrição, tipo, conteúdo e imagem
- [x] Tipo PROMPT com cópia para clipboard e toast "Prompt copiado"
- [x] Tipo LINK com validação e abertura em nova aba com target seguro
- [x] Upload real de imagens via storage S3, preview, substituição, remoção e URL persistida no banco
- [x] Cards responsivos com edição, exclusão e confirmação obrigatória
- [x] Perfil com username, avatar, status, alteração de senha e webhook mascarado
- [x] Upload de avatar via storage S3
- [x] Camada de serviço de webhook sem envio automático ou exposição do segredo
- [x] Validação de uploads, URLs, inputs e autorização no backend
- [x] Não implementar contas falsas/decoys/honeypots como dados de produção; aplicar controles reais de segurança, minimização de dados e isolamento por usuário
- [x] Criar testes Vitest para autenticação, autorização, canais, cards, validação de URLs e fluxos críticos
- [x] Revisar visualmente em desktop e mobile, corrigir erros e preparar checkpoint final

- [x] Aplicar validação condicional de URL no backend para cards LINK e cobrir com teste
- [x] Implementar preview local, substituição e remoção de imagem/avatar
- [x] Implementar edição completa de cards no backend e na UI
- [x] Criar camada de serviço dedicada para webhook mascarado
- [x] Expandir testes para cadastro, login, canais, cards e URLs
- [x] Revisar visualmente também em viewport mobile e salvar checkpoint final

- [x] Aplicar validação HTTP(S) também em cards.update e testar edição inválida
- [x] Completar preview, substituição e remoção do avatar no perfil
- [x] Adicionar cobertura Vitest adicional para operações CRUD críticas
- [x] Salvar checkpoint final após todos os testes

- [x] Adicionar teste Vitest para cards.update rejeitando URL inválida
- [x] Permitir remoção real de avatar no backend e cobrir a validação
- [x] Salvar checkpoint final após concluir esses ajustes

- [x] Adicionar indicadores animados de carregamento para login, cadastro, criação e exclusão de canais, criação/edição/exclusão de cards, perfil e uploads
- [x] Melhorar mensagens de erro do backend e traduzi-las em feedback contextual no frontend
- [x] Cobrir os novos contratos de erro e estados críticos com testes
- [x] Revisar a experiência em desktop e mobile e salvar checkpoint da melhoria

- [x] Garantir edição de canais com modal, persistência e feedback de erro
- [x] Garantir exclusão de canais com confirmação, loading e atualização da seleção ativa
- [x] Garantir edição de cards com modal reaproveitável, persistência e feedback de erro
- [x] Garantir exclusão de cards com confirmação, loading e atualização da lista
- [x] Validar os fluxos em desktop e mobile e salvar novo checkpoint

- [x] Padronizar spinner e bloqueio durante upload e salvar/editar card
- [x] Tornar mensagens de login e cadastro mais contextuais
- [x] Expandir testes dos fluxos CRUD e contratos de erro desta rodada
- [x] Fazer captura desktop final e salvar checkpoint atualizado

- [ ] Renomear a interface, metadados e textos da marca para Master Beams
- [ ] Aplicar a imagem enviada como logo/avatar visual da plataforma
- [ ] Garantir canal inicial AVISOS nas contas novas e no fluxo atual
- [ ] Gerar pacote de arquivos completo para hospedagem manual, incluindo a imagem
- [ ] Testar a aplicação, atualizar checkpoint e entregar o pacote manual
