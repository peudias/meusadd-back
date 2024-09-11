# MeuSADD - Backend

Este repositório contém o código do backend do Sistema de Apoio ao Diagnóstico de Doenças (MeuSADD), desenvolvido para suportar a aplicação de diagnóstico de condições de saúde.

👉 **Acesse o frontend do projeto**: [meusadd-front](https://github.com/peudias/bd-lpr)

## Como Rodar o Backend Localmente

### Pré-requisitos

1. **Node.js**: Certifique-se de ter o Node.js instalado.
2. **Banco de Dados**: Configure um banco de dados MySQL (ou outro, conforme especificado) e obtenha as credenciais.

### Passos para Executar

1. Clone o repositório:
   ```bash
   git clone https://github.com/peudias/meusadd-back.git
   ```
2. Acesse o diretório do projeto:
   ```bash
   cd meusadd-back
   ```
3.Configure o arquivo `.env` com as credenciais do seu banco de dados. Exemplo de variáveis no arquivo `.env`:
  ```bash
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=sua_senha
  DB_NAME=meusadd
  ```
4.Instale as dependências:
  ```bash
  npm install
  ```
5. Inicie o servidor:
   ```bash
   npm start
   ```
6. O backend estará rodando localmente em `http://localhost:3000`.

## Rotas Disponíveis

Enquanto a instância da AWS estiver ativa, você pode acessar as seguintes rotas da API:

- [GET /api/doenca](https://meusadd-back.vercel.app/api/doenca) - Retorna dados sobre doenças.
- [GET /api/patogeno](https://meusadd-back.vercel.app/api/patogeno) - Retorna dados sobre patógenos.
- [GET /api/sintoma](https://meusadd-back.vercel.app/api/sintoma) - Retorna dados sobre sintomas.

## Tecnologias Utilizadas

- **Node.js**
- **Express.js** para gerenciamento de rotas e middleware.
- **MySQL** como banco de dados.
- **dotenv** para configuração de variáveis de ambiente.
- **Git** e **GitHub** para controle de versão.

## Como Contribuir

1. Clone o repositório:
   ```bash
   git clone https://github.com/peudias/meusadd-back.git
   ```
2. Crie uma branch para sua feature/correção:
   ```bash
   git checkout -b minha-nova-feature
   ```
3.Faça commit das suas alterações:
   ```bash
   git commit -m 'Adiciona nova feature'
   ```
4.Envie sua branch:
   ```bash
   git push origin minha-nova-feature
   ```
5.Abra um Pull Request.
