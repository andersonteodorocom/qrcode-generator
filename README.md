# Definitivo

Gerador de QR Code para imprimir e continuar usando:

- **Pix** com CPF, CNPJ, celular ou e-mail, no BR Code estático do Banco Central
- **Instagram**, abrindo o perfil
- **Wi-Fi**, com o nome da rede e a senha
- **Site**, abrindo um endereço http ou https da loja

Nada é enviado a um servidor. A chave, a senha e o usuário ficam no navegador.

## Rodar

```bash
npm install
npm run dev
```

Abra [http://127.0.0.1:3000](http://127.0.0.1:3000).

Para usar outra porta:

```bash
npm run dev -- --hostname 127.0.0.1 --port 43123
```

## Testes

```bash
npm test
```

O teste do Pix confere o exemplo oficial do Manual de Padrões para Iniciação do Pix, inclusive o CRC `1D3D`.

## O que cada QR faz

O Pix é estático: não tem data de validade e pode ser pago mais de uma vez. Com valor livre, quem paga digita o valor. Com valor fixo, o mesmo valor entra sempre. A chave precisa já estar cadastrada no banco. O app de quem paga mostra o nome dessa chave, não um apelido inventado aqui.

O Instagram é o link `https://www.instagram.com/usuario/`.

O Wi-Fi usa o formato lido pela câmera do iPhone e do Android: `WIFI:T:WPA;S:nome;P:senha;;`.

O site grava o próprio endereço. `loja.com.br` vira `https://loja.com.br`. Um `http://` escrito à mão permanece http.

## Coolify

O repositório já traz um `Dockerfile`. No Coolify:

1. Aponte o serviço para `https://github.com/andersonteodorocom/qrcode-generator.git`, branch `main`.
2. Build pack: **Dockerfile** (não Nixpacks).
3. Porta do container: **3000**.
4. Não há variável secreta. O gerador não tem backend nem `.env` obrigatório.

A imagem escuta em `0.0.0.0:3000`.
