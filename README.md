# Bot Anti-Self

## Variáveis do Railway
- `DISCORD_TOKEN`: token secreto do bot.
- `CLIENT_ID`: ID da aplicação (Developer Portal > General Information).
- `GUILD_ID`: ID do servidor (recomendado para o comando aparecer rapidamente).

## Configuração no Discord
1. Em Developer Portal > Bot, ative **Server Members Intent** e **Message Content Intent**.
2. Convide o bot com os escopos `bot` e `applications.commands`.
3. Dê as permissões **Ban Members**, **Manage Messages**, **View Channels**, **Send Messages** e **Embed Links**.
4. Deixe o cargo do bot acima dos cargos que ele deve poder banir.

## Uso
Execute `/antiself`, escolha o canal e preencha as duas caixas: link da imagem (opcional) e texto. O bot publica o painel e protege esse canal. Administradores ficam isentos; outros membros que enviarem mensagem podem receber ban. O Discord impede banir o dono e membros com cargo igual ou acima do bot.

Atenção: escolha o canal com cuidado e teste primeiro em um canal privado. `config.json` é criado automaticamente; em hospedagem sem armazenamento persistente, a configuração pode se perder após recriação do serviço.
