const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Rota para obter a mensagem do voucher e o número do cliente
router.get("/voucher/:clienteId", async (req, res) => {
    try {
        const { clienteId } = req.params;

        // Busca o cliente e seu telefone
        const cliente = await prisma.Client.findUnique({
            where: { id: Number(clienteId) },
            select: {
                phone: true,
                establishmentId: true // Verifica se tem um estabelecimento associado
            }
        });

        if (!cliente) {
            return res.status(404).json({ error: "Cliente não encontrado" });
        }

        // Se o cliente não tem estabelecimento associado, define mensagem padrão
        let mensagemVoucher = "Aqui está seu voucher!";

        if (cliente.establishmentId) {
            // Busca a mensagem do voucher no estabelecimento
            const estabelecimento = await prisma.Establishment.findUnique({
                where: { id: cliente.establishmentId },
                select: { voucherMessage: true }
            });

            if (estabelecimento) {
                mensagemVoucher = estabelecimento.voucherMessage || mensagemVoucher;
            }
        }

        // Formata o número do cliente para WhatsApp
        let numeroCliente = cliente.phone.replace(/\D/g, ""); // Remove não numéricos
        if (!numeroCliente.startsWith("55")) {
            numeroCliente = "55" + numeroCliente; // Adiciona código do Brasil se necessário
        }

        res.json({
            numero: numeroCliente,
            mensagem: mensagemVoucher
        });

    } catch (error) {
        console.error("Erro ao buscar voucher:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

// Rota para resetar os pontos do cliente após o envio do voucher
router.put("/reset-points/:clienteId", async (req, res) => {
    try {
        const { clienteId } = req.params;

        // Atualiza os pontos do cliente para 0
        await prisma.Client.update({
            where: { id: Number(clienteId) },
            data: { points: 0 }
        });

        res.json({ message: "Pontos resetados com sucesso!" });

    } catch (error) {
        console.error("Erro ao resetar pontos:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

module.exports = router;
