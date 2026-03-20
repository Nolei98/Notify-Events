import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export default async function handler(req, res) {
  try {
    // 1. Prepara a "identidade" do robô
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      // O replace abaixo garante que as quebras de linha da chave funcionem na Vercel
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // 2. Conecta na sua planilha específica
    const doc = new GoogleSpreadsheet(process.env.PLANILHA_ID, serviceAccountAuth);
    await doc.loadInfo(); 
    
    // 3. Escolhe a aba da planilha (0 é a primeira aba)
    const sheet = doc.sheetsByIndex[0]; 

    // SE O SEU SITE ESTIVER PEDINDO DADOS (LENDO)
    if (req.method === 'GET') {
      const linhas = await sheet.getRows();
      // Transforma as linhas em um formato simples para o site entender
      const dados = linhas.map(linha => linha.toObject());
      return res.status(200).json(dados);
    }

    // SE O SEU SITE ESTIVER ENVIANDO DADOS (SALVANDO)
    if (req.method === 'POST') {
      const novoDado = req.body; // Pega o que o site mandou
      await sheet.addRow(novoDado); // Adiciona uma nova linha lá no fim
      return res.status(201).json({ mensagem: 'Salvo com sucesso!' });
    }

  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Deu ruim na conexão com a planilha' });
  }
}