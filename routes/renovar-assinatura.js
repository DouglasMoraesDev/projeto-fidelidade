app.post('/clientes/:id/renovar-assinatura', async (req, res) => {
    const { id } = req.params;
    const hoje = new Date();
  
    try {
      await prisma.cliente.update({
        where: { id: parseInt(id) },
        data: { ultimaAssinatura: hoje },
      });
      res.json({ mensagem: 'Assinatura renovada com sucesso!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensagem: 'Erro ao renovar assinatura.' });
    }
  });
  